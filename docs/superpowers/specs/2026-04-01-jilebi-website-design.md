# Jilebi Restaurant Website — Design Spec & Implementation Plan
**Date:** 2026-04-01
**Project:** Single-page website for Jilebi, an authentic Indian restaurant in Nürtingen, Germany

---

## Context

Jilebi is a new authentic Indian restaurant in Nürtingen, Germany. They need a bilingual (DE/EN) single-page website that serves as their primary digital presence. The site must allow guests to discover the restaurant, browse the menu, and book a table with real-time availability. No existing codebase or brand assets — everything is built from scratch.

---

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Audience | Local Germans in Nürtingen | Primary market; tourists secondary |
| Language | Bilingual DE (default) + EN (`/en/`) | `next-intl` for i18n |
| Reservation | Real-time booking (custom) | Full control, no SaaS fees, GDPR-friendly |
| Menu | Static (`menu.ts` data file) | Low maintenance, no CMS needed |
| Visual style | Warm Ivory & Gold | Modern minimal, upscale, candlelight warmth |
| Page layout | Story First | Hero → About → Speisekarte → Reservation → Gallery → Footer |

---

## Visual Identity

| Token | Value |
|---|---|
| Background | `#FDFAF5` (warm ivory) |
| Text primary | `#1C1C1C` (near-black) |
| Accent | `#C9923A` (golden amber) |
| Text muted | `#7A6E5A` (warm grey) |
| Border | `#E8E0D4` (soft sand) |
| Font — wordmark | Georgia (serif), spaced capitals |
| Font — body/UI | System sans-serif (Inter via Tailwind) |

Key details: thin golden rule as section divider, JILEBI wordmark in spaced serif caps, language switcher in nav, "Tisch reservieren" CTA always visible in nav.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Email | Resend |
| i18n | next-intl |
| Deployment | Vercel |
| Version control | GitHub |

---

## Architecture

```
Vercel
└── Next.js 14 App Router
    ├── / (single page — all sections, DE default)
    ├── /en/ (English version)
    ├── /admin (password-protected dashboard)
    └── /api/
         ├── availability (GET — returns open slots for a date)
         ├── reservations (POST — creates booking record)
         └── admin/
              ├── reservations (GET/PATCH — list and update)
              └── slots (PATCH — block/unblock time slots)

Supabase (PostgreSQL)
├── reservations
├── time_slots
└── settings

Resend
└── Transactional emails (booking confirmation, cancellation)
```

---

## Data Model

```ts
// reservations
id            uuid PK
name          text
email         text
phone         text
party_size    int
date          date
time_slot_id  uuid FK → time_slots.id
status        enum: pending | confirmed | cancelled
language      enum: de | en
notes         text nullable
created_at    timestamptz

// time_slots
id            uuid PK
day_of_week   int (0=Sun … 6=Sat)
start_time    time
end_time      time
max_capacity  int
is_blocked    boolean

// settings
key           text PK
value         text
// e.g. "max_party_size": "10", "advance_days": "30"
```

---

## Page Sections

### 1. Navigation (sticky)
- Logo: JILEBI wordmark (serif, spaced caps)
- Links: Über uns · Speisekarte · Galerie · Kontakt
- Language switcher: DE / EN
- CTA button: "Tisch reservieren" (dark background)

### 2. Hero
- Full-screen section with large food photo (right)
- Left: eyebrow label ("Authentisch Indisch · Nürtingen"), serif headline with golden italic accent, thin golden rule, tagline, two CTAs (Speisekarte + Tisch buchen)

### 3. About / Über uns
- Two-column: left = story text (bilingual), right = atmospheric photo
- Static copy — tells the restaurant's origin story

### 4. Speisekarte
- Section header + category tabs (Vorspeisen, Hauptgerichte, Desserts, Getränke)
- Each dish: name (bilingual), description, € price, dietary dot (🟢 veg, 🌶 spicy)
- Data source: `src/data/menu.ts` — edited directly, no CMS

