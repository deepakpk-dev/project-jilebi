# Jilebi - Restaurant Website & Reservation System

[![CI](https://github.com/deepakpk-dev/project-jilebi/actions/workflows/ci.yml/badge.svg)](https://github.com/deepakpk-dev/project-jilebi/actions/workflows/ci.yml)

Production-style full-stack reservation platform for Jilebi, an Indian restaurant concept in Nürtingen, Germany. The project combines a bilingual marketing site, a capacity-aware booking flow, transactional email, and a protected admin dashboard backed by Supabase PostgreSQL.

**Live demo:** [project-jilebi.vercel.app](https://project-jilebi.vercel.app)  
**Primary focus:** secure reservation handling, database-level consistency, localized UX, and recruiter-readable production engineering.

## Why This Project Matters

Jilebi is more than a static restaurant page. It models the operational problems a real restaurant needs solved:

- Guests can browse the restaurant, menu, gallery, and legal pages in German or English.
- Guests can request a table only for valid dates and available time slots.
- The backend prevents overbooking even under concurrent requests.
- Confirmation and cancellation emails are sent through Resend.
- Admin users can review, confirm, and cancel reservations from a private dashboard.
- Customer data is protected with Supabase Row Level Security and server-only service-role access.

The result is a small but complete product surface with frontend polish, backend validation, database constraints, authentication, email delivery, tests, CI, and deployment configuration.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 App Router |
| Language | TypeScript |
| UI | React 18, Tailwind CSS, React DayPicker |
| Internationalization | next-intl with German and English routes |
| Database | Supabase PostgreSQL, Row Level Security, triggers |
| Email | Resend, React Email rendering |
| Testing | Jest, Testing Library, Playwright |
| Tooling | ESLint, TypeScript, Sharp image optimization |
| Deployment | Vercel |

## Features

- **Bilingual public site:** German default route with English support through locale-aware routing and message files.
- **Reservation flow:** Date picker, 30-day booking window, party-size input, notes, success state, and capacity-aware slot selection.
- **Availability API:** Calculates booked seats per slot and hides blocked slots from the guest booking flow.
- **Atomic overbooking prevention:** PostgreSQL trigger serializes capacity checks per `(date, time_slot_id)` with `pg_advisory_xact_lock`.
- **Admin dashboard:** Cookie-authenticated reservation list grouped by date, with confirm and cancel actions.
- **Transactional email:** Confirmation and cancellation emails through Resend, with `email_sent_at` tracking for admin visibility.
- **Security hardening:** Same-origin checks, rate limiting, input validation, RLS-protected tables, server-only Supabase service-role client, and httpOnly signed admin cookies.
- **Restaurant content:** Hero, about, typed menu data, gallery lightbox, dietary indicators, footer, Impressum, and Datenschutz pages.
- **Responsive UX:** Mobile navigation, accessible form states, keyboard-friendly success focus, and optimized image assets.

## Architecture

```text
Browser
  |
  |-- GET  /de or /en
  |       Localized Next.js App Router pages
  |
  |-- GET  /api/availability?date=YYYY-MM-DD
  |       Validates date window, reads slots and booked seats
  |
  |-- POST /api/reservations
  |       Same-origin check, rate limit, input validation,
  |       database insert, confirmation email, delivery tracking
  |
  |-- POST /api/admin/login
  |       Password verification, signed httpOnly session cookie
  |
  |-- GET/PATCH /api/admin/reservations
          Cookie auth, service-role database access, status updates

Supabase PostgreSQL
  |
  |-- time_slots
  |       Day-of-week slot templates, capacity, blocked flag
  |
  |-- reservations
  |       Guest PII, party size, status, email delivery timestamp
  |
  |-- settings
  |       Reservation limits and configuration
  |
  |-- check_slot_capacity()
          Trigger-level consistency guard against overbooking

Resend
  |
  |-- Confirmation and cancellation emails
```

## Technical Highlights

### Database-Level Overbooking Protection

The most important business rule is enforced in PostgreSQL, not just in the UI or API. `check_slot_capacity()` runs before reservation writes, locks the slot/date pair for the transaction, sums active reservations, rejects blocked or mismatched slots, and raises `Slot capacity exceeded` when the party would exceed capacity.

Relevant files:

- [`supabase/migrations/004_security_hardening.sql`](supabase/migrations/004_security_hardening.sql)
- [`src/app/api/reservations/route.ts`](src/app/api/reservations/route.ts)

### Defensive Supabase Access Model

The app separates public and privileged database access:

- Browser-safe client: anon key plus RLS.
- Server-only admin client: service-role key used only in route handlers and server code.
- Direct anonymous reservation inserts are disabled; all writes go through the validated Next.js API.

Relevant file:

- [`src/lib/supabase.ts`](src/lib/supabase.ts)

### Secure Admin Sessions

Admin login sets a signed `jilebi_admin_session` cookie with `httpOnly`, `sameSite=lax`, production-only `secure`, and an 8-hour expiry. Session signatures use HMAC-SHA256, and comparisons hash both values before `timingSafeEqual` so unequal lengths do not throw or expose byte-level timing behavior.

Relevant file:

- [`src/lib/auth.ts`](src/lib/auth.ts)

### Trust-Boundary Validation

The reservation endpoint validates everything before touching the database:

- required fields
- email shape
- UUID format
- real `YYYY-MM-DD` dates
- 1-30 day reservation window
- party size bounds
- locale enum
- notes and text length limits
- same-origin request checks

Capacity conflicts are returned as `409 Conflict`; malformed requests return `400`; abuse is throttled with `429`.

Relevant files:

- [`src/app/api/reservations/route.ts`](src/app/api/reservations/route.ts)
- [`src/lib/request-security.ts`](src/lib/request-security.ts)
- [`src/lib/rate-limit.ts`](src/lib/rate-limit.ts)

### Race-Free Availability UI

The reservation component aborts stale availability requests when a guest changes dates quickly. That prevents a slow response for an older date from overwriting the currently selected date's slots.

Relevant file:

- [`src/components/sections/Reservation.tsx`](src/components/sections/Reservation.tsx)

### Email Delivery Visibility

Reservation creation awaits the confirmation email in the serverless request lifecycle, then records `email_sent_at` when delivery succeeds. The admin dashboard flags active reservations without a delivery timestamp so staff can follow up manually.

Relevant files:

- [`src/lib/resend.ts`](src/lib/resend.ts)
- [`src/components/admin/ReservationTable.tsx`](src/components/admin/ReservationTable.tsx)

## Testing and Quality

The project includes layered automated checks:

- **Unit tests:** API route behavior and UI components with Jest and Testing Library.
- **E2E tests:** Playwright drives the real localized UI across desktop and mobile contexts.
- **Network mocking:** `reservation.spec.ts` intercepts Supabase-facing reservation and availability requests at the browser layer, keeping product-flow tests deterministic.
- **Full-stack journeys:** `journeys.spec.ts` drives complete guest and admin journeys through the real API routes and server actions — the booking flow, capacity-aware slots, the 409 conflict path, admin login, the confirm and slot-block actions, and logout — against a small PostgREST + Resend stand-in (`e2e/support/mock-supabase.mjs`) so no live services are needed in CI.
- **CI:** GitHub Actions runs install, lint, unit tests, production build, Playwright browser install, and E2E tests on pushes and pull requests to `master`.
- **Security hardening trail:** The migrations and API modules document the validation, auth, RLS, and consistency work directly in versioned source.

Common verification commands:

```bash
npm run lint
npm test
npm run test:e2e
npm run build
```

## Project Structure

```text
src/
  app/
    [locale]/
      page.tsx              Localized public restaurant page
      admin/                Protected admin dashboard
      datenschutz/          German privacy page
      impressum/            German legal notice
    api/
      availability/         Public availability endpoint
      reservations/         Public reservation creation endpoint
      admin/
        login/              Admin login endpoint
        reservations/       Admin list/update endpoint
        slots/              Slot block/unblock endpoint
  components/
    sections/               Public page sections
    admin/                  Admin login and reservation table
    ui/                     Shared UI components
  data/                     Typed menu and gallery data
  i18n/                     next-intl routing and request config
  lib/                      Supabase, auth, email, rate limit, request security
  messages/                 de.json and en.json translations

supabase/
  migrations/               Schema, RLS, email tracking, security hardening

e2e/
  reservation.spec.ts       Playwright booking flow and mobile navigation tests (browser-mocked)
  journeys.spec.ts          Full-stack guest + admin journeys (real API routes)
  support/
    mock-supabase.mjs       PostgREST + Resend stand-in for the journeys suite

scripts/
  optimize-images.mjs       Sharp-based image optimization
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 11 recommended, matching the lockfile resolver used in CI
- Supabase project
- Resend API key

### Install

```bash
git clone https://github.com/deepakpk-dev/project-jilebi.git
cd project-jilebi
npm install
```

### Configure Environment

Create `.env.local` from the example:

```bash
cp .env.local.example .env.local
```

Fill in:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key constrained by RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for trusted API routes |
| `RESEND_API_KEY` | Resend API key for transactional email |
| `RESEND_FROM_EMAIL` | Sender address for reservation emails |
| `ADMIN_PASSWORD` | Admin password and HMAC signing secret |
| `APP_ORIGIN` | Optional trusted origin override for same-origin checks |
| `NEXT_PUBLIC_SITE_URL` | Canonical site origin for SEO metadata (sitemap, canonical URLs, Open Graph) |

### Database Setup

Run the Supabase migrations in order:

```text
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_rls_and_overbooking.sql
supabase/migrations/003_email_sent_at.sql
supabase/migrations/004_security_hardening.sql
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root route redirects to `/de`.

### Production Build

```bash
npm run build
npm start
```

## API Overview

| Route | Method | Purpose | Auth |
| --- | --- | --- | --- |
| `/api/availability?date=YYYY-MM-DD` | GET | Return open slots and capacity state for a date | Public |
| `/api/reservations` | POST | Create a pending reservation and send confirmation email | Public, same-origin, rate-limited |
| `/api/admin/login` | POST | Create signed admin session cookie | Password |
| `/api/admin/reservations` | GET | List reservations with slot details | Admin cookie |
| `/api/admin/reservations` | PATCH | Confirm or cancel a reservation | Admin cookie |
| `/api/admin/slots` | PATCH | Block or unblock a time slot | Admin cookie |

## Data Model

Core tables:

- `time_slots`: reusable weekly slot templates with capacity and blocked state.
- `reservations`: guest booking records, party size, date, status, notes, and email tracking.
- `settings`: operational reservation settings.

Key database behavior:

- Row Level Security protects reservation data from public reads.
- Public direct reservation inserts are removed in the hardening migration.
- Trigger logic prevents overbooking and rejects invalid slot/date combinations.
- Cancelled reservations are excluded from booked-seat totals.

## Trade-Offs

- **Rate limiting:** The current limiter is in-memory and per runtime instance. It is appropriate for a low-traffic demo and has a narrow API so it can be swapped for Upstash Redis without changing route handlers.
- **Admin auth:** The dashboard uses a single-password signed-cookie model. This keeps the project focused while still demonstrating secure cookie handling. A production multi-user system would use a dedicated identity provider, role model, and password rotation flow.
- **Email reliability:** Reservation creation does not fail if email delivery fails. Instead, delivery is tracked and surfaced in the admin UI so the restaurant can follow up.
- **Locale routing:** `/de` is the default route. The root redirect is deterministic rather than Accept-Language driven.

## Recruiter Review Guide

For a quick technical review, start here:

1. Reservation API validation and email flow: [`src/app/api/reservations/route.ts`](src/app/api/reservations/route.ts)
2. Database capacity and RLS hardening: [`supabase/migrations/004_security_hardening.sql`](supabase/migrations/004_security_hardening.sql)
3. Admin session security: [`src/lib/auth.ts`](src/lib/auth.ts)
4. Reservation UI and stale-request cancellation: [`src/components/sections/Reservation.tsx`](src/components/sections/Reservation.tsx)
5. Product-level E2E coverage: [`e2e/reservation.spec.ts`](e2e/reservation.spec.ts)

These files show the main engineering decisions: validation at the API boundary, consistency at the database boundary, guarded admin access, localized frontend behavior, and tested user journeys.

## License

MIT
