import { Resend } from 'resend'

const getResend = () => new Resend(process.env.RESEND_API_KEY)
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatDate(date: string, locale: string) {
  return new Date(date).toLocaleDateString(locale === 'en' ? 'en-GB' : 'de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export async function sendConfirmationEmail(reservation: Reservation): Promise<boolean> {
  if (!reservation.time_slots?.start_time || !reservation.time_slots?.end_time) {
    console.error(
      `[resend] skipping confirmation email for reservation ${reservation.id}: missing time_slots join`
    )
    return false
  }

  const isDE = reservation.language !== 'en'
  const subject = isDE
    ? 'Ihre Reservierung bei Jilebi — Bestätigung'
    : 'Your reservation at Jilebi — Confirmation'

  const safeName = escapeHtml(reservation.name)
  const safeDate = escapeHtml(formatDate(reservation.date, isDE ? 'de' : 'en'))
  const safeStart = escapeHtml(reservation.time_slots.start_time)
  const safeEnd = escapeHtml(reservation.time_slots.end_time)

  const html = isDE
    ? `<p>Liebe(r) ${safeName},</p>
       <p>vielen Dank für Ihre Reservierung bei <strong>Jilebi</strong>.</p>
       <p><strong>Datum:</strong> ${safeDate}<br>
       <strong>Uhrzeit:</strong> ${safeStart} – ${safeEnd}<br>
       <strong>Personen:</strong> ${reservation.party_size}</p>
       <p>Wir freuen uns auf Ihren Besuch!</p>
       <p>Ihr Jilebi-Team<br>Nürtingen</p>`
    : `<p>Dear ${safeName},</p>
       <p>Thank you for reserving a table at <strong>Jilebi</strong>.</p>
       <p><strong>Date:</strong> ${safeDate}<br>
       <strong>Time:</strong> ${safeStart} – ${safeEnd}<br>
       <strong>Guests:</strong> ${reservation.party_size}</p>
       <p>We look forward to welcoming you!</p>
       <p>The Jilebi Team<br>Nürtingen</p>`

  const result = await getResend().emails.send({ from: FROM, to: reservation.email, subject, html })
  if (result.error) {
    console.error(
      `[resend] confirmation send failed for reservation ${reservation.id}:`,
      result.error
    )
    return false
  }
  return true
}

export async function sendCancellationEmail(reservation: Reservation) {
  const isDE = reservation.language !== 'en'
  const subject = isDE
    ? 'Ihre Reservierung bei Jilebi — Stornierung'
    : 'Your reservation at Jilebi — Cancellation'

  const safeName = escapeHtml(reservation.name)
  const safeDate = escapeHtml(formatDate(reservation.date, isDE ? 'de' : 'en'))

  const html = isDE
    ? `<p>Liebe(r) ${safeName},</p>
       <p>Ihre Reservierung am ${safeDate} wurde leider storniert.</p>
       <p>Bitte kontaktieren Sie uns für eine neue Buchung.</p>
       <p>Ihr Jilebi-Team</p>`
    : `<p>Dear ${safeName},</p>
       <p>Unfortunately your reservation on ${safeDate} has been cancelled.</p>
       <p>Please contact us to make a new booking.</p>
       <p>The Jilebi Team</p>`

  await getResend().emails.send({ from: FROM, to: reservation.email, subject, html })
}
