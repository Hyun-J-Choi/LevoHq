-- Ensure appointments can store phone for SMS (reminders, recovery, Twilio)
alter table public.appointments add column if not exists client_phone text;

comment on column public.appointments.client_phone is 'E.164 or raw phone for Twilio / reminders';
