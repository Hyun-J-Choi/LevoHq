-- Allow bookings without email (phone-only clients)
alter table public.clients alter column email drop not null;
