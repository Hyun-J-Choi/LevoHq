-- Missed calls (e.g. Twilio voice webhook or manual logging)
create table if not exists public.missed_calls (
  id uuid primary key default gen_random_uuid(),
  from_phone text not null,
  to_phone text,
  client_name text,
  call_sid text unique,
  duration_seconds int default 0,
  status text not null default 'missed' check (status in ('missed', 'returned', 'logged')),
  created_at timestamptz not null default now()
);

create index if not exists missed_calls_created_at_idx
  on public.missed_calls (created_at desc);

comment on table public.missed_calls is 'Inbound missed calls for LevoHQ /missed-call';

alter table public.missed_calls enable row level security;

create policy "Allow insert missed_calls"
  on public.missed_calls for insert
  to anon, authenticated
  with check (true);

create policy "Allow select missed_calls"
  on public.missed_calls for select
  to anon, authenticated
  using (true);
