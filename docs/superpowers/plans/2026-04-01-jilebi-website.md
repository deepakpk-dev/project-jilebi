# Jilebi Restaurant Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a bilingual (DE/EN) single-page restaurant website for Jilebi in Nürtingen with real-time table reservation, static Speisekarte, photo gallery, and a password-protected admin dashboard.

**Architecture:** Next.js 14 App Router with locale-based routing (`/` = DE default, `/en/` = EN) via next-intl. A custom booking system backed by Supabase PostgreSQL handles slot availability and reservation creation. Resend sends bilingual transactional emails. `/admin` is protected by an env-var password with no auth library.

**Tech Stack:** Next.js 14 · TypeScript · Tailwind CSS · Supabase (@supabase/supabase-js v2) · Resend · next-intl v3 · react-day-picker v8 · date-fns v3 · Jest · React Testing Library

---

## File Map

```
Project Jilebi/
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx            # Root layout with Nav, locale provider
│   │   │   ├── page.tsx              # Single page — all sections
│   │   │   ├── admin/
│   │   │   │   └── page.tsx          # Admin dashboard (server component)
│   │   │   ├── impressum/
│   │   │   │   └── page.tsx          # Impressum (German legal requirement)
│   │   │   └── datenschutz/
│   │   │       └── page.tsx          # Datenschutzerklärung
│   │   └── api/
│   │       ├── availability/
│   │       │   └── route.ts          # GET /api/availability?date=YYYY-MM-DD
│   │       ├── reservations/
│   │       │   └── route.ts          # POST /api/reservations
│   │       └── admin/
│   │           ├── reservations/
│   │           │   └── route.ts      # GET + PATCH /api/admin/reservations
│   │           └── slots/
│   │               └── route.ts      # PATCH /api/admin/slots
│   ├── components/
│   │   ├── sections/
│   │   │   ├── Nav.tsx               # Sticky nav with language switcher + CTA
│   │   │   ├── Hero.tsx              # Full-screen hero section
│   │   │   ├── About.tsx             # Two-column story section
│   │   │   ├── Menu.tsx              # Tabbed Speisekarte
│   │   │   ├── Reservation.tsx       # Date picker + slot grid + form
│   │   │   ├── Gallery.tsx           # Masonry grid + lightbox
│   │   │   └── Footer.tsx            # Hours, address, socials
│   │   ├── ui/
│   │   │   ├── TimeSlotPicker.tsx    # Pill-button slot grid
│   │   │   ├── Lightbox.tsx          # Full-screen image overlay
│   │   │   ├── StatusBadge.tsx       # Reservation status chip
│   │   │   └── GoldenRule.tsx        # Thin golden horizontal rule
│   │   └── admin/
│   │       ├── ReservationTable.tsx  # Grouped reservation list
│   │       └── SlotManager.tsx       # Block/unblock time slots
│   ├── data/
│   │   ├── menu.ts                   # Static menu items
│   │   └── gallery.ts                # Image filename list
│   ├── lib/
│   │   ├── supabase.ts               # Supabase client (browser + server)
│   │   ├── resend.ts                 # Email sender + templates
│   │   └── auth.ts                   # Admin password check helper
│   └── messages/
│       ├── de.json                   # All German UI strings
│       └── en.json                   # All English UI strings
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql    # time_slots, reservations, settings tables
├── middleware.ts                     # next-intl locale routing
├── i18n.ts                           # next-intl config
├── tailwind.config.ts                # Design tokens
├── jest.config.ts
├── jest.setup.ts
└── .env.local                        # Env vars (not committed)
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `next.config.ts`
- Create: `jest.config.ts`, `jest.setup.ts`
- Create: `.env.local`, `.env.local.example`
- Create: `.gitignore`

- [ ] **Step 1: Scaffold Next.js project**

From the `Project Jilebi` directory:
```bash
npx create-next-app@14 . --typescript --tailwind --app --src-dir --no-eslint --import-alias "@/*"
```
Answer prompts: Yes to TypeScript, Yes to Tailwind, Yes to App Router, Yes to src/, No to ESLint (we add it manually if needed).

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install @supabase/supabase-js resend next-intl react-day-picker date-fns
```

- [ ] **Step 3: Install dev dependencies**

```bash
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @types/jest ts-jest
```

- [ ] **Step 4: Configure Jest**

Create `jest.config.ts`:
```ts
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

export default createJestConfig(config)
```

Create `jest.setup.ts`:
```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Create env files**

Create `.env.local.example`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=reservierungen@jilebi.de
ADMIN_PASSWORD=
```

Create `.env.local` — fill in your actual values (never commit this file).

- [ ] **Step 6: Create folder structure**

```bash
mkdir -p src/app/api/availability src/app/api/reservations src/app/api/admin/reservations src/app/api/admin/slots
mkdir -p src/components/sections src/components/ui src/components/admin
mkdir -p src/data src/lib src/messages
mkdir -p src/app/\[locale\]/admin src/app/\[locale\]/impressum src/app/\[locale\]/datenschutz
mkdir -p supabase/migrations
```

- [ ] **Step 7: Verify dev server starts**

```bash
npm run dev
```
Expected: Server running at `http://localhost:3000` with Next.js default page.

