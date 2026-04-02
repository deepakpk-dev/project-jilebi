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
-- Sunday=0, Monday=1 (closed), Tuesday=2 ... Saturday=6
insert into time_slots (day_of_week, start_time, end_time) values
  (0, '12:00', '14:00'), (0, '18:00', '20:00'), (0, '20:00', '22:00'),
  (2, '12:00', '14:00'), (2, '18:00', '20:00'), (2, '20:00', '22:00'),
  (3, '12:00', '14:00'), (3, '18:00', '20:00'), (3, '20:00', '22:00'),
  (4, '12:00', '14:00'), (4, '18:00', '20:00'), (4, '20:00', '22:00'),
  (5, '12:00', '14:00'), (5, '18:00', '20:00'), (5, '20:00', '22:00'),
  (6, '12:00', '14:00'), (6, '18:00', '20:00'), (6, '20:00', '22:00');
-- Monday (1) intentionally omitted = restaurant closed on Mondays
