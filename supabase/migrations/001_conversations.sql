-- Twilio SMS thread log (used by /api/twilio/incoming and /api/twilio/send)
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  twilio_message_sid text unique,
  direction text not null check (direction in ('inbound', 'outbound')),
  from_phone text not null,
  to_phone text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists conversations_from_phone_created_at_idx
  on public.conversations (from_phone, created_at desc);

create index if not exists conversations_to_phone_created_at_idx
  on public.conversations (to_phone, created_at desc);

comment on table public.conversations is 'SMS messages for Twilio + LevoHQ';

-- Adjust RLS for your security model. Options:
-- A) Service role only: enable RLS and no policies (server uses service role key), or
-- B) Anon from server: allow insert/select for backend (less ideal with anon in browser).

alter table public.conversations enable row level security;

-- Allow inserts/reads from the API when using the anon key (typical for server-only routes
-- that use NEXT_PUBLIC_SUPABASE_ANON_KEY). Tighten this in production (e.g. use service role).
create policy "Allow insert conversations"
  on public.conversations for insert
  to anon, authenticated
  with check (true);

create policy "Allow select conversations"
  on public.conversations for select
  to anon, authenticated
  using (true);
