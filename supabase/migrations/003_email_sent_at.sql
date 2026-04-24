-- Track whether the confirmation email was delivered to Resend.
-- Fire-and-forget sends would otherwise fail silently; admins surface the
-- "not delivered" state from this column.
alter table reservations
  add column if not exists email_sent_at timestamptz;
