# PLAN: Close the guest communication loop — email on admin confirmation

**Rank: 4 of 5.**

## Goal

The email flow is currently dishonest in both directions:

- At booking time, the guest's reservation is `status: 'pending'`, and the success screen says "we will send you a confirmation by email" — but the email sent at that moment (`sendConfirmationEmail` in `src/lib/resend.ts`) reads like a *final confirmation* ("vielen Dank für Ihre Reservierung… Wir freuen uns auf Ihren Besuch").
- When the admin actually clicks **Confirm** in the dashboard (`updateReservationStatus` in `src/app/[locale]/admin/actions.ts`), **no email is sent at all**. Only cancellation triggers one.

So a guest never learns their booking was truly confirmed, and the booking-time email overpromises. Fix: reword the booking-time email as "request received", and send a real confirmation email when the admin confirms.

## Files to touch

| File | Change |
|---|---|
| `src/lib/resend.ts` | Reword booking-time email; add `sendReservationConfirmedEmail` |
| `src/app/[locale]/admin/actions.ts` | Send confirmed-email on `status === 'confirmed'` |
| `src/app/[locale]/admin/actions.test.ts` | Update the resend mock; add cases |
| `src/app/api/reservations/route.test.ts` | Only if it asserts on resend mock shape — check first |

No migration needed. No changes to `email_sent_at` semantics (see edge case 3).

## Implementation order

### Step 1 — reword the booking-time email in `src/lib/resend.ts`

In `sendConfirmationEmail`, change subject and body copy only (structure, escaping, guard, and return-boolean stay identical):

- DE subject: `'Ihre Reservierungsanfrage bei Jilebi'`
- EN subject: `'Your reservation request at Jilebi'`
- DE body: keep greeting + details block, but replace the closing lines with: `<p>wir haben Ihre Reservierungsanfrage erhalten. Sie erhalten eine weitere E-Mail, sobald wir Ihre Reservierung bestätigt haben.</p>` before the details, and keep `<p>Ihr Jilebi-Team<br>Nürtingen</p>`.
- EN body equivalent: `<p>we have received your reservation request. You will get another email as soon as we have confirmed your reservation.</p>`

This now matches the on-screen success copy ("Wir haben Ihre Anfrage erhalten und werden Ihnen eine Bestätigung per E-Mail senden.") exactly in spirit.

### Step 2 — add `sendReservationConfirmedEmail` in `src/lib/resend.ts`

Clone the shape of `sendConfirmationEmail` (including the `time_slots` join guard and `Promise<boolean>` return):

```ts
export async function sendReservationConfirmedEmail(reservation: Reservation): Promise<boolean> {
  if (!reservation.time_slots?.start_time || !reservation.time_slots?.end_time) {
    console.error(
      `[resend] skipping confirmed email for reservation ${reservation.id}: missing time_slots join`
    )
    return false
  }
  const isDE = reservation.language !== 'en'
  const subject = isDE
    ? 'Ihre Reservierung bei Jilebi — Bestätigt'
    : 'Your reservation at Jilebi — Confirmed'
  // body: escapeHtml(name/date/times) exactly like sendConfirmationEmail;
  // DE: "Ihre Reservierung ist bestätigt. Wir freuen uns auf Ihren Besuch!"
  // EN: "Your reservation is confirmed. We look forward to welcoming you!"
  // + the same Datum/Uhrzeit/Personen details block
  const result = await getResend().emails.send({ from: FROM, to: reservation.email, subject, html })
  if (result.error) {
    console.error(`[resend] confirmed send failed for reservation ${reservation.id}:`, result.error)
    return false
  }
  return true
}
```

Every dynamic string goes through `escapeHtml` — `name` is guest-controlled input (up to 120 chars, any content) and this file already treats it as untrusted.

### Step 3 — send it from the server action

In `src/app/[locale]/admin/actions.ts`, `updateReservationStatus` already has the pattern for cancellation. Add the symmetric branch:

```ts
if (status === 'confirmed') {
  try {
    await sendReservationConfirmedEmail(data)
  } catch (err) {
    console.error('[admin action] confirmed email failed:', err)
  }
}
```