- [ ] **Step 8: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Next.js 14 project with TypeScript, Tailwind, Jest"
```

---

## Task 2: Design System Tokens

**Files:**
- Modify: `tailwind.config.ts`
- Create: `src/app/globals.css`

- [ ] **Step 1: Configure Tailwind with Jilebi tokens**

Replace `tailwind.config.ts`:
```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#FDFAF5',
        charcoal: '#1C1C1C',
        gold: '#C9923A',
        muted: '#7A6E5A',
        sand: '#E8E0D4',
      },
      fontFamily: {
        serif: ['Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        widest: '0.3em',
        brand: '0.25em',
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 2: Set base styles**

Replace `src/app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    scroll-behavior: smooth;
  }
  body {
    @apply bg-ivory text-charcoal font-sans;
  }
}

@layer components {
  .section-padding {
    @apply px-6 py-20 md:px-16 lg:px-24;
  }
  .section-title {
    @apply font-serif text-4xl font-normal tracking-brand text-charcoal uppercase;
  }
  .gold-rule {
    @apply block w-12 h-px bg-gold my-5;
  }
  .btn-primary {
    @apply bg-charcoal text-ivory px-6 py-3 text-xs tracking-widest uppercase font-sans hover:bg-gold transition-colors duration-200;
  }
  .btn-outline {
    @apply border border-gold text-gold px-6 py-3 text-xs tracking-widest uppercase font-sans hover:bg-gold hover:text-ivory transition-colors duration-200;
  }
}
```

- [ ] **Step 3: Verify tokens compile**

```bash
npm run dev
```
Expected: No Tailwind errors in terminal.

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.ts src/app/globals.css
git commit -m "feat: add Jilebi design system tokens (ivory, gold, charcoal)"
```

---

## Task 3: next-intl Setup

**Files:**
- Create: `i18n.ts`
- Create: `middleware.ts`
- Create: `src/messages/de.json`
- Create: `src/messages/en.json`
- Create: `src/app/[locale]/layout.tsx`
- Modify: `next.config.ts`

- [ ] **Step 1: Create i18n config**

Create `i18n.ts`:
```ts
import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./src/messages/${locale}.json`)).default,
}))
```

- [ ] **Step 2: Create middleware for locale routing**

Create `middleware.ts`:
```ts
import createMiddleware from 'next-intl/middleware'

export default createMiddleware({
  locales: ['de', 'en'],
  defaultLocale: 'de',
})

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
```

- [ ] **Step 3: Update next.config.ts**

Replace `next.config.ts`:
```ts
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

/** @type {import('next').NextConfig} */
const nextConfig = {}

export default withNextIntl(nextConfig)
```

- [ ] **Step 4: Create German message file**

Create `src/messages/de.json`:
```json
{
  "nav": {
    "about": "Über uns",
    "menu": "Speisekarte",
    "gallery": "Galerie",
    "contact": "Kontakt",
    "reserve": "Tisch reservieren",
    "lang": "EN"
  },
  "hero": {
    "eyebrow": "Authentisch Indisch · Nürtingen",
    "headline": "Willkommen bei",
    "headline_accent": "Jilebi",
    "tagline": "Erleben Sie die Aromen Indiens — handwerklich zubereitet, mit Leidenschaft serviert.",
    "cta_menu": "Speisekarte",
    "cta_reserve": "Tisch buchen"
  },
  "about": {
    "label": "Unsere Geschichte",
    "title": "Mehr als ein Restaurant",
    "body": "Jilebi wurde aus einer tiefen Leidenschaft für die Küche Indiens geboren. Jedes Gericht erzählt eine Geschichte — von gewürzduftenden Märkten, von Familienrezepten, die über Generationen weitergegeben wurden, und von dem Wunsch, echte indische Gastfreundschaft nach Nürtingen zu bringen. Wir verwenden frische, handverlesene Zutaten und bereiten alles täglich frisch zu."
  },
  "menu": {
    "label": "Unsere Küche",
    "title": "Speisekarte",
    "categories": {
      "starters": "Vorspeisen",
      "mains": "Hauptgerichte",
      "desserts": "Desserts",
      "drinks": "Getränke"
    },
    "veg": "Vegetarisch",
    "spicy": "Scharf"
  },
  "reservation": {
    "label": "Tisch reservieren",
    "title": "Einen Tisch buchen",
    "date_label": "Datum wählen",
    "slot_label": "Uhrzeit wählen",
    "no_slots": "Keine freien Tische an diesem Tag.",
    "form": {
      "name": "Ihr Name",
      "party_size": "Personenanzahl",
      "email": "E-Mail-Adresse",
      "phone": "Telefonnummer",
      "notes": "Anmerkungen (optional)",
      "submit": "Jetzt reservieren"
    },
    "success_title": "Reservierung erhalten!",
    "success_body": "Wir haben Ihre Anfrage erhalten und werden Ihnen eine Bestätigung per E-Mail senden.",
    "error": "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut."
  },
  "gallery": {
    "label": "Einblicke",
    "title": "Galerie"
  },
  "footer": {
    "hours_title": "Öffnungszeiten",
    "address_title": "Adresse",
    "follow": "Folgen Sie uns",
    "impressum": "Impressum",
    "datenschutz": "Datenschutz",
    "copyright": "© 2026 Jilebi. Alle Rechte vorbehalten."
  },
  "email": {
    "confirm_subject": "Ihre Reservierung bei Jilebi — Bestätigung",
    "confirm_greeting": "Vielen Dank für Ihre Reservierung!",
    "confirm_body": "Wir freuen uns auf Ihren Besuch. Hier sind Ihre Buchungsdetails:",
    "cancel_subject": "Ihre Reservierung bei Jilebi — Stornierung",
    "cancel_body": "Ihre Reservierung wurde leider storniert. Bitte kontaktieren Sie uns für eine neue Buchung."
  }
}
```

- [ ] **Step 5: Create English message file**

Create `src/messages/en.json`:
```json
{
  "nav": {
    "about": "About",
    "menu": "Menu",
    "gallery": "Gallery",
    "contact": "Contact",
    "reserve": "Reserve a Table",
    "lang": "DE"
  },
  "hero": {
    "eyebrow": "Authentic Indian · Nürtingen",
    "headline": "Welcome to",
    "headline_accent": "Jilebi",
    "tagline": "Experience the flavours of India — crafted with care, served with passion.",
    "cta_menu": "View Menu",
    "cta_reserve": "Book a Table"
  },
  "about": {
    "label": "Our Story",
    "title": "More Than a Restaurant",
    "body": "Jilebi was born from a deep love for Indian cuisine. Each dish tells a story — of spice-scented markets, of family recipes passed down through generations, and of a desire to bring authentic Indian hospitality to Nürtingen. We use fresh, hand-picked ingredients and prepare everything daily from scratch."
  },
  "menu": {
    "label": "Our Kitchen",
    "title": "Menu",
    "categories": {
      "starters": "Starters",
      "mains": "Mains",
      "desserts": "Desserts",
      "drinks": "Drinks"
    },
    "veg": "Vegetarian",
    "spicy": "Spicy"
  },
  "reservation": {
    "label": "Reserve a Table",
    "title": "Book a Table",
    "date_label": "Choose a date",
    "slot_label": "Choose a time",
    "no_slots": "No tables available on this day.",
    "form": {
      "name": "Your name",
      "party_size": "Party size",
      "email": "Email address",
      "phone": "Phone number",
      "notes": "Notes (optional)",
      "submit": "Reserve Now"
    },
    "success_title": "Reservation received!",
    "success_body": "We have received your request and will send you a confirmation by email.",
    "error": "Something went wrong. Please try again."
  },
  "gallery": {
    "label": "A Glimpse Inside",
    "title": "Gallery"
  },
  "footer": {
    "hours_title": "Opening Hours",
    "address_title": "Address",
    "follow": "Follow Us",
    "impressum": "Legal Notice",
    "datenschutz": "Privacy Policy",
    "copyright": "© 2026 Jilebi. All rights reserved."
  },
  "email": {
    "confirm_subject": "Your reservation at Jilebi — Confirmation",
    "confirm_greeting": "Thank you for your reservation!",
    "confirm_body": "We look forward to welcoming you. Here are your booking details:",
    "cancel_subject": "Your reservation at Jilebi — Cancellation",
    "cancel_body": "Unfortunately your reservation has been cancelled. Please contact us to make a new booking."
  }
}
```

- [ ] **Step 6: Create root locale layout**

Create `src/app/[locale]/layout.tsx`:
```tsx
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import '../globals.css'

const locales = ['de', 'en']

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!locales.includes(locale)) notFound()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 7: Create placeholder page**

Create `src/app/[locale]/page.tsx`:
```tsx
export default function HomePage() {
  return <main><h1>Jilebi</h1></main>
}
```

- [ ] **Step 8: Verify locale routing works**

```bash
npm run dev
```
Visit `http://localhost:3000` → should show "Jilebi"
Visit `http://localhost:3000/en` → should also show "Jilebi"

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "feat: configure next-intl with DE/EN locale routing"
```

---

## Task 4: Supabase Schema & Client

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `src/lib/supabase.ts`

- [ ] **Step 1: Create database migration**

Create `supabase/migrations/001_initial_schema.sql`:
```sql
-- Enums
create type reservation_status as enum ('pending', 'confirmed', 'cancelled');
create type reservation_language as enum ('de', 'en');

-- Time slots (template: one row per day-of-week + time combination)
create table time_slots (
  id uuid primary key default gen_random_uuid(),
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  max_capacity int not null default 20,
  is_blocked boolean not null default false
);

-- Reservations
create table reservations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  party_size int not null check (party_size between 1 and 10),
  date date not null,
  time_slot_id uuid not null references time_slots(id),
  status reservation_status not null default 'pending',
  language reservation_language not null default 'de',
  notes text,
  created_at timestamptz not null default now()
);

-- Settings
create table settings (
  key text primary key,
  value text not null
);

insert into settings (key, value) values
  ('max_party_size', '10'),
  ('advance_days', '30');

-- Seed time slots (Tue–Sun, lunch 12–14, dinner 18–22)
-- Tuesday = 2, Wednesday = 3, Thursday = 4, Friday = 5, Saturday = 6, Sunday = 0
insert into time_slots (day_of_week, start_time, end_time) values
  (0, '12:00', '14:00'), (0, '18:00', '20:00'), (0, '20:00', '22:00'),
  (2, '12:00', '14:00'), (2, '18:00', '20:00'), (2, '20:00', '22:00'),
  (3, '12:00', '14:00'), (3, '18:00', '20:00'), (3, '20:00', '22:00'),
  (4, '12:00', '14:00'), (4, '18:00', '20:00'), (4, '20:00', '22:00'),
  (5, '12:00', '14:00'), (5, '18:00', '20:00'), (5, '20:00', '22:00'),
  (6, '12:00', '14:00'), (6, '18:00', '20:00'), (6, '20:00', '22:00');
-- Monday (1) intentionally omitted = closed
```

- [ ] **Step 2: Run migration in Supabase**

Go to your [Supabase project](https://supabase.com) → SQL Editor → paste and run the migration SQL above.

Verify in Table Editor: `time_slots` has 18 rows, `reservations` is empty, `settings` has 2 rows.

- [ ] **Step 3: Create Supabase client**

Create `src/lib/supabase.ts`:
```ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Browser client — safe to expose, uses anon key + RLS
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-only client — uses service role key, bypasses RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
```

- [ ] **Step 4: Commit**

```bash
git add supabase/ src/lib/supabase.ts
git commit -m "feat: add Supabase schema, migrations, and client"
```

---

## Task 5: API — Availability Route

**Files:**
- Create: `src/app/api/availability/route.ts`
- Create: `src/app/api/availability/route.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/api/availability/route.test.ts`:
```ts
import { GET } from './route'
import { NextRequest } from 'next/server'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
  },
}))

import { supabase } from '@/lib/supabase'

