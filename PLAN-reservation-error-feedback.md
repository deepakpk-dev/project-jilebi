# PLAN: Specific error feedback in the reservation form (409 / 429 / capacity-aware slots)

**Rank: 1 of 5 — do this first.** Direct conversion impact on the core product flow, small diff.

## Goal

Today the booking form shows one generic message ("Something went wrong. Please try again.") for *every* failure. But the API already returns distinct, meaningful statuses:

- `409 Conflict` — the Postgres trigger rejected the insert because the slot filled up between slot selection and submit (`src/app/api/reservations/route.ts:129-132`)
- `429 Too Many Requests` — rate limited (5/min/IP)
- anything else — genuine server error

A guest who hits a 409 is told "try again", retries the same full slot, and fails forever. Fix: show a specific message per status, automatically refresh availability after a 409, and prevent most 409s up front by disabling slots whose *remaining* seats are smaller than the selected party size.

## Files to touch

| File | Change |
|---|---|
| `src/components/sections/Reservation.tsx` | Status-code branching, availability refresh, capacity-aware slot filtering |
| `src/messages/de.json` | New keys under `reservation` |
| `src/messages/en.json` | Same keys, English |
| `e2e/reservation.spec.ts` | New test: 409 shows the slot-full message and refreshes availability |

Do **not** modify `src/app/api/reservations/route.ts` or `src/components/ui/TimeSlotPicker.tsx` — the API is correct and the picker already renders `available: false` slots as disabled; all derivation happens in the parent.

## Implementation order

### Step 1 — i18n keys

Add to `src/messages/en.json` inside the `"reservation"` object (next to the existing `"error"` key, which stays as the generic fallback):

```json
"error_slot_full": "This time slot just filled up. Please pick another time — we've refreshed the availability for you.",
"error_rate_limited": "Too many attempts. Please wait a minute and try again."
```

Add to `src/messages/de.json` at the same position:

```json
"error_slot_full": "Diese Uhrzeit ist soeben ausgebucht. Bitte wählen Sie eine andere Zeit — die Verfügbarkeit wurde aktualisiert.",
"error_rate_limited": "Zu viele Versuche. Bitte warten Sie eine Minute und versuchen Sie es erneut."
```

Both files must keep identical key structure (bilingual parity is a project convention).

### Step 2 — extract a reusable `loadSlots` in `Reservation.tsx`

Currently the availability fetch lives inline in `handleDateSelect` (lines 59–84). Extract it so the post-409 refresh reuses the exact same abort logic:

```tsx
async function loadSlots(date: Date) {
  abortRef.current?.abort()
  const controller = new AbortController()
  abortRef.current = controller

  setLoadingSlots(true)
  try {
    const res = await fetch(`/api/availability?date=${format(date, 'yyyy-MM-dd')}`, {
      signal: controller.signal,
    })
    if (!res.ok) throw new Error('Failed to load availability')
    const data = await res.json()
    setSlots(data.slots ?? [])
    return data.slots ?? []
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return null
    setSlots([])
    setError(t('error'))
    return []
  } finally {
    setLoadingSlots(false)
  }
}
```

`handleDateSelect` becomes: set date/clear slot/clear error, return early if `!date`, then `await loadSlots(date)`.

### Step 3 — branch on `res.status` in `handleSubmit`

Replace the current `if (!res.ok) throw new Error()` + generic catch with:

```tsx
if (!res.ok) {
  if (res.status === 409) {
    setError(t('error_slot_full'))
    const fresh = await loadSlots(selectedDate)
    // Clear the stale selection if the slot is now full or gone
    if (fresh && !fresh.some((s: Slot) => s.id === selectedSlotId && s.available)) {
      setSelectedSlotId(null)
    }
  } else if (res.status === 429) {
    setError(t('error_rate_limited'))
  } else {
    setError(t('error'))
  }
  return
}
```

Keep the outer try/catch for network failures → generic `t('error')`.

### Step 4 — capacity-aware slot display

The server's `available` flag is `booked < max_capacity` (`src/app/api/availability/route.ts:63`), so a slot with 19/20 seats booked shows as available even for a party of 6 — guaranteed 409. Derive display slots in `Reservation.tsx`:

```tsx
const partySize = parseInt(form.party_size, 10)
const displaySlots = slots.map((s) => ({
  ...s,
  available: s.available && s.max_capacity - s.booked >= partySize,
}))
```

