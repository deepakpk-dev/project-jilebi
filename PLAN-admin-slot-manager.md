# PLAN: Admin slot manager — block/unblock time slots from the dashboard

**Rank: 2 of 5.**

## Goal

The original design doc (`docs/superpowers/plans/2026-04-01-jilebi-website.md`, File Map) planned a `SlotManager.tsx` admin component. It was never built. The backend for it exists and works — `PATCH /api/admin/slots` (`src/app/api/admin/slots/route.ts`) and the DB trigger both honor `is_blocked` — but there is **no UI**, so the restaurant cannot close a lunch service or a holiday evening without hand-writing SQL in Supabase. Build the missing slot management section on the admin page.

Use a **server action** (matching how `ReservationTable` calls `updateReservationStatus`), not the API route. The API route stays untouched — it is documented in the README's API table.

## Files to touch

| File | Change |
|---|---|
| `src/app/[locale]/admin/actions.ts` | Add `updateSlotBlocked` server action |
| `src/app/[locale]/admin/page.tsx` | Fetch time slots + upcoming reservation counts, render `SlotManager` |
| `src/components/admin/SlotManager.tsx` | **New** client component |
| `src/messages/de.json` / `src/messages/en.json` | New keys under `admin` |
| `src/app/[locale]/admin/actions.test.ts` | Tests for the new action |

## Implementation order

### Step 1 — server action in `actions.ts`

Mirror `updateReservationStatus` exactly (auth first, validate, update, `.single()`):

```ts
export type TimeSlot = {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  max_capacity: number
  is_blocked: boolean
}

export async function updateSlotBlocked(id: string, isBlocked: boolean): Promise<TimeSlot> {
  const authorized = await isAdminSession()
  if (!authorized) throw new Error('Unauthorized')

  if (!UUID_RE.test(id)) throw new Error('Invalid slot id')
  if (typeof isBlocked !== 'boolean') throw new Error('Invalid is_blocked value')

  const { data, error } = await getSupabaseAdmin()
    .from('time_slots')
    .update({ is_blocked: isBlocked })
    .eq('id', id)
    .select('id, day_of_week, start_time, end_time, max_capacity, is_blocked')
    .single()

  if (error) {
    console.error('[admin action] update slot failed:', error)
    throw new Error('Unable to update slot')
  }
  return data
}
```

### Step 2 — data loading in `admin/page.tsx`

After the existing reservations query (only when `authorized`), add two more service-role reads:

```ts
const { data: slots, error: slotsError } = await getSupabaseAdmin()
  .from('time_slots')
  .select('id, day_of_week, start_time, end_time, max_capacity, is_blocked')
  .order('day_of_week', { ascending: true })
  .order('start_time', { ascending: true })

// Upcoming ACTIVE reservations per slot, so blocking shows what it strands.
// "Today" must be computed in the restaurant's timezone, not UTC:
const todayBerlin = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date())
const { data: upcoming } = await getSupabaseAdmin()
  .from('reservations')
  .select('time_slot_id')
  .gte('date', todayBerlin)
  .neq('status', 'cancelled')

const upcomingCountBySlot: Record<string, number> = {}
for (const r of upcoming ?? []) {
  upcomingCountBySlot[r.time_slot_id] = (upcomingCountBySlot[r.time_slot_id] ?? 0) + 1
}
```

Treat `slotsError` like the existing `error` (render `t('fetch_error', ...)`). Render below the reservation table:

```tsx
<SlotManager
  slots={slots ?? []}
  upcomingCounts={upcomingCountBySlot}
  updateSlot={updateSlotBlocked}
/>
```

### Step 3 — `SlotManager.tsx`

New client component, styled and structured like `ReservationTable.tsx` (local state seeded from props, per-row loading id, single error line, `useTranslations('admin')`):

- Group slots by `day_of_week`, render days in **Monday-first order**: iterate `[1, 2, 3, 4, 5, 6, 0]` and **skip days with no slots** (Monday has none — the restaurant is closed; rendering an empty "Monday" heading is wrong).
- Day names from i18n keys `admin.slots.days.0` … `admin.slots.days.6` (index = Postgres `day_of_week`, 0 = Sunday).
- Each slot row: `start_time.substring(0, 5)} – ${end_time.substring(0, 5)}` (DB returns `HH:MM:SS`), capacity, a blocked/open state label, and one toggle button (`type="button"` — project convention for non-submit buttons).
- When a slot has `upcomingCounts[slot.id] > 0`, show that count next to the block button (e.g. "3 upcoming") so the admin knows blocking strands existing bookings.
- On toggle: `setLoading(slot.id)`, `try { const updated = await updateSlot(slot.id, !slot.is_blocked); setSlots(prev => prev.map(s => s.id === updated.id ? updated : s)) } catch { setError(t('action_error')) } finally { setLoading(null) }`. Update state from the **returned row**, never by assuming the toggle succeeded.
- Follow the design brief (`.impeccable.md`): sand borders, tracked-uppercase micro-labels, gold sparingly. Reuse the visual language of `ReservationTable`'s buttons; a blocked slot can use `text-muted` + `border-sand`, the block action can use the `chili` hover treatment like the cancel button.