describe('GET /api/availability', () => {
  it('returns 400 when date param is missing', async () => {
    const req = new NextRequest('http://localhost/api/availability')
    const res = await GET(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('date parameter required')
  })

  it('returns available slots for a valid date', async () => {
    const mockSlots = [
      { id: 'slot-1', start_time: '18:00', end_time: '20:00', max_capacity: 20, is_blocked: false },
    ]
    const mockReservations = [
      { time_slot_id: 'slot-1', party_size: 5 },
    ]

    ;(supabase.from as jest.Mock)
      .mockImplementationOnce(() => ({
        select: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: mockSlots, error: null }) }) }),
      }))
      .mockImplementationOnce(() => ({
        select: () => ({ eq: () => ({ in: () => Promise.resolve({ data: mockReservations, error: null }) }) }),
      }))

    const req = new NextRequest('http://localhost/api/availability?date=2026-04-15')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.slots).toHaveLength(1)
    expect(body.slots[0].available).toBe(true)
    expect(body.slots[0].booked).toBe(5)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/app/api/availability/route.test.ts --no-coverage
```
Expected: FAIL — "Cannot find module './route'"

- [ ] **Step 3: Implement the route**

Create `src/app/api/availability/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')
  if (!date) {
    return NextResponse.json({ error: 'date parameter required' }, { status: 400 })
  }

  const dayOfWeek = new Date(date).getDay()

  // Fetch template slots for this day of week
  const { data: slots, error: slotsError } = await supabase
    .from('time_slots')
    .select('*')
    .eq('day_of_week', dayOfWeek)
    .eq('is_blocked', false)

  if (slotsError) {
    return NextResponse.json({ error: slotsError.message }, { status: 500 })
  }

  if (!slots || slots.length === 0) {
    return NextResponse.json({ slots: [] })
  }

  const slotIds = slots.map((s) => s.id)

  // Count booked party sizes per slot for this date
  const { data: reservations, error: resError } = await supabase
    .from('reservations')
    .select('time_slot_id, party_size')
    .eq('date', date)
    .in('time_slot_id', slotIds)

  if (resError) {
    return NextResponse.json({ error: resError.message }, { status: 500 })
  }

  const bookedBySlot: Record<string, number> = {}
  for (const r of reservations ?? []) {
    bookedBySlot[r.time_slot_id] = (bookedBySlot[r.time_slot_id] ?? 0) + r.party_size
  }

  const result = slots.map((slot) => ({
    id: slot.id,
    start_time: slot.start_time,
    end_time: slot.end_time,
    max_capacity: slot.max_capacity,
    booked: bookedBySlot[slot.id] ?? 0,
    available: (bookedBySlot[slot.id] ?? 0) < slot.max_capacity,
  }))

  return NextResponse.json({ slots: result })
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/app/api/availability/route.test.ts --no-coverage
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/availability/
git commit -m "feat: add availability API route with slot capacity tracking"
```

---

## Task 6: API — Reservations Route

**Files:**
- Create: `src/app/api/reservations/route.ts`
- Create: `src/app/api/reservations/route.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/api/reservations/route.test.ts`:
```ts
import { POST } from './route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}))
jest.mock('@/lib/resend', () => ({
  sendConfirmationEmail: jest.fn().mockResolvedValue(undefined),
}))

import { supabaseAdmin } from '@/lib/supabase'

const validBody = {
  name: 'Maria Müller',
  email: 'maria@example.de',
  phone: '+49 7022 123456',
  party_size: 2,
  date: '2026-04-15',
  time_slot_id: 'slot-uuid-123',
  notes: '',
  language: 'de',
}

