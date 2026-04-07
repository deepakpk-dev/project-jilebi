# Jilebi — Restaurant Website & Booking System

A full-stack bilingual (DE/EN) restaurant website with real-time table reservations, built for an authentic Indian restaurant in Nurtingen, Germany.

**Live:** [project-jilebi.vercel.app](https://project-jilebi.vercel.app)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Email | Resend |
| i18n | next-intl (DE default + EN) |
| Deployment | Vercel |

## Features

- **Real-time reservations** — Date picker, time slot grid, capacity-aware booking with atomic overbooking prevention (Postgres trigger)
- **Bilingual** — Full DE/EN support via next-intl with locale-aware routing
- **Admin dashboard** — View, confirm, and cancel bookings with cookie-based auth (HMAC-signed httpOnly sessions)
- **Transactional email** — Booking confirmation and cancellation emails via Resend
- **Menu** — Tabbed category view with dietary indicators, served from static data
- **Gallery** — Masonry grid with lightbox navigation
- **Security** — Row Level Security on all Supabase tables, rate limiting on public endpoints, GDPR-compliant PII protection
- **Legal** — German-required Impressum and Datenschutz pages

## Architecture

```
Browser (React)
  |
  |-- GET /api/availability?date=YYYY-MM-DD   (anon key, RLS: public read on time_slots)
  |-- POST /api/reservations                   (service role, rate-limited, capacity trigger)
  |-- POST /api/admin/login                    (sets httpOnly session cookie)
  |-- GET/PATCH /api/admin/reservations        (cookie auth, service role)
  |
Supabase (PostgreSQL)
  |-- time_slots (template: day-of-week + time ranges)
  |-- reservations (PII protected by RLS — only service_role can read)
  |-- settings (max_party_size, advance_days)
  |-- check_slot_capacity() trigger (atomic overbooking guard)
  |
Resend
  |-- Confirmation + cancellation transactional emails
```

## Getting Started

```bash
# 1. Clone and install
git clone https://github.com/deepakprabh/project-jilebi.git
cd project-jilebi
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Fill in your Supabase URL, keys, Resend API key, and admin password

# 3. Set up the database
# Run both migrations in the Supabase SQL editor:
#   supabase/migrations/001_initial_schema.sql
#   supabase/migrations/002_rls_and_overbooking.sql

# 4. Start development
npm run dev        # http://localhost:3000

# 5. Run tests
npm test           # Jest — 16 tests across 6 suites

# 6. Build for production
npm run build
```

## Project Structure

```
src/
  app/
    [locale]/           # Locale-scoped pages (DE default, EN)
      admin/            # Password-protected admin dashboard
      datenschutz/      # Privacy policy (German legal requirement)
      impressum/        # Legal notice (German legal requirement)
      page.tsx          # Single-page: Hero, About, Menu, Reservation, Gallery, Footer
    api/
      availability/     # GET — returns open time slots for a date
      reservations/     # POST — creates a booking (rate-limited, capacity-checked)
      admin/
        login/          # POST — authenticates admin, sets session cookie
        reservations/   # GET/PATCH — list and update bookings
        slots/          # PATCH — block/unblock time slots
  components/
    sections/           # Page sections: Hero, About, Menu, Reservation, Gallery, Footer, Nav
    admin/              # AdminLogin, ReservationTable
    ui/                 # TimeSlotPicker, Lightbox, StatusBadge, GoldenRule
  data/                 # Static data: menu items, gallery image list
  i18n/                 # Routing, request config, navigation helpers
  lib/                  # Supabase client, Resend templates, auth, rate limiting
  messages/             # de.json, en.json — all UI strings
supabase/
  migrations/           # 001: schema + seed, 002: RLS + overbooking trigger
```

## Environment Variables

See `.env.local.example` for the full list:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (public, RLS-enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only, bypasses RLS) |
| `RESEND_API_KEY` | Resend API key for transactional emails |
| `RESEND_FROM_EMAIL` | Sender address for booking emails |
| `ADMIN_PASSWORD` | Admin dashboard login password |

## License

MIT
