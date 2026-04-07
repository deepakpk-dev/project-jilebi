# CLAUDE.md — Jilebi Restaurant Website

## Project Overview

Bilingual (DE/EN) restaurant website with real-time table reservations. Next.js 14 App Router, TypeScript, Tailwind CSS, Supabase, Resend, next-intl. Deployed on Vercel.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server at http://localhost:3000 |
| `npm run build` | Production build (must pass before pushing) |
| `npm run lint` | ESLint with next/core-web-vitals |
| `npm test` | Jest — 16 tests across 6 suites |
| `npm run test:watch` | Jest watch mode |

Always run `npm run lint`, `npm test`, and `npm run build` before committing.

## Architecture

- **Pages:** Single-page app at `src/app/[locale]/page.tsx` with section components (Hero, About, Menu, Reservation, Gallery, Footer)
- **API routes:** `src/app/api/` — availability (GET, public), reservations (POST, rate-limited), admin (cookie-auth)
- **Admin:** `src/app/[locale]/admin/` — cookie-based auth, server actions for status updates
- **Legal:** `src/app/[locale]/impressum/` and `datenschutz/` (German legal requirements)

## i18n

- Locales: `de` (default), `en` — configured in `src/i18n/routing.ts`
- Messages: `src/messages/de.json` and `en.json`
- Navigation helpers: `src/i18n/navigation.ts` (use these `Link`, `usePathname`, `useRouter` instead of next/navigation for locale-aware routing)
- Every page/layout that uses translations must call `setRequestLocale(locale)` before `useTranslations()`

## Styling

Tailwind with custom design tokens in `tailwind.config.ts`:

| Token | Value | Usage |
|-------|-------|-------|
| `ivory` | #FDFAF5 | Page background |
| `charcoal` | #1C1C1C | Primary text, dark buttons |
| `gold` | #C9923A | Accent, CTAs, hover states |
| `muted` | #7A6E5A | Secondary text |
| `sand` | #E8E0D4 | Borders, dividers |

Utility classes defined in `globals.css`: `.section-padding`, `.section-title`, `.gold-rule`, `.btn-primary`, `.btn-outline`

Font: Georgia (serif) for headings, Inter/system-ui (sans) for body. Uppercase tracking (`tracking-widest`, `tracking-brand`) for labels and nav.

## Supabase

- Two clients in `src/lib/supabase.ts`: `getSupabase()` (anon key, RLS-enforced) and `getSupabaseAdmin()` (service role, bypasses RLS)
- Use `getSupabase()` for public reads (availability, time_slots)
- Use `getSupabaseAdmin()` for writes and admin reads (reservations contain PII)
- RLS policies: reservations only readable by service_role; time_slots and settings public read
- Overbooking prevention: Postgres trigger `check_slot_capacity()` runs on insert/update — no need for application-level locks
- Migrations: `supabase/migrations/001_initial_schema.sql` (schema + seed), `002_rls_and_overbooking.sql` (RLS + trigger)

## Auth

Admin uses HMAC-signed httpOnly cookie sessions (not bearer tokens):
- Login: `POST /api/admin/login` sets cookie via `loginAdmin()` in `src/lib/auth.ts`
- Verification: `isAdminSession()` for server components, `isAdminAuthorized()` for API routes
- 8-hour expiry, secure in production, sameSite=lax
- Never pass the raw password after login — use the cookie

## API Patterns

- Public endpoints use `getSupabase()` (anon key)
- Admin endpoints check `isAdminAuthorized(req)` via cookie
- `POST /api/reservations` is rate-limited (5/min/IP via `src/lib/rate-limit.ts`)
- Capacity errors from the Postgres trigger return 409 Conflict
- Confirmation emails are fire-and-forget: `sendConfirmationEmail(reservation).catch(console.error)`

## Testing

- Jest + Testing Library, config in `jest.config.ts`
- Mock Supabase as functions: `getSupabase: () => ({ from: mockFrom })` — NOT object exports
- Mock Resend and rate-limit modules to isolate tests
- API route tests use `@jest-environment node`; component tests use jsdom
- Test files live next to source: `route.test.ts`, `Component.test.tsx`

## Environment Variables

Copy `.env.local.example` to `.env.local`. Required:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public, embedded in client
- `SUPABASE_SERVICE_ROLE_KEY` — server-only, never expose to client
- `RESEND_API_KEY` / `RESEND_FROM_EMAIL` — email sending
- `ADMIN_PASSWORD` — admin dashboard login

## Key Conventions

- Section components: `'use client'` only when needed (forms, interactivity). Use `useTranslations('section-key')` for all text.
- UI components: stateless, accept typed props, use `type="button"` on all non-submit buttons inside forms
- API routes: validate required fields, return structured `{ error }` or `{ data }` JSON with appropriate status codes
- Imports: use `@/` path alias (maps to `src/`)
- No `console.log` for debugging — only `console.error` in `.catch()` handlers for fire-and-forget operations