describe('POST /api/reservations', () => {
  it('returns 400 when required fields are missing', async () => {
    const req = new NextRequest('http://localhost/api/reservations', {
      method: 'POST',
      body: JSON.stringify({ name: 'Maria' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('creates a reservation and returns 201', async () => {
    const mockInsert = {
      data: [{ ...validBody, id: 'res-uuid-1', status: 'pending', created_at: new Date().toISOString() }],
      error: null,
    }
    ;(supabaseAdmin.from as jest.Mock).mockReturnValue({
      insert: () => ({ select: () => Promise.resolve(mockInsert) }),
    })

    const req = new NextRequest('http://localhost/api/reservations', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.reservation.id).toBe('res-uuid-1')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/app/api/reservations/route.test.ts --no-coverage
```
Expected: FAIL — "Cannot find module './route'"

- [ ] **Step 3: Implement the route**

Create `src/app/api/reservations/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendConfirmationEmail } from '@/lib/resend'

const REQUIRED_FIELDS = ['name', 'email', 'phone', 'party_size', 'date', 'time_slot_id', 'language']

export async function POST(req: NextRequest) {
  const body = await req.json()

  const missing = REQUIRED_FIELDS.filter((f) => body[f] == null || body[f] === '')
  if (missing.length > 0) {
    return NextResponse.json({ error: `Missing fields: ${missing.join(', ')}` }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('reservations')
    .insert({
      name: body.name,
      email: body.email,
      phone: body.phone,
      party_size: body.party_size,
      date: body.date,
      time_slot_id: body.time_slot_id,
      language: body.language,
      notes: body.notes ?? null,
      status: 'pending',
    })
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const reservation = data[0]

  // Fire-and-forget confirmation email
  sendConfirmationEmail(reservation).catch(console.error)

  return NextResponse.json({ reservation }, { status: 201 })
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/app/api/reservations/route.test.ts --no-coverage
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/reservations/
git commit -m "feat: add reservations POST API route"
```

---

## Task 7: API — Admin Routes

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/admin/reservations/route.ts`
- Create: `src/app/api/admin/slots/route.ts`

- [ ] **Step 1: Create admin auth helper**

Create `src/lib/auth.ts`:
```ts
import { NextRequest } from 'next/server'

export function isAdminAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return false
  const token = authHeader.slice(7)
  return token === process.env.ADMIN_PASSWORD
}
```

- [ ] **Step 2: Create admin reservations route**

Create `src/app/api/admin/reservations/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdminAuthorized } from '@/lib/auth'
import { sendCancellationEmail } from '@/lib/resend'

export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('reservations')
    .select('*, time_slots(start_time, end_time)')
    .order('date', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reservations: data })
}

export async function PATCH(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, status } = await req.json()
  if (!id || !status) {
    return NextResponse.json({ error: 'id and status required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('reservations')
    .update({ status })
    .eq('id', id)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const reservation = data[0]
  if (status === 'cancelled') {
    sendCancellationEmail(reservation).catch(console.error)
  }

  return NextResponse.json({ reservation })
}
```

- [ ] **Step 3: Create admin slots route**

Create `src/app/api/admin/slots/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdminAuthorized } from '@/lib/auth'

export async function PATCH(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, is_blocked } = await req.json()
  if (!id || is_blocked == null) {
    return NextResponse.json({ error: 'id and is_blocked required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('time_slots')
    .update({ is_blocked })
    .eq('id', id)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ slot: data[0] })
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth.ts src/app/api/admin/
git commit -m "feat: add admin API routes for reservation management and slot blocking"
```

---

## Task 8: Resend Email Templates

**Files:**
- Create: `src/lib/resend.ts`

- [ ] **Step 1: Create email sender with bilingual templates**

Create `src/lib/resend.ts`:
```ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'reservierungen@jilebi.de'

type Reservation = {
  id: string
  name: string
  email: string
  date: string
  language: 'de' | 'en'
  party_size: number
  notes?: string | null
  time_slots?: { start_time: string; end_time: string } | null
}

function formatDate(date: string, locale: string) {
  return new Date(date).toLocaleDateString(locale === 'en' ? 'en-GB' : 'de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export async function sendConfirmationEmail(reservation: Reservation) {
  const isDE = reservation.language !== 'en'
  const subject = isDE
    ? 'Ihre Reservierung bei Jilebi — Bestätigung'
    : 'Your reservation at Jilebi — Confirmation'

  const html = isDE
    ? `<p>Liebe(r) ${reservation.name},</p>
       <p>vielen Dank für Ihre Reservierung bei <strong>Jilebi</strong>.</p>
       <p><strong>Datum:</strong> ${formatDate(reservation.date, 'de')}<br>
       <strong>Uhrzeit:</strong> ${reservation.time_slots?.start_time ?? ''} – ${reservation.time_slots?.end_time ?? ''}<br>
       <strong>Personen:</strong> ${reservation.party_size}</p>
       <p>Wir freuen uns auf Ihren Besuch!</p>
       <p>Ihr Jilebi-Team<br>Nürtingen</p>`
    : `<p>Dear ${reservation.name},</p>
       <p>Thank you for reserving a table at <strong>Jilebi</strong>.</p>
       <p><strong>Date:</strong> ${formatDate(reservation.date, 'en')}<br>
       <strong>Time:</strong> ${reservation.time_slots?.start_time ?? ''} – ${reservation.time_slots?.end_time ?? ''}<br>
       <strong>Guests:</strong> ${reservation.party_size}</p>
       <p>We look forward to welcoming you!</p>
       <p>The Jilebi Team<br>Nürtingen</p>`

  await resend.emails.send({ from: FROM, to: reservation.email, subject, html })
}

export async function sendCancellationEmail(reservation: Reservation) {
  const isDE = reservation.language !== 'en'
  const subject = isDE
    ? 'Ihre Reservierung bei Jilebi — Stornierung'
    : 'Your reservation at Jilebi — Cancellation'

  const html = isDE
    ? `<p>Liebe(r) ${reservation.name},</p>
       <p>Ihre Reservierung am ${formatDate(reservation.date, 'de')} wurde leider storniert.</p>
       <p>Bitte kontaktieren Sie uns für eine neue Buchung.</p>
       <p>Ihr Jilebi-Team</p>`
    : `<p>Dear ${reservation.name},</p>
       <p>Unfortunately your reservation on ${formatDate(reservation.date, 'en')} has been cancelled.</p>
       <p>Please contact us to make a new booking.</p>
       <p>The Jilebi Team</p>`

  await resend.emails.send({ from: FROM, to: reservation.email, subject, html })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/resend.ts
git commit -m "feat: add bilingual Resend email templates for confirmations and cancellations"
```

---

## Task 9: Static Data Files

**Files:**
- Create: `src/data/menu.ts`
- Create: `src/data/gallery.ts`

- [ ] **Step 1: Create menu data**

Create `src/data/menu.ts`:
```ts
export type DietaryFlag = 'veg' | 'spicy' | 'veg-spicy'

export type MenuItem = {
  id: string
  nameDE: string
  nameEN: string
  descDE: string
  descEN: string
  price: number
  dietary?: DietaryFlag
}

export type MenuCategory = 'starters' | 'mains' | 'desserts' | 'drinks'

export const menu: Record<MenuCategory, MenuItem[]> = {
  starters: [
    {
      id: 'samosa',
      nameDE: 'Samosa (2 Stück)',
      nameEN: 'Samosa (2 pcs)',
      descDE: 'Knusprige Teigtaschen mit gewürzten Kartoffeln und Erbsen',
      descEN: 'Crispy pastry filled with spiced potatoes and peas',
      price: 6.9,
      dietary: 'veg',
    },
    {
      id: 'chicken-tikka',
      nameDE: 'Chicken Tikka',
      nameEN: 'Chicken Tikka',
      descDE: 'Marinierte Hähnchenspieße aus dem Tandoor-Ofen',
      descEN: 'Marinated chicken skewers from the tandoor oven',
      price: 10.9,
    },
    {
      id: 'onion-bhaji',
      nameDE: 'Zwiebelküchlein',
      nameEN: 'Onion Bhaji',
      descDE: 'Frittierte Zwiebelringe in Kichererbsenteig mit Koriander',
      descEN: 'Fried onion rings in chickpea batter with coriander',
      price: 7.5,
      dietary: 'veg',
    },
  ],
  mains: [
    {
      id: 'butter-chicken',
      nameDE: 'Butter Chicken',
      nameEN: 'Butter Chicken',
      descDE: 'Zartes Hähnchen in cremiger Tomaten-Butter-Sauce',
      descEN: 'Tender chicken in a creamy tomato-butter sauce',
      price: 16.9,
    },
    {
      id: 'palak-paneer',
      nameDE: 'Palak Paneer',
      nameEN: 'Palak Paneer',
      descDE: 'Hausgemachter Frischkäse in würziger Spinatsauce',
      descEN: 'Homemade cottage cheese in a spiced spinach sauce',
      price: 14.9,
      dietary: 'veg',
    },
    {
      id: 'lamb-rogan-josh',
      nameDE: 'Lammrogan Josh',
      nameEN: 'Lamb Rogan Josh',
      descDE: 'Geschmortes Lammfleisch in aromatischer Kaschmir-Sauce',
      descEN: 'Braised lamb in aromatic Kashmiri sauce',
      price: 19.9,
      dietary: 'spicy',
    },
    {
      id: 'dal-makhani',
      nameDE: 'Dal Makhani',
      nameEN: 'Dal Makhani',
      descDE: 'Schwarze Linsen langsam gegart mit Butter und Gewürzen',
      descEN: 'Black lentils slow-cooked with butter and spices',
      price: 13.9,
      dietary: 'veg',
    },
  ],
  desserts: [
    {
      id: 'gulab-jamun',
      nameDE: 'Gulab Jamun',
      nameEN: 'Gulab Jamun',
      descDE: 'Milchteigbällchen in Rosenwasser-Zuckersirup',
      descEN: 'Milk dough balls in rose water sugar syrup',
      price: 5.9,
      dietary: 'veg',
    },
    {
      id: 'kulfi',
      nameDE: 'Pistazien-Kulfi',
      nameEN: 'Pistachio Kulfi',
      descDE: 'Traditionelles indisches Eis mit Pistazien und Kardamom',
      descEN: 'Traditional Indian ice cream with pistachios and cardamom',
      price: 5.5,
      dietary: 'veg',
    },
  ],
  drinks: [
    {
      id: 'mango-lassi',
      nameDE: 'Mango-Lassi',
      nameEN: 'Mango Lassi',
      descDE: 'Erfrischend mit Mango und Joghurt',
      descEN: 'Refreshing mango and yoghurt drink',
      price: 4.5,
      dietary: 'veg',
    },
    {
      id: 'masala-chai',
      nameDE: 'Masala Chai',
      nameEN: 'Masala Chai',
      descDE: 'Gewürztee mit Ingwer, Zimt und Kardamom',
      descEN: 'Spiced tea with ginger, cinnamon and cardamom',
      price: 3.5,
      dietary: 'veg',
    },
    {
      id: 'kingfisher',
      nameDE: 'Kingfisher Bier',
      nameEN: 'Kingfisher Beer',
      descDE: 'Indisches Lagerbier, 0,33 l',
      descEN: 'Indian lager beer, 330 ml',
      price: 4.9,
    },
  ],
}
```

- [ ] **Step 2: Create gallery data**

Create `src/data/gallery.ts`:
```ts
// Add your actual image filenames to /public/gallery/
// Format: { src: filename, alt: { de: string, en: string } }
export type GalleryImage = {
  src: string
  alt: { de: string; en: string }
}

export const galleryImages: GalleryImage[] = [
  { src: 'butter-chicken.jpg', alt: { de: 'Butter Chicken', en: 'Butter Chicken' } },
  { src: 'interior-1.jpg', alt: { de: 'Restaurantinnenraum', en: 'Restaurant interior' } },
  { src: 'tandoor.jpg', alt: { de: 'Tandoor-Ofen', en: 'Tandoor oven' } },
  { src: 'thali.jpg', alt: { de: 'Thali-Gericht', en: 'Thali plate' } },
  { src: 'dessert.jpg', alt: { de: 'Gulab Jamun Dessert', en: 'Gulab Jamun dessert' } },
  { src: 'interior-2.jpg', alt: { de: 'Tischdekoration', en: 'Table setting' } },
]
```

Add placeholder images to `public/gallery/` — you can use any `.jpg` files for now and replace with real photos later.

- [ ] **Step 3: Commit**

```bash
git add src/data/
git commit -m "feat: add static menu and gallery data"
```

---

## Task 10: Nav Component

**Files:**
- Create: `src/components/sections/Nav.tsx`

- [ ] **Step 1: Build Nav**

Create `src/components/sections/Nav.tsx`:
```tsx
'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Nav() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()

  const altLocale = locale === 'de' ? 'en' : 'de'
  const altPath = locale === 'de' ? `/en${pathname}` : pathname.replace(/^\/en/, '') || '/'

  const navLinks = [
    { href: '#about', label: t('about') },
    { href: '#menu', label: t('menu') },
    { href: '#gallery', label: t('gallery') },
    { href: '#contact', label: t('contact') },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-ivory/95 backdrop-blur-sm border-b border-sand">
      <div className="max-w-7xl mx-auto px-6 md:px-16 h-16 flex items-center justify-between">
        {/* Wordmark */}
        <Link href={locale === 'de' ? '/' : '/en'} className="font-serif text-lg tracking-brand uppercase text-charcoal">
          Jilebi
        </Link>

        {/* Nav links — hidden on mobile */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs tracking-widest uppercase text-muted hover:text-charcoal transition-colors"
            >
              {link.label}
            </a>
          ))}
          <Link
            href={altPath}
            className="text-xs tracking-widest uppercase text-gold hover:text-charcoal transition-colors"
          >
            {t('lang')}
          </Link>
        </div>

        {/* CTA */}
        <a href="#reservation" className="btn-primary text-xs hidden md:inline-block">
          {t('reserve')}
        </a>

        {/* Mobile: language + CTA only */}
        <div className="flex md:hidden items-center gap-4">
          <Link href={altPath} className="text-xs tracking-widest uppercase text-gold">
            {t('lang')}
          </Link>
          <a href="#reservation" className="btn-primary text-xs">
            {t('reserve')}
          </a>
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Add Nav to layout**

Edit `src/app/[locale]/layout.tsx` — add Nav import and render before `{children}`:
```tsx
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Nav from '@/components/sections/Nav'
import '../globals.css'

const locales = ['de', 'en']

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!locales.includes(locale)) notFound()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <Nav />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```
Visit `http://localhost:3000` — sticky nav visible with "JILEBI" wordmark, links, language toggle, and CTA button.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/Nav.tsx src/app/\[locale\]/layout.tsx
git commit -m "feat: add sticky bilingual Nav with language switcher"
```

---

## Task 11: GoldenRule UI Component

**Files:**
- Create: `src/components/ui/GoldenRule.tsx`

- [ ] **Step 1: Create component**

Create `src/components/ui/GoldenRule.tsx`:
```tsx
export default function GoldenRule({ className = '' }: { className?: string }) {
  return <span className={`gold-rule ${className}`} aria-hidden="true" />
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/GoldenRule.tsx
git commit -m "feat: add GoldenRule divider UI component"
```

---

## Task 12: Hero Section

**Files:**
- Create: `src/components/sections/Hero.tsx`

- [ ] **Step 1: Build Hero**

Create `src/components/sections/Hero.tsx`:
```tsx
import { useTranslations } from 'next-intl'
import GoldenRule from '@/components/ui/GoldenRule'

export default function Hero() {
  const t = useTranslations('hero')

  return (
    <section className="min-h-[calc(100vh-4rem)] flex items-center section-padding bg-ivory">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Text */}
        <div>
          <p className="text-xs tracking-widest uppercase text-gold mb-4">{t('eyebrow')}</p>
          <h1 className="font-serif text-5xl md:text-6xl font-normal text-charcoal leading-tight mb-2">
            {t('headline')}
          </h1>
          <h1 className="font-serif text-5xl md:text-6xl font-normal italic text-gold leading-tight">
            {t('headline_accent')}
          </h1>
          <GoldenRule className="mt-6" />
          <p className="text-muted text-sm leading-relaxed max-w-md mt-4 mb-8">{t('tagline')}</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="#menu" className="btn-primary">{t('cta_menu')}</a>
            <a href="#reservation" className="btn-outline">{t('cta_reserve')}</a>
          </div>
        </div>

        {/* Hero image placeholder */}
        <div className="relative h-80 lg:h-[480px] bg-sand rounded-sm overflow-hidden flex items-center justify-center">
          {/* Replace with: <Image src="/hero.jpg" alt="Jilebi signature dish" fill className="object-cover" /> */}
          <p className="text-xs tracking-widest uppercase text-muted">Hero photo</p>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Wire into page**

Replace `src/app/[locale]/page.tsx`:
```tsx
import Hero from '@/components/sections/Hero'

export default function HomePage() {
  return (
    <main>
      <Hero />
    </main>
  )
}
```

- [ ] **Step 3: Verify**

```bash
npm run dev
```
Visit `http://localhost:3000` — hero visible with headline, golden accent, and CTAs.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/Hero.tsx src/app/\[locale\]/page.tsx
git commit -m "feat: add Hero section with bilingual headline and CTAs"
```

---

## Task 13: About Section

**Files:**
- Create: `src/components/sections/About.tsx`

- [ ] **Step 1: Build About**

Create `src/components/sections/About.tsx`:
```tsx
import { useTranslations } from 'next-intl'
import GoldenRule from '@/components/ui/GoldenRule'

export default function About() {
  const t = useTranslations('about')

  return (
    <section id="about" className="section-padding bg-white">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Atmosphere image placeholder */}
        <div className="h-80 lg:h-[420px] bg-sand rounded-sm flex items-center justify-center order-2 lg:order-1">
          {/* Replace with: <Image src="/about.jpg" alt="Jilebi interior" fill className="object-cover rounded-sm" /> */}
          <p className="text-xs tracking-widest uppercase text-muted">Atmosphere photo</p>
        </div>

        {/* Text */}
        <div className="order-1 lg:order-2">
          <p className="text-xs tracking-widest uppercase text-gold mb-4">{t('label')}</p>
          <h2 className="section-title mb-2">{t('title')}</h2>
          <GoldenRule />
          <p className="text-muted text-sm leading-relaxed mt-4">{t('body')}</p>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Add to page**

Edit `src/app/[locale]/page.tsx`:
```tsx
import Hero from '@/components/sections/Hero'
import About from '@/components/sections/About'

export default function HomePage() {
  return (
    <main>
      <Hero />
      <About />
    </main>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/About.tsx src/app/\[locale\]/page.tsx
git commit -m "feat: add About section with story text"
```

---

## Task 14: Menu Section

**Files:**
- Create: `src/components/sections/Menu.tsx`

- [ ] **Step 1: Build Menu**

Create `src/components/sections/Menu.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { menu, MenuCategory } from '@/data/menu'
import GoldenRule from '@/components/ui/GoldenRule'

export default function Menu() {
  const t = useTranslations('menu')
  const locale = useLocale()
  const [activeCategory, setActiveCategory] = useState<MenuCategory>('starters')

  const categories: MenuCategory[] = ['starters', 'mains', 'desserts', 'drinks']

  return (
    <section id="menu" className="section-padding bg-ivory">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs tracking-widest uppercase text-gold mb-4">{t('label')}</p>
        <h2 className="section-title mb-2">{t('title')}</h2>
        <GoldenRule />

        {/* Category tabs */}
        <div className="flex gap-1 mt-8 mb-10 border-b border-sand">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-3 text-xs tracking-widest uppercase transition-colors ${
                activeCategory === cat
                  ? 'text-charcoal border-b-2 border-gold -mb-px'
                  : 'text-muted hover:text-charcoal'
              }`}
            >
              {t(`categories.${cat}`)}
            </button>
          ))}
        </div>

        {/* Menu items */}
        <div className="divide-y divide-sand">
          {menu[activeCategory].map((item) => (
            <div key={item.id} className="py-5 flex justify-between items-start gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-charcoal">
                    {locale === 'en' ? item.nameEN : item.nameDE}
                  </span>
                  {item.dietary === 'veg' && (
                    <span className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" title={t('veg')} />
                  )}
                  {item.dietary === 'spicy' && (
                    <span className="text-xs" title={t('spicy')}>🌶</span>
                  )}
                  {item.dietary === 'veg-spicy' && (
                    <>
                      <span className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" title={t('veg')} />
                      <span className="text-xs" title={t('spicy')}>🌶</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  {locale === 'en' ? item.descEN : item.descDE}
                </p>
              </div>
              <span className="text-sm font-medium text-charcoal flex-shrink-0">
                €{item.price.toFixed(2).replace('.', ',')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Add to page**

Edit `src/app/[locale]/page.tsx`:
```tsx
import Hero from '@/components/sections/Hero'
import About from '@/components/sections/About'
import Menu from '@/components/sections/Menu'

export default function HomePage() {
  return (
    <main>
      <Hero />
      <About />
      <Menu />
    </main>
  )
}
```

- [ ] **Step 3: Verify**

```bash
npm run dev
```
Tabs switch between categories. Prices show with comma decimal. Green dot on vegetarian items.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/Menu.tsx src/app/\[locale\]/page.tsx
git commit -m "feat: add tabbed bilingual Speisekarte section"
```

---

## Task 15: TimeSlotPicker UI Component

**Files:**
- Create: `src/components/ui/TimeSlotPicker.tsx`
- Create: `src/components/ui/TimeSlotPicker.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/ui/TimeSlotPicker.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import TimeSlotPicker from './TimeSlotPicker'

const slots = [
  { id: '1', start_time: '18:00', end_time: '20:00', max_capacity: 20, booked: 5, available: true },
  { id: '2', start_time: '20:00', end_time: '22:00', max_capacity: 20, booked: 20, available: false },
]

describe('TimeSlotPicker', () => {
  it('renders available and unavailable slots', () => {
    render(<TimeSlotPicker slots={slots} selected={null} onSelect={jest.fn()} />)
    expect(screen.getByText('18:00 – 20:00')).toBeInTheDocument()
    expect(screen.getByText('20:00 – 22:00')).toBeInTheDocument()
  })

  it('calls onSelect with slot id when available slot is clicked', () => {
    const onSelect = jest.fn()
    render(<TimeSlotPicker slots={slots} selected={null} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('18:00 – 20:00'))
    expect(onSelect).toHaveBeenCalledWith('1')
  })

  it('does not call onSelect when unavailable slot is clicked', () => {
    const onSelect = jest.fn()
    render(<TimeSlotPicker slots={slots} selected={null} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('20:00 – 22:00'))
    expect(onSelect).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/components/ui/TimeSlotPicker.test.tsx --no-coverage
```
Expected: FAIL — "Cannot find module './TimeSlotPicker'"

- [ ] **Step 3: Implement component**

Create `src/components/ui/TimeSlotPicker.tsx`:
```tsx
export type Slot = {
  id: string
  start_time: string
  end_time: string
  max_capacity: number
  booked: number
  available: boolean
}

type Props = {
  slots: Slot[]
  selected: string | null
  onSelect: (id: string) => void
}

export default function TimeSlotPicker({ slots, selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      {slots.map((slot) => (
        <button
          key={slot.id}
          onClick={() => slot.available && onSelect(slot.id)}
          disabled={!slot.available}
          aria-pressed={selected === slot.id}
          className={`px-5 py-3 text-xs tracking-widest uppercase border transition-colors ${
            !slot.available
              ? 'border-sand text-sand cursor-not-allowed'
              : selected === slot.id
              ? 'border-gold bg-gold text-ivory'
              : 'border-charcoal text-charcoal hover:border-gold hover:text-gold'
          }`}
        >
          {slot.start_time} – {slot.end_time}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/components/ui/TimeSlotPicker.test.tsx --no-coverage
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/TimeSlotPicker.tsx src/components/ui/TimeSlotPicker.test.tsx
git commit -m "feat: add TimeSlotPicker component with available/unavailable states"
```

---

## Task 16: Reservation Section

**Files:**
- Create: `src/components/sections/Reservation.tsx`

- [ ] **Step 1: Build Reservation section**

Create `src/components/sections/Reservation.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { DayPicker } from 'react-day-picker'
import { format, addDays, isBefore, startOfToday } from 'date-fns'
import { de, enGB } from 'date-fns/locale'
import 'react-day-picker/dist/style.css'
import GoldenRule from '@/components/ui/GoldenRule'
import TimeSlotPicker, { Slot } from '@/components/ui/TimeSlotPicker'

type FormState = {
  name: string
  party_size: string
  email: string
  phone: string
  notes: string
}

export default function Reservation() {
  const t = useTranslations('reservation')
  const locale = useLocale()

  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({ name: '', party_size: '2', email: '', phone: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const today = startOfToday()
  const maxDate = addDays(today, 30)

  async function handleDateSelect(date: Date | undefined) {
    setSelectedDate(date)
    setSelectedSlotId(null)
    if (!date) return
    setLoadingSlots(true)
    try {
      const res = await fetch(`/api/availability?date=${format(date, 'yyyy-MM-dd')}`)
      const data = await res.json()
      setSlots(data.slots ?? [])
    } catch {
      setSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDate || !selectedSlotId) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          party_size: parseInt(form.party_size, 10),
          date: format(selectedDate, 'yyyy-MM-dd'),
          time_slot_id: selectedSlotId,
          language: locale,
        }),
      })
      if (!res.ok) throw new Error()
      setSuccess(true)
    } catch {
      setError(t('error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="reservation" className="section-padding bg-white">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs tracking-widest uppercase text-gold mb-4">{t('label')}</p>
        <h2 className="section-title mb-2">{t('title')}</h2>
        <GoldenRule />

        {success ? (
          <div className="mt-10 p-8 border border-gold max-w-lg">
            <h3 className="font-serif text-xl text-charcoal mb-2">{t('success_title')}</h3>
            <p className="text-sm text-muted">{t('success_body')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left: date + slot */}
            <div>
              <p className="text-xs tracking-widest uppercase text-muted mb-4">{t('date_label')}</p>
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={[{ before: addDays(today, 1) }, { after: maxDate }]}
                locale={locale === 'en' ? enGB : de}
                className="rdp-jilebi"
              />

              {selectedDate && (
                <div className="mt-6">
                  <p className="text-xs tracking-widest uppercase text-muted mb-3">{t('slot_label')}</p>
                  {loadingSlots ? (
                    <p className="text-xs text-muted">...</p>
                  ) : slots.length === 0 ? (
                    <p className="text-xs text-muted">{t('no_slots')}</p>
                  ) : (
                    <TimeSlotPicker slots={slots} selected={selectedSlotId} onSelect={setSelectedSlotId} />
                  )}
                </div>
              )}
            </div>

            {/* Right: form */}
            <div className="flex flex-col gap-4">
              {[
                { key: 'name', type: 'text', required: true },
                { key: 'email', type: 'email', required: true },
                { key: 'phone', type: 'tel', required: true },
              ].map(({ key, type, required }) => (
                <input
                  key={key}
                  type={type}
                  required={required}
                  placeholder={t(`form.${key}`)}
                  value={form[key as keyof FormState]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="border-b border-sand bg-transparent pb-2 text-sm text-charcoal placeholder-muted focus:border-gold focus:outline-none transition-colors"
                />
              ))}

              <select
                value={form.party_size}
                onChange={(e) => setForm({ ...form, party_size: e.target.value })}
                className="border-b border-sand bg-transparent pb-2 text-sm text-charcoal focus:border-gold focus:outline-none transition-colors"
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n} {t('form.party_size')}</option>
                ))}
              </select>

              <textarea
                placeholder={t('form.notes')}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="border-b border-sand bg-transparent pb-2 text-sm text-charcoal placeholder-muted focus:border-gold focus:outline-none transition-colors resize-none"
              />

              {error && <p className="text-red-500 text-xs">{error}</p>}

              <button
                type="submit"
                disabled={!selectedDate || !selectedSlotId || submitting}
                className="btn-primary mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? '...' : t('form.submit')}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Add to page**

Edit `src/app/[locale]/page.tsx`:
```tsx
import Hero from '@/components/sections/Hero'
import About from '@/components/sections/About'
import Menu from '@/components/sections/Menu'
import Reservation from '@/components/sections/Reservation'

export default function HomePage() {
  return (
    <main>
      <Hero />
      <About />
      <Menu />
      <Reservation />
    </main>
  )
}
```

- [ ] **Step 3: Verify booking flow**

```bash
npm run dev
```
1. Pick a future date — slots appear
2. Select a slot — it highlights gold
3. Fill in the form and submit
4. Success state appears
5. Check your email inbox for the confirmation

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/Reservation.tsx src/app/\[locale\]/page.tsx
git commit -m "feat: add real-time reservation section with date picker, slot grid, and form"
```

---

## Task 17: Gallery Section & Lightbox

**Files:**
- Create: `src/components/ui/Lightbox.tsx`
- Create: `src/components/sections/Gallery.tsx`

- [ ] **Step 1: Build Lightbox**

Create `src/components/ui/Lightbox.tsx`:
```tsx
'use client'

import { useEffect } from 'react'
import Image from 'next/image'

type Props = {
  src: string
  alt: string
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

export default function Lightbox({ src, alt, onClose, onPrev, onNext }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, onPrev, onNext])

  return (
    <div
      className="fixed inset-0 z-50 bg-charcoal/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button onClick={onPrev} className="absolute left-4 text-ivory text-3xl px-4 py-2" aria-label="Previous">‹</button>
      <div className="relative w-full max-w-3xl max-h-[80vh] mx-8" onClick={(e) => e.stopPropagation()}>
        <Image src={`/gallery/${src}`} alt={alt} width={900} height={600} className="object-contain w-full h-full" />
      </div>
      <button onClick={onNext} className="absolute right-4 text-ivory text-3xl px-4 py-2" aria-label="Next">›</button>
      <button onClick={onClose} className="absolute top-4 right-4 text-ivory text-2xl px-3 py-1" aria-label="Close">✕</button>
    </div>
  )
}
```

- [ ] **Step 2: Build Gallery section**

Create `src/components/sections/Gallery.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import Image from 'next/image'
import { galleryImages } from '@/data/gallery'
import GoldenRule from '@/components/ui/GoldenRule'
import Lightbox from '@/components/ui/Lightbox'

export default function Gallery() {
  const t = useTranslations('gallery')
  const locale = useLocale()
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  return (
    <section id="gallery" className="section-padding bg-ivory">
      <div className="max-w-7xl mx-auto">
        <p className="text-xs tracking-widest uppercase text-gold mb-4">{t('label')}</p>
        <h2 className="section-title mb-2">{t('title')}</h2>
        <GoldenRule />

        <div className="mt-10 columns-2 md:columns-3 gap-4">
          {galleryImages.map((img, i) => (
            <div
              key={img.src}
              className="break-inside-avoid mb-4 cursor-pointer overflow-hidden rounded-sm group"
              onClick={() => setLightboxIndex(i)}
            >
              <div className="relative aspect-square bg-sand">
                <Image
                  src={`/gallery/${img.src}`}
                  alt={locale === 'en' ? img.alt.en : img.alt.de}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          src={galleryImages[lightboxIndex].src}
          alt={locale === 'en' ? galleryImages[lightboxIndex].alt.en : galleryImages[lightboxIndex].alt.de}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((lightboxIndex - 1 + galleryImages.length) % galleryImages.length)}
          onNext={() => setLightboxIndex((lightboxIndex + 1) % galleryImages.length)}
        />
      )}
    </section>
  )
}
```

- [ ] **Step 3: Add to page**

Edit `src/app/[locale]/page.tsx`:
```tsx
import Hero from '@/components/sections/Hero'
import About from '@/components/sections/About'
import Menu from '@/components/sections/Menu'
import Reservation from '@/components/sections/Reservation'
import Gallery from '@/components/sections/Gallery'

export default function HomePage() {
  return (
    <main>
      <Hero />
      <About />
      <Menu />
      <Reservation />
      <Gallery />
    </main>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/Gallery.tsx src/components/ui/Lightbox.tsx src/app/\[locale\]/page.tsx
git commit -m "feat: add Gallery section with masonry grid and keyboard-navigable lightbox"
```

---

## Task 18: Footer

**Files:**
- Create: `src/components/sections/Footer.tsx`

- [ ] **Step 1: Build Footer**

Create `src/components/sections/Footer.tsx`:
```tsx
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'

const HOURS = [
  { dayDE: 'Montag', dayEN: 'Monday', hours: null },
  { dayDE: 'Dienstag', dayEN: 'Tuesday', hours: '12:00 – 14:00 / 18:00 – 22:00' },
  { dayDE: 'Mittwoch', dayEN: 'Wednesday', hours: '12:00 – 14:00 / 18:00 – 22:00' },
  { dayDE: 'Donnerstag', dayEN: 'Thursday', hours: '12:00 – 14:00 / 18:00 – 22:00' },
  { dayDE: 'Freitag', dayEN: 'Friday', hours: '12:00 – 14:00 / 18:00 – 22:00' },
  { dayDE: 'Samstag', dayEN: 'Saturday', hours: '12:00 – 14:00 / 18:00 – 22:00' },
  { dayDE: 'Sonntag', dayEN: 'Sunday', hours: '12:00 – 14:00 / 18:00 – 22:00' },
]

export default function Footer() {
  const t = useTranslations('footer')
  const locale = useLocale()
  const closedLabel = locale === 'en' ? 'Closed' : 'Geschlossen'

  return (
    <footer id="contact" className="bg-charcoal text-ivory section-padding">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* Brand */}
        <div>
          <div className="font-serif text-2xl tracking-brand uppercase mb-3">Jilebi</div>
          <p className="text-xs text-ivory/50 leading-relaxed">
            {locale === 'en' ? 'Authentic Indian Restaurant · Nürtingen' : 'Authentisches Indisches Restaurant · Nürtingen'}
          </p>
          <div className="flex gap-4 mt-6">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-xs tracking-widest uppercase text-ivory/50 hover:text-gold transition-colors">Instagram</a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="text-xs tracking-widest uppercase text-ivory/50 hover:text-gold transition-colors">Facebook</a>
          </div>
        </div>

        {/* Hours */}
        <div>
          <p className="text-xs tracking-widest uppercase text-gold mb-4">{t('hours_title')}</p>
          <div className="space-y-1">
            {HOURS.map((h) => (
              <div key={h.dayDE} className="flex justify-between text-xs text-ivory/70">
                <span>{locale === 'en' ? h.dayEN : h.dayDE}</span>
                <span className={!h.hours ? 'text-ivory/30' : ''}>{h.hours ?? closedLabel}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Address + contact */}
        <div>
          <p className="text-xs tracking-widest uppercase text-gold mb-4">{t('address_title')}</p>
          <address className="not-italic text-xs text-ivory/70 leading-relaxed mb-4">
            Jilebi<br />
            Musterstraße 1<br />
            72622 Nürtingen<br />
            Deutschland
          </address>
          <a href="tel:+4970221234567" className="block text-xs text-ivory/70 hover:text-gold transition-colors mb-1">+49 7022 123 456</a>
          <a href="mailto:info@jilebi.de" className="block text-xs text-ivory/70 hover:text-gold transition-colors">info@jilebi.de</a>

          {/* Google Maps embed */}
          <div className="mt-4 rounded-sm overflow-hidden h-32">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2633.0!2d9.337!3d48.628!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDjCsDM3JzQxLjAiTiA5wrAyMCcxMy4yIkU!5e0!3m2!1sde!2sde!4v1000000000000!5m2!1sde!2sde"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Jilebi location"
            />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-ivory/10 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-xs text-ivory/30">{t('copyright')}</p>
        <div className="flex gap-6">
          <Link href={locale === 'en' ? '/en/impressum' : '/impressum'} className="text-xs text-ivory/30 hover:text-ivory transition-colors">
            {t('impressum')}
          </Link>
          <Link href={locale === 'en' ? '/en/datenschutz' : '/datenschutz'} className="text-xs text-ivory/30 hover:text-ivory transition-colors">
            {t('datenschutz')}
          </Link>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 2: Add to page and finalize page.tsx**

Replace `src/app/[locale]/page.tsx` with the complete final version:
```tsx
import Hero from '@/components/sections/Hero'
import About from '@/components/sections/About'
import Menu from '@/components/sections/Menu'
import Reservation from '@/components/sections/Reservation'
import Gallery from '@/components/sections/Gallery'
import Footer from '@/components/sections/Footer'

export default function HomePage() {
  return (
    <main>
      <Hero />
      <About />
      <Menu />
      <Reservation />
      <Gallery />
      <Footer />
    </main>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/Footer.tsx src/app/\[locale\]/page.tsx
git commit -m "feat: add Footer with hours, address, map embed, and legal links"
```

---

## Task 19: Admin Dashboard

**Files:**
- Create: `src/components/ui/StatusBadge.tsx`
- Create: `src/components/admin/ReservationTable.tsx`
- Create: `src/components/admin/SlotManager.tsx`
- Create: `src/app/[locale]/admin/page.tsx`

- [ ] **Step 1: Build StatusBadge**

Create `src/components/ui/StatusBadge.tsx`:
```tsx
type Status = 'pending' | 'confirmed' | 'cancelled'

const styles: Record<Status, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${styles[status]}`}>
      {status}
    </span>
  )
}
```

- [ ] **Step 2: Build ReservationTable**

Create `src/components/admin/ReservationTable.tsx`:
```tsx
'use client'

import { useState } from 'react'
import StatusBadge from '@/components/ui/StatusBadge'

type Reservation = {
  id: string
  name: string
  email: string
  phone: string
  party_size: number
  date: string
  notes: string | null
  status: 'pending' | 'confirmed' | 'cancelled'
  time_slots: { start_time: string; end_time: string } | null
}

export default function ReservationTable({
  reservations: initial,
  password,
}: {
  reservations: Reservation[]
  password: string
}) {
  const [reservations, setReservations] = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)

  async function updateStatus(id: string, status: 'confirmed' | 'cancelled') {
    setLoading(id)
    const res = await fetch('/api/admin/reservations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
      body: JSON.stringify({ id, status }),
    })
    if (res.ok) {
      const { reservation } = await res.json()
      setReservations((prev) => prev.map((r) => (r.id === id ? reservation : r)))
    }
    setLoading(null)
  }

  // Group by date
  const grouped = reservations.reduce<Record<string, Reservation[]>>((acc, r) => {
    acc[r.date] = [...(acc[r.date] ?? []), r]
    return acc
  }, {})

  return (
    <div className="space-y-10">
      {Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, group]) => (
          <div key={date}>
            <h2 className="text-sm font-medium text-charcoal mb-3 tracking-wide">
              {new Date(date).toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h2>
            <div className="divide-y divide-sand border border-sand rounded-sm">
              {group.map((r) => (
                <div key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-charcoal">{r.name}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                      {r.time_slots?.start_time} – {r.time_slots?.end_time} · {r.party_size} Pers. · {r.phone}
                    </div>
                    {r.notes && <div className="text-xs text-muted italic mt-0.5">"{r.notes}"</div>}
                  </div>
                  {r.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(r.id, 'confirmed')}
                        disabled={loading === r.id}
                        className="px-3 py-1.5 text-xs bg-green-600 text-white hover:bg-green-700 disabled:opacity-40"
                      >
                        Bestätigen
                      </button>
                      <button
                        onClick={() => updateStatus(r.id, 'cancelled')}
                        disabled={loading === r.id}
                        className="px-3 py-1.5 text-xs bg-red-600 text-white hover:bg-red-700 disabled:opacity-40"
                      >
                        Stornieren
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  )
}
```

- [ ] **Step 3: Build admin page (server component with password gate)**

Create `src/app/[locale]/admin/page.tsx`:
```tsx
import { supabaseAdmin } from '@/lib/supabase'
import ReservationTable from '@/components/admin/ReservationTable'

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { pw?: string }
}) {
  const password = process.env.ADMIN_PASSWORD!
  const provided = searchParams.pw

  if (provided !== password) {
    return (
      <main className="min-h-screen bg-ivory flex items-center justify-center">
        <form method="GET" className="flex flex-col gap-4 w-full max-w-xs">
          <h1 className="font-serif text-2xl text-charcoal tracking-brand uppercase">Jilebi Admin</h1>
          <input
            name="pw"
            type="password"
            placeholder="Passwort"
            className="border-b border-sand bg-transparent pb-2 text-sm text-charcoal placeholder-muted focus:border-gold focus:outline-none"
          />
          <button type="submit" className="btn-primary">Anmelden</button>
        </form>
      </main>
    )
  }

  const { data: reservations, error } = await supabaseAdmin
    .from('reservations')
    .select('*, time_slots(start_time, end_time)')
    .order('date', { ascending: true })

  if (error) {
    return <main className="p-8 text-red-600">Fehler: {error.message}</main>
  }

  return (
    <main className="min-h-screen bg-ivory section-padding">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-3xl text-charcoal tracking-brand uppercase">Jilebi Admin</h1>
          <span className="text-xs text-muted">{reservations?.length ?? 0} Reservierungen</span>
        </div>
        <ReservationTable reservations={reservations ?? []} password={password} />
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Verify admin**

```bash
npm run dev
```
Visit `http://localhost:3000/admin` → password form shown.
Enter your `ADMIN_PASSWORD` → reservation list loads.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/StatusBadge.tsx src/components/admin/ src/app/\[locale\]/admin/
git commit -m "feat: add admin dashboard with password gate, reservation table, confirm/cancel actions"
```

---

## Task 20: German Legal Pages

**Files:**
- Create: `src/app/[locale]/impressum/page.tsx`
- Create: `src/app/[locale]/datenschutz/page.tsx`

- [ ] **Step 1: Create Impressum page**

Create `src/app/[locale]/impressum/page.tsx`:
```tsx
import Link from 'next/link'

export default function ImpressumPage() {
  return (
    <main className="section-padding max-w-2xl mx-auto">
      <h1 className="font-serif text-3xl text-charcoal tracking-brand uppercase mb-6">Impressum</h1>

      <section className="text-sm text-muted leading-relaxed space-y-4">
        <div>
          <h2 className="text-charcoal font-medium mb-1">Angaben gemäß § 5 TMG</h2>
          <p>Jilebi Restaurant<br />
          Musterstraße 1<br />
          72622 Nürtingen<br />
          Deutschland</p>
        </div>
        <div>
          <h2 className="text-charcoal font-medium mb-1">Kontakt</h2>
          <p>Telefon: +49 7022 123 456<br />
          E-Mail: info@jilebi.de</p>
        </div>
        <div>
          <h2 className="text-charcoal font-medium mb-1">Verantwortlich für den Inhalt</h2>
          <p>[Ihr Name]<br />Musterstraße 1, 72622 Nürtingen</p>
        </div>
      </section>

      <Link href="/" className="inline-block mt-8 text-xs tracking-widest uppercase text-gold hover:text-charcoal transition-colors">
        ← Zurück
      </Link>
    </main>
  )
}
```

- [ ] **Step 2: Create Datenschutz page**

Create `src/app/[locale]/datenschutz/page.tsx`:
```tsx
import Link from 'next/link'

export default function DatenschutzPage() {
  return (
    <main className="section-padding max-w-2xl mx-auto">
      <h1 className="font-serif text-3xl text-charcoal tracking-brand uppercase mb-6">Datenschutzerklärung</h1>

      <div className="text-sm text-muted leading-relaxed space-y-6">
        <section>
          <h2 className="text-charcoal font-medium mb-2">1. Verantwortlicher</h2>
          <p>Jilebi Restaurant, Musterstraße 1, 72622 Nürtingen (info@jilebi.de)</p>
        </section>
        <section>
          <h2 className="text-charcoal font-medium mb-2">2. Erhobene Daten bei Tischreservierungen</h2>
          <p>Bei einer Tischreservierung erheben wir folgende personenbezogene Daten: Name, E-Mail-Adresse, Telefonnummer, Personenanzahl, gewünschtes Datum und Uhrzeit sowie optionale Anmerkungen. Diese Daten werden ausschließlich zur Bearbeitung Ihrer Reservierungsanfrage verwendet.</p>
        </section>
        <section>
          <h2 className="text-charcoal font-medium mb-2">3. Rechtsgrundlage</h2>
          <p>Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).</p>
        </section>
        <section>
          <h2 className="text-charcoal font-medium mb-2">4. Speicherdauer</h2>
          <p>Reservierungsdaten werden nach Ablauf von 6 Monaten nach dem Reservierungsdatum gelöscht.</p>
        </section>
        <section>
          <h2 className="text-charcoal font-medium mb-2">5. Ihre Rechte</h2>
          <p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung. Wenden Sie sich hierfür an info@jilebi.de.</p>
        </section>
        <section>
          <h2 className="text-charcoal font-medium mb-2">6. Google Maps</h2>
          <p>Diese Website verwendet Google Maps zur Darstellung unseres Standorts. Anbieter: Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA. Datenschutzerklärung: https://policies.google.com/privacy</p>
        </section>
      </div>

      <Link href="/" className="inline-block mt-8 text-xs tracking-widest uppercase text-gold hover:text-charcoal transition-colors">
        ← Zurück
      </Link>
    </main>
  )
}
```

- [ ] **Step 3: Update placeholder address**

In both pages, replace `[Ihr Name]` and `Musterstraße 1` with the real restaurant owner name and address.

- [ ] **Step 4: Commit**

```bash
git add src/app/\[locale\]/impressum/ src/app/\[locale\]/datenschutz/
git commit -m "feat: add German legal pages (Impressum + Datenschutzerklärung)"
```

---

## Task 21: Deploy to Vercel

**Files:**
- Create: `.gitignore` update
- Create: `vercel.json` (if needed)

- [ ] **Step 1: Ensure .gitignore is correct**

Verify `.gitignore` contains:
```
.env.local
.next/
node_modules/
.superpowers/
```

- [ ] **Step 2: Push to GitHub**

```bash
git remote add origin https://github.com/YOUR_USERNAME/project-jilebi.git
git branch -M main
git push -u origin main
```

- [ ] **Step 3: Deploy on Vercel**

1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Select the `project-jilebi` repository
3. Framework: Next.js (auto-detected)
4. Add all environment variables from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `ADMIN_PASSWORD`
5. Click Deploy

- [ ] **Step 4: Verify production**

1. Visit the Vercel URL — full site loads in German
2. Visit `/en` — switches to English
3. Make a test reservation → confirmation email arrives
4. Visit `/admin?pw=YOUR_PASSWORD` → dashboard loads, confirm the test reservation
5. Impressum and Datenschutz links in footer work

- [ ] **Step 5: Add custom domain (optional)**

In Vercel project settings → Domains → add `jilebi.de` and follow DNS instructions.

---

## Verification Checklist

- [ ] `npm run dev` starts without errors
- [ ] `npx jest --no-coverage` — all tests pass
- [ ] Booking flow: date → slot → form → submit → email received
- [ ] Admin: `/admin` shows login form, correct password shows reservations
- [ ] Admin: confirm a booking → guest receives confirmation email
- [ ] Admin: cancel a booking → guest receives cancellation email
- [ ] Language switch: `/` = German, `/en` = English, all strings update
- [ ] Speisekarte: all 4 category tabs work, prices show with comma
- [ ] Gallery: masonry grid loads, lightbox opens, arrow keys navigate
- [ ] Footer: Impressum + Datenschutz links open correct pages
- [ ] Mobile: nav, reservation form, and gallery all usable on phone