Import alongside `sendCancellationEmail`. The `.select('*, time_slots(start_time, end_time)')` on the update already returns the join the email needs — do not add a second query.

### Step 4 — tests

Open `src/app/[locale]/admin/actions.test.ts` first and extend its existing mocks:

1. **The `jest.mock('@/lib/resend', ...)` factory must now export `sendReservationConfirmedEmail`** in addition to `sendCancellationEmail`. If the factory only lists the old exports, the action imports `undefined` and the test dies with `TypeError: ... is not a function` — this is the single most likely failure mode of this whole change.
2. New case: confirming calls `sendReservationConfirmedEmail` once with the updated row, and does **not** call `sendCancellationEmail`.
3. New case: cancelling still calls only `sendCancellationEmail`.
4. New case: `sendReservationConfirmedEmail` rejecting does **not** reject the action — the reservation row is still returned (email failure must never roll back a status change).

Also check `src/app/api/reservations/route.test.ts`: its mock of `@/lib/resend` only needs `sendConfirmationEmail`, which still exists — should need no change, but run it to confirm.

## Edge cases a weaker model would miss

1. **Mock drift breaks unrelated tests** (see Step 4.1). Any file that `jest.mock`s `@/lib/resend` with an explicit factory must list the new export if the module under test imports it.
2. **Email failure must not fail the action.** The cancellation branch already wraps in try/catch and only logs — copy that exactly. If the confirm email throws and the action rethrows, `ReservationTable` shows "Action failed" while the DB row **is already confirmed**, and the optimistic UI goes out of sync with reality.
3. **Do not touch `email_sent_at`.** That column tracks *booking-time* delivery, and `ReservationTable.tsx:86-93` renders an "Email not delivered" badge off it so staff can follow up manually. Writing it from the confirm path would hide genuinely undelivered booking emails. If per-status delivery tracking is wanted later, that's a new column and out of scope.
4. **`language` drives the template** — a guest who booked on `/en` must get the English confirmed email. The `Reservation` type in `resend.ts` already types it `'de' | 'en'`; reuse it.
5. **The action doesn't check the *previous* status**, so re-confirming an already-confirmed reservation (possible via direct action invocation, since the UI only shows buttons for `pending`) would resend the email. That's acceptable for this scope — note it in the commit message, don't build idempotency machinery.
6. **`sendCancellationEmail` has no `time_slots` guard and returns `void`** — that asymmetry is pre-existing. Leave it alone; aligning it is a separate cleanup and touching it risks the reservations route tests.
7. **Copy must not use unescaped user data even in subjects.** Subjects here are static strings — keep them that way (no `${reservation.name}` in subjects; header injection paranoia costs nothing).
8. **CLAUDE.md says "Confirmation emails are fire-and-forget"** — that line is already stale (the route awaits and tracks delivery since commit `200d754`). Update the CLAUDE.md "API Patterns" bullet to describe the awaited flow while you're here, so the docs stop contradicting the code.

## Acceptance criteria

- [ ] `npm run lint`, `npm test`, `npm run build` all pass (Jest count grows by the new cases — update CLAUDE.md's test count line).
- [ ] `grep -n "Bestätigung" src/lib/resend.ts` shows the booking-time email no longer claims to be a confirmation; the confirmed email owns that word.
- [ ] In `actions.test.ts`: confirming a reservation asserts exactly one `sendReservationConfirmedEmail` call whose argument includes the `time_slots` join; a rejected email still resolves the action with the updated row.
- [ ] Manual check with real keys (or Resend test mode): admin clicks "Bestätigen" → guest inbox receives "Ihre Reservierung bei Jilebi — Bestätigt" with correct date, `HH:MM – HH:MM` times, and party size; the row in the dashboard flips to the confirmed badge.
- [ ] Cancelling still sends only the cancellation email (one call, not two).
- [ ] A reservation whose name is `<b>Max</b>` renders the literal text `<b>Max</b>` in the received email, not bold (escaping verified end-to-end).