Pass `displaySlots` to `<TimeSlotPicker>`. Also clear a selection that no longer fits when the party size grows — add inside the `party_size` select's `onChange` (or a `useEffect` on `form.party_size`):

```tsx
const n = parseInt(e.target.value, 10)
setForm({ ...form, party_size: e.target.value })
const sel = slots.find((s) => s.id === selectedSlotId)
if (sel && sel.max_capacity - sel.booked < n) setSelectedSlotId(null)
```

### Step 5 — E2E test

Add to `e2e/reservation.spec.ts` in the `Reservation flow` describe block. Override the reservations route to return 409 once, then 201; assert the DE slot-full message appears and that availability was re-fetched (count the `/api/availability` requests):

```tsx
test('a capacity conflict shows a specific message and refreshes availability', async ({ page }) => {
  let availabilityCalls = 0
  await page.route('**/api/availability*', async (route) => {
    availabilityCalls++
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_SLOTS) })
  })
  await page.route('**/api/reservations', async (route) => {
    await route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: 'This time slot is fully booked' }) })
  })

  await page.goto('/de')
  await pickFirstAvailableDay(page)
  await page.getByRole('button', { name: /18:00\s*[–-]\s*20:00/ }).click()
  await page.getByPlaceholder('Ihr Name').fill('Maria Müller')
  await page.getByPlaceholder('E-Mail-Adresse').fill('maria@example.de')
  await page.getByPlaceholder('Telefonnummer').fill('+49 7022 555 0123')
  const callsBefore = availabilityCalls
  await page.getByRole('button', { name: 'Jetzt reservieren' }).click()

  await expect(page.getByText(/soeben ausgebucht/)).toBeVisible()
  await expect.poll(() => availabilityCalls).toBeGreaterThan(callsBefore)
})
```

Note: this test's route override in `beforeEach` already registers a reservations route; `page.route` registered later takes precedence in Playwright, so the per-test override above wins. Keep it that way.

## Edge cases a weaker model would miss

1. **Branch on `res.status`, never on the error message string.** The server messages (`'This time slot is fully booked'`) are unlocalized English and not a stable contract. Do not call `res.json()` on error responses at all — some (429) may have differently-shaped bodies.
2. **The refresh must go through the shared `abortRef`.** The README explicitly advertises stale-request cancellation as a feature. If the post-409 refresh uses its own controller, a user who changes the date during the refresh gets the old date's slots rendered. Reusing `loadSlots` preserves this invariant.
3. **`loadSlots` returning `null` means "aborted"** — do not clear `selectedSlotId` in that case (the date changed; `handleDateSelect` already cleared it).
4. **The existing e2e test depends on the 18/20-booked slot being selectable.** `MOCK_SLOTS.slots[1]` has `booked: 18, max_capacity: 20` and the default party size is `'2'`. `20 - 18 >= 2` keeps it enabled — do not change the default party size or the mock, or the "fully-booked slots are visible but cannot be selected" test's premise shifts.
5. **`form.party_size` is a string** (select value). Always `parseInt(..., 10)` before arithmetic; comparing `'10' < 2` does string coercion surprises.
6. **Keep the form state intact after a 409** — only clear the slot selection. The guest should not retype name/email/phone.
7. **The error `<p>` already has `role="alert"`** — reuse it; don't add a second live region (the success block has `aria-live="polite"` and focuses the heading; leave that alone).
8. **`error` must be cleared when a new date or slot is picked** — `handleDateSelect` already does `setError(null)`; make sure the extracted version keeps it.

## Acceptance criteria

- [ ] `npm run lint`, `npm test`, `npm run build` all pass.
- [ ] `npm run test:e2e` passes, including the new 409 test (requires `npx playwright install` locally; CI installs browsers already).
- [ ] With dev server running and a slot at 19/20 booked: selecting party size 6 renders that slot disabled (visually sand/disabled, `disabled` attribute present).
- [ ] Simulate a 409 (e.g. two browsers booking the last seats, or temporarily fulfill via devtools override): the DE message "Diese Uhrzeit ist soeben ausgebucht…" appears, the slot grid re-renders from a fresh `/api/availability` call, and the previously selected slot is deselected if full.
- [ ] Submitting 6 times rapidly (or curl POST x6) shows the rate-limit message, not the generic one.
- [ ] `de.json` and `en.json` have identical key sets under `reservation` (diff the sorted key lists).
- [ ] CLAUDE.md's "16 tests across 6 suites" line: update the counts if the Jest totals changed (they shouldn't — only e2e was added).
