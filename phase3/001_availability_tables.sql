-- Migration: Add booking availability system
-- Tables: providers, services, provider_services, availability_slots
-- This builds on your existing appointments and clients tables

-- Providers (the practitioners at the spa)
create table if not exists public.providers (
  id uuid default gen_random_uuid() primary key,
  business_id uuid,
  name text not null,
  title text, -- e.g., 'NP', 'RN', 'Aesthetician', 'MD'
  specialties text[], -- e.g., '{botox,fillers,laser}'
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Services catalog
create table if not exists public.services (
  id uuid default gen_random_uuid() primary key,
  business_id uuid,
  name text not null,
  category text, -- e.g., 'injectable', 'facial', 'laser', 'consultation'
  description text,
  duration_minutes integer not null default 30,
  price_min numeric(10,2), -- for range pricing
  price_max numeric(10,2),
  price_unit text default 'per session', -- 'per unit', 'per session', 'per syringe'
  prep_instructions text, -- what to tell client before appointment
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Which providers can do which services
create table if not exists public.provider_services (
  id uuid default gen_random_uuid() primary key,
  provider_id uuid references public.providers(id) on delete cascade,
  service_id uuid references public.services(id) on delete cascade,
  unique(provider_id, service_id)
);

-- Available time slots (recurring weekly schedule)
create table if not exists public.availability_slots (
  id uuid default gen_random_uuid() primary key,
  provider_id uuid references public.providers(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6), -- 0=Sunday, 6=Saturday
  start_time time not null,
  end_time time not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Add provider_id to existing appointments table if not already there
alter table public.appointments add column if not exists provider_id uuid references public.providers(id);
alter table public.appointments add column if not exists service_id uuid references public.services(id);

-- Enable RLS
alter table public.providers enable row level security;
alter table public.services enable row level security;
alter table public.provider_services enable row level security;
alter table public.availability_slots enable row level security;

-- Policies (allow read for anon/authenticated, write for authenticated)
create policy "Allow read providers" on public.providers for select using (true);
create policy "Allow read services" on public.services for select using (true);
create policy "Allow read provider_services" on public.provider_services for select using (true);
create policy "Allow read availability_slots" on public.availability_slots for select using (true);

-- Index for fast availability lookups
create index if not exists idx_availability_provider_day on public.availability_slots(provider_id, day_of_week);
create index if not exists idx_appointments_datetime on public.appointments(date, time);
