# Jilebi — Restaurant Website & Reservation System

[![CI](https://github.com/deepakprabh/project-jilebi/actions/workflows/ci.yml/badge.svg)](https://github.com/deepakprabh/project-jilebi/actions/workflows/ci.yml)

Full-stack bilingual (DE/EN) restaurant platform with real-time table reservations, row-level-security-backed data access, and a cookie-authenticated admin dashboard. Built for an authentic Indian restaurant in Nürtingen, Germany.

**Live:** [project-jilebi.vercel.app](https://project-jilebi.vercel.app)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL + RLS + triggers) |
| Email | Resend |
| i18n | next-intl (DE default + EN) |
| Deployment | Vercel |

## Technical Highlights

These are the parts worth reading — each one solves a real production problem:

### Atomic overbooking prevention at the database layer
Concurrent `INSERT`s against the same time slot can't overcommit capacity — a Postgres trigger (`check_slot_capacity`) re-sums party sizes inside the insert transaction and raises `Slot capacity exceeded` before the row commits. The API then translates that into a clean `409 Conflict`. No distributed locks, no optimistic retries.

→ [`supabase/migrations/002_rls_and_overbooking.sql`](supabase/migrations/002_rls_and_overbooking.sql)
→ [`src/app/api/reservations/route.ts`](src/app/api/reservations/route.ts)

### Two Supabase clients, defensive by default
The public client uses the **anon key** and is constrained by Row Level Security. The admin client uses the **service role** and is only ever called from server code. Reservation rows are literally unreadable without service role — the PII surface is sealed off at the database, not just at the API.

→ [`src/lib/supabase.ts`](src/lib/supabase.ts)

### HMAC-signed, httpOnly session cookies
Admin auth doesn't live in localStorage or a bearer token. Login sets a signed `jilebi_admin_session` cookie (HMAC-SHA256 over timestamp, 8h expiry). All comparisons are length-safe via SHA-256-then-`timingSafeEqual`, so unequal inputs don't throw *and* don't leak byte-level timing.

→ [`src/lib/auth.ts`](src/lib/auth.ts)

### Input validation at the trust boundary
The reservation POST endpoint doesn't trust the client UI — every field is typechecked, regex-matched (UUID, ISO date, email), and bounds-checked (`party_size` 1–10, `language` enum) before touching the database. DB errors become `400` on input shape and `409` on capacity.

→ [`src/app/api/reservations/route.ts`](src/app/api/reservations/route.ts)

### Race-free availability fetching
The date-picker spawns a new availability request on every selection. An `AbortController` cancels any in-flight request so a slow response can't overwrite a newer one.

→ [`src/components/sections/Reservation.tsx`](src/components/sections/Reservation.tsx)

### Transactional email with delivery tracking
Confirmation emails are fired asynchronously so a Resend outage can't break the booking flow. On success, `email_sent_at` is written back to the reservation row — the admin dashboard flags undelivered confirmations with a badge.

→ [`src/lib/resend.ts`](src/lib/resend.ts)

### HTML-escape everywhere user input touches HTML
Email templates HTML-escape every interpolated field (`name`, `notes`, formatted date). Prevents tracking-pixel injection and phishing-style forwards.

### Rate limiting
Public reservation endpoint is rate-limited to 5 requests per IP per minute via a sliding-window limiter. Per-instance today (documented trade-off); the swap path to Upstash Redis is noted in the module header.

→ [`src/lib/rate-limit.ts`](src/lib/rate-limit.ts)

### Tested end-to-end with mocked network
Playwright specs under [`e2e/`](e2e/) drive the real UI across desktop and mobile viewports. Supabase and Resend are intercepted via `page.route()`, so the test proves the *product flow* — availability lookup, slot selection, form submission, success state — without brittle external dependencies. Unit tests under `src/app/api/**` cover the API routes themselves.

### Self-reviewed
A full code review of the first pass is checked in at [`code-review.md`](code-review.md) with 10 findings across security, validation, and i18n, all closed across four commits. This is part of the project, not a separate artifact.

## Features

- **Real-time reservations** — date picker, capacity-aware time slot grid, 30-day booking horizon
- **Bilingual** — full DE/EN support via `next-intl` with locale-aware routing helpers
- **Admin dashboard** — view / confirm / cancel bookings, flagged undelivered emails
- **Transactional email** — confirmation and cancellation emails via Resend
- **Menu** — tabbed categories with dietary indicators, served from typed static data
- **Gallery** — masonry grid with keyboard-navigable lightbox
- **Legal** — German-required Impressum and Datenschutz pages
- **Mobile-first** — responsive hamburger nav, optimized hero and gallery images

## Architecture

```
Browser (React Server/Client Components)
  │
  ├── GET  /api/availability?date=YYYY-MM-DD   anon key, RLS: public read on time_slots
  ├── POST /api/reservations                   rate-limited, capacity trigger, Resend fire-and-forget
  ├── POST /api/admin/login                    sets HMAC-signed httpOnly cookie
  └── GET/PATCH /api/admin/reservations        cookie auth, service role
       │
Supabase (PostgreSQL)
  │
  ├── time_slots                               template: day-of-week + time + capacity
  ├── reservations                             PII; RLS blocks everything except service_role
  ├── settings                                 max_party_size, advance_days
  └── check_slot_capacity() TRIGGER            BEFORE INSERT/UPDATE — atomic overbooking guard
  │
Resend
  └── Confirmation / cancellation emails       sendConfirmationEmail() returns boolean; caller
                                               records delivery timestamp for admin visibility
```

## Getting Started

```bash
# 1. Clone and install
git clone https://github.com/deepakprabh/project-jilebi.git
cd project-jilebi
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Fill in Supabase URL + keys, Resend API key, admin password

# 3. Set up the database
# Run all three migrations in the Supabase SQL editor:
#   supabase/migrations/001_initial_schema.sql
#   supabase/migrations/002_rls_and_overbooking.sql
#   supabase/migrations/003_email_sent_at.sql

# 4. Develop
npm run dev        # http://localhost:3000

# 5. Verify
npm run lint       # ESLint
npm test           # Jest — 18 unit tests / 6 suites
npm run test:e2e   # Playwright — reservation flow + mobile nav, desktop + mobile viewports
npm run build      # production build
```

## Project Structure

```
src/
  app/
    [locale]/           locale-scoped pages (DE default, EN)
      admin/            password-protected admin dashboard
      datenschutz/      privacy policy (German legal requirement)
      impressum/        legal notice (German legal requirement)
      page.tsx          single-page: Hero · About · Menu · Reservation · Gallery · Footer
    api/
      availability/     GET — open slots for a date
      reservations/     POST — create a booking
      admin/
        login/          POST — admin auth
        reservations/   GET/PATCH — list + update bookings
        slots/          PATCH — block/unblock slots
  components/
    sections/           page sections
    admin/              AdminLogin, ReservationTable
    ui/                 TimeSlotPicker, Lightbox, StatusBadge, GoldenRule
  data/                 static data (menu, gallery)
  i18n/                 routing, request config, locale-aware navigation
  lib/                  Supabase clients, Resend, auth, rate limiting
  messages/             de.json, en.json — all UI strings
supabase/
  migrations/           001 schema · 002 RLS + overbooking · 003 email tracking
scripts/
  optimize-images.mjs   JPEG compression pipeline (sharp + mozjpeg)
```

## Environment Variables

See `.env.local.example`:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public, RLS-enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only, bypasses RLS) |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` | Sender address for booking emails |
| `ADMIN_PASSWORD` | Admin dashboard password (also HMAC secret) |

## Trade-offs Documented in Code

- `src/lib/rate-limit.ts` — in-memory per-instance limiter. On Vercel Fluid Compute, effective limit is roughly `N × limit` across replicas. Upstash Redis swap path noted.
- `src/app/page.tsx` — root redirect to `/de` is deterministic rather than Accept-Language-driven. Product decision, not a bug.
- `check_slot_capacity()` — plpgsql-level check is safe under normal concurrency. At very high concurrent write load, wrap in `SERIALIZABLE` or take an advisory lock per `(date, time_slot_id)`.

## License

MIT