### Step 4 — i18n keys

Add under `admin` in **both** message files (structure must stay identical):

`en.json`:
```json
"slots": {
  "title": "Time Slots",
  "blocked": "Blocked",
  "open": "Open",
  "block": "Block",
  "unblock": "Unblock",
  "capacity": "{count} seats",
  "upcoming_warning": "{count, plural, one {# upcoming reservation} other {# upcoming reservations}}",
  "days": { "0": "Sunday", "1": "Monday", "2": "Tuesday", "3": "Wednesday", "4": "Thursday", "5": "Friday", "6": "Saturday" }
}
```

`de.json`:
```json
"slots": {
  "title": "Zeitfenster",
  "blocked": "Gesperrt",
  "open": "Offen",
  "block": "Sperren",
  "unblock": "Freigeben",
  "capacity": "{count} Plätze",
  "upcoming_warning": "{count, plural, one {# anstehende Reservierung} other {# anstehende Reservierungen}}",
  "days": { "0": "Sonntag", "1": "Montag", "2": "Dienstag", "3": "Mittwoch", "4": "Donnerstag", "5": "Freitag", "6": "Samstag" }
}
```

### Step 5 — tests in `actions.test.ts`

Open the existing file first and copy its mocking pattern exactly. Critical: this project mocks Supabase **as functions** — `jest.mock('@/lib/supabase', () => ({ getSupabaseAdmin: () => ({ from: mockFrom }) }))` — not object exports (CLAUDE.md convention). Also mock `@/lib/auth`'s `isAdminSession`. Add cases:

1. throws `Unauthorized` when `isAdminSession` resolves false (and does not touch the DB — assert `mockFrom` not called),
2. throws on a non-UUID id,
3. updates and returns the row on success (assert `.update` called with `{ is_blocked: true }` and `.eq('id', <id>)`),
4. throws `Unable to update slot` when Supabase returns an error.

## Edge cases a weaker model would miss

1. **Blocking a slot does NOT cancel its existing reservations.** The `check_slot_capacity()` trigger fires on insert/update of *reservations*, so existing bookings survive a block. That's why the upcoming-count warning exists — without it an admin blocks "next Friday dinner" and doesn't realize 4 parties still expect tables. Do not attempt to auto-cancel; surface the count and let the admin cancel individually in the table above.
2. **`day_of_week` semantics: 0 = Sunday** (Postgres `extract(dow ...)` and the seed data in `001_initial_schema.sql` agree). A Monday-first display order is `[1,2,3,4,5,6,0]`, not `[0..6]` and not `[1..7]`.
3. **Monday has zero slots by design** (seed comment: "Monday intentionally omitted = closed"). Skip empty days instead of rendering empty groups.
4. **Blocked slots vanish from the guest UI instantly** — `/api/availability` filters `is_blocked = false` — but they must remain **visible in the admin UI** (that's the whole point: you need to see them to unblock).
5. **"Today" for the upcoming count must be Europe/Berlin**, not `new Date().toISOString().slice(0,10)` (UTC). Between 00:00 and 01:00/02:00 Berlin time the UTC date is still yesterday; use the `Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' })` trick (`en-CA` formats as `YYYY-MM-DD`).
6. **Server action must re-check the session itself.** Being reachable only from an authed page is not protection — server actions are POST endpoints callable directly.
7. **The `.single()` + returned-row pattern** doubles as a not-found check: updating a nonexistent UUID makes `.single()` error, which becomes the thrown `Unable to update slot` — no separate 404 branch needed.
8. **Do not delete or reroute `src/app/api/admin/slots/route.ts`.** It's documented in the README API table and is independent surface area; this plan adds a UI path, not a replacement.
9. **`setRequestLocale(locale)` is already called** at the top of `admin/page.tsx` — don't add a second call, and keep translations in the new client component via `useTranslations('admin')` (client components get messages from the provider).

## Acceptance criteria

- [ ] `npm run lint`, `npm test`, `npm run build` all pass; `npm run test:e2e` still passes.
- [ ] Logged in at `/de/admin`, a "Zeitfenster" section lists slots grouped Dienstag→Sonntag (no Montag), each showing `HH:MM – HH:MM`, capacity, state, and a toggle button.
- [ ] Clicking "Sperren" flips the row to "Gesperrt" without a full page reload; a subsequent `GET /api/availability?date=<matching weekday>` no longer returns that slot.
- [ ] Clicking "Freigeben" restores it and availability shows it again.
- [ ] A slot with an active future reservation displays the upcoming-count warning; a slot with only cancelled or past reservations does not.
- [ ] Logged out (clear the `jilebi_admin_session` cookie), invoking the action path renders the login form and the new tests prove the action throws `Unauthorized`.
- [ ] Jest suite/test counts in CLAUDE.md's Testing section updated to the new totals.
