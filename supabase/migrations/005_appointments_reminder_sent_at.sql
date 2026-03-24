-- Prevent duplicate 24h reminder SMS when cron runs hourly
alter table public.appointments add column if not exists reminder_sent_at timestamptz;

comment on column public.appointments.reminder_sent_at is 'Set when 24h-before SMS was sent via cron';
