-- Post-visit follow-up SMS + delayed Google review request (see /api/cron/followup)
alter table public.appointments add column if not exists follow_up_sent_at timestamptz;
alter table public.appointments add column if not exists review_request_sent_at timestamptz;

comment on column public.appointments.follow_up_sent_at is 'When “thanks for visiting / how was your experience?” SMS was sent';
comment on column public.appointments.review_request_sent_at is 'When Google review request SMS was sent (24h+ after follow-up if not rebooked)';

alter table public.appointments add column if not exists review_suppression_reason text;

comment on column public.appointments.review_suppression_reason is 'e.g. rebooked — skip review SMS without sending';
