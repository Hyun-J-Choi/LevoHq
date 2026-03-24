-- Win-back SMS (see /api/cron/reactivation)
alter table public.clients add column if not exists reactivation_sent_at timestamptz;

comment on column public.clients.reactivation_sent_at is 'When 60-day reactivation SMS was sent';