### 5. Reservation / Tisch reservieren
- Date picker → fetches available slots from `/api/availability`
- Time slot grid (visual pill buttons)
- Form: Name, Party size (1–10), Phone, Email, Notes (optional)
- Submit → POST `/api/reservations` → instant email confirmation via Resend
- Success state with booking summary shown on-page

### 6. Gallery / Galerie
- CSS Masonry grid of food + interior photos
- Images in `/public/gallery/` — add images + update `src/data/gallery.ts`
- Click → lightbox with arrow navigation

### 7. Footer
- Opening hours grid (Mon–Sun)
- Full address + embedded Google Maps iframe
- Phone, email, Instagram, Facebook links
- Copyright + "Impressum" link (legally required in Germany)

---

## Admin Dashboard (`/admin`)

- Protected by `ADMIN_PASSWORD` env var (checked server-side, no auth library)
- Table view of reservations grouped by date
- Status badges: pending (yellow) · confirmed (green) · cancelled (grey)
- Actions: Confirm · Cancel (triggers Resend cancellation email)
- Slot management: block/unblock time slots for holidays or private events
- Fully responsive — usable on phone

---

## Bilingual (i18n)

- `next-intl` with locale files: `messages/de.json` (default) and `messages/en.json`
- DE served at `/`, EN served at `/en/`
- All UI strings, menu labels, and email templates translated
- Language switcher in nav toggles locale
- Booking confirmation email language matches guest's chosen locale

---

## Legal (Germany-specific)

- **Impressum** page (legally required for German websites) — linked in footer
- **Datenschutzerklärung** (Privacy Policy) — GDPR-compliant, linked in footer
- Google Maps embed: use `loading="lazy"` with consent-aware approach
- No analytics without cookie consent banner (keep it simple: no GA by default)

---

## File Structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── page.tsx              # Single page (all sections)
│   │   └── admin/
│   │       └── page.tsx          # Admin dashboard
│   └── api/
│       ├── availability/route.ts
│       ├── reservations/route.ts
│       └── admin/
│           ├── reservations/route.ts
│           └── slots/route.ts
├── components/
│   ├── sections/
│   │   ├── Hero.tsx
│   │   ├── About.tsx
│   │   ├── Menu.tsx
│   │   ├── Reservation.tsx
│   │   ├── Gallery.tsx
│   │   └── Footer.tsx
│   ├── ui/
│   │   ├── Nav.tsx
│   │   ├── TimeSlotPicker.tsx
│   │   ├── Lightbox.tsx
│   │   └── StatusBadge.tsx
│   └── admin/
│       ├── ReservationTable.tsx
│       └── SlotManager.tsx
├── data/
│   ├── menu.ts                   # Static menu data
│   └── gallery.ts                # Image list
├── lib/
│   ├── supabase.ts               # Supabase client
│   └── resend.ts                 # Email templates + sender
└── messages/
    ├── de.json                   # German strings
    └── en.json                   # English strings
```

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=         # e.g. reservierungen@jilebi.de
ADMIN_PASSWORD=
```

---

## Verification

1. **Local dev:** `npm run dev` → visit `http://localhost:3000`
2. **Booking flow:** Pick a date → select slot → fill form → submit → check email inbox for confirmation
3. **Admin:** Visit `/admin` → enter password → confirm a booking → check guest receives confirmation email
4. **Bilingual:** Switch to EN via nav → all strings update, URL becomes `/en/`
5. **Speisekarte:** Edit `src/data/menu.ts` → hot-reloads in dev, reflects on next deploy
6. **Gallery:** Add image to `/public/gallery/`, add entry to `src/data/gallery.ts` → appears in grid
7. **Impressum/Datenschutz:** Links in footer resolve correctly

---

## Implementation Order

1. Project scaffold (Next.js + Tailwind + next-intl + Supabase)
2. Design system tokens (colours, typography in `tailwind.config.ts`)
3. Supabase schema + seed time slots
4. API routes (availability, reservations, admin)
5. Static sections (Hero, About, Menu, Gallery, Footer)
6. Reservation section (date picker + slot grid + form + email)
7. Admin dashboard
8. German legal pages (Impressum, Datenschutz)
9. Final bilingual pass (de.json + en.json complete)
10. Deploy to Vercel
