-- Seed data for Glow Aesthetics (test clinic)
-- Run this after the migration

-- Insert providers
insert into public.providers (id, name, title, specialties) values
  ('a1111111-1111-1111-1111-111111111111', 'Dr. Sarah Kim', 'MD', '{botox,fillers,laser}'),
  ('a2222222-2222-2222-2222-222222222222', 'Jessica Chen', 'NP', '{botox,fillers,chemical_peel}'),
  ('a3333333-3333-3333-3333-333333333333', 'Maria Rodriguez', 'Aesthetician', '{hydrafacial,chemical_peel,laser}');

-- Insert services
insert into public.services (id, name, category, duration_minutes, price_min, price_max, price_unit, prep_instructions) values
  ('b1111111-1111-1111-1111-111111111111', 'Botox', 'injectable', 30, 13, 13, 'per unit',
   'No blood thinners, aspirin, or alcohol 24 hours before your appointment.'),
  ('b2222222-2222-2222-2222-222222222222', 'Lip Filler', 'injectable', 45, 650, 850, 'per syringe',
   'Avoid blood thinners and alcohol 24hrs before. Bruising is possible — avoid scheduling right before major events.'),
  ('b3333333-3333-3333-3333-333333333333', 'Dermal Fillers', 'injectable', 60, 650, 1200, 'per syringe',
   'Avoid blood thinners and alcohol 24hrs before. Bruising is possible.'),
  ('b4444444-4444-4444-4444-444444444444', 'HydraFacial', 'facial', 45, 189, 189, 'per session',
   'Come with clean skin, no makeup if possible.'),
  ('b5555555-5555-5555-5555-555555555555', 'Chemical Peel', 'facial', 30, 150, 250, 'per session',
   'No retinol or exfoliants for 5-7 days before your peel.'),
  ('b6666666-6666-6666-6666-666666666666', 'Laser Hair Removal', 'laser', 30, 150, 500, 'per session',
   'No sun exposure or tanning 2 weeks before. Shave treatment area the day before.'),
  ('b7777777-7777-7777-7777-777777777777', 'Consultation', 'consultation', 30, 0, 0, 'free',
   'No preparation needed. Bring any questions you have!');

-- Link providers to services
insert into public.provider_services (provider_id, service_id) values
  -- Dr. Sarah Kim does injectables and laser
  ('a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111'), -- Botox
  ('a1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222'), -- Lip Filler
  ('a1111111-1111-1111-1111-111111111111', 'b3333333-3333-3333-3333-333333333333'), -- Dermal Fillers
  ('a1111111-1111-1111-1111-111111111111', 'b6666666-6666-6666-6666-666666666666'), -- Laser
  ('a1111111-1111-1111-1111-111111111111', 'b7777777-7777-7777-7777-777777777777'), -- Consultation
  -- Jessica Chen does injectables and peels
  ('a2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111'), -- Botox
  ('a2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222'), -- Lip Filler
  ('a2222222-2222-2222-2222-222222222222', 'b3333333-3333-3333-3333-333333333333'), -- Dermal Fillers
  ('a2222222-2222-2222-2222-222222222222', 'b5555555-5555-5555-5555-555555555555'), -- Chemical Peel
  ('a2222222-2222-2222-2222-222222222222', 'b7777777-7777-7777-7777-777777777777'), -- Consultation
  -- Maria Rodriguez does facials and laser
  ('a3333333-3333-3333-3333-333333333333', 'b4444444-4444-4444-4444-444444444444'), -- HydraFacial
  ('a3333333-3333-3333-3333-333333333333', 'b5555555-5555-5555-5555-555555555555'), -- Chemical Peel
  ('a3333333-3333-3333-3333-333333333333', 'b6666666-6666-6666-6666-666666666666'), -- Laser
  ('a3333333-3333-3333-3333-333333333333', 'b7777777-7777-7777-7777-777777777777'); -- Consultation

-- Availability: Dr. Sarah Kim — Mon/Wed/Fri 9am-5pm
insert into public.availability_slots (provider_id, day_of_week, start_time, end_time) values
  ('a1111111-1111-1111-1111-111111111111', 1, '09:00', '17:00'), -- Monday
  ('a1111111-1111-1111-1111-111111111111', 3, '09:00', '17:00'), -- Wednesday
  ('a1111111-1111-1111-1111-111111111111', 5, '09:00', '17:00'); -- Friday

-- Availability: Jessica Chen — Tue/Thu 9am-6pm, Sat 10am-3pm
insert into public.availability_slots (provider_id, day_of_week, start_time, end_time) values
  ('a2222222-2222-2222-2222-222222222222', 2, '09:00', '18:00'), -- Tuesday
  ('a2222222-2222-2222-2222-222222222222', 4, '09:00', '18:00'), -- Thursday
  ('a2222222-2222-2222-2222-222222222222', 6, '10:00', '15:00'); -- Saturday

-- Availability: Maria Rodriguez — Mon-Fri 10am-6pm
insert into public.availability_slots (provider_id, day_of_week, start_time, end_time) values
  ('a3333333-3333-3333-3333-333333333333', 1, '10:00', '18:00'), -- Monday
  ('a3333333-3333-3333-3333-333333333333', 2, '10:00', '18:00'), -- Tuesday
  ('a3333333-3333-3333-3333-333333333333', 3, '10:00', '18:00'), -- Wednesday
  ('a3333333-3333-3333-3333-333333333333', 4, '10:00', '18:00'), -- Thursday
  ('a3333333-3333-3333-3333-333333333333', 5, '10:00', '18:00'); -- Friday

-- Add some existing booked appointments (so availability isn't 100% open)
-- These simulate a realistic schedule with some slots already taken
insert into public.appointments (id, client_id, provider_id, service_id, date, time, status) 
select 
  gen_random_uuid(),
  (select id from public.clients limit 1), -- use first client if exists
  'a1111111-1111-1111-1111-111111111111',
  'b1111111-1111-1111-1111-111111111111',
  current_date + interval '2 days',
  '10:00',
  'confirmed'
where exists (select 1 from public.clients limit 1);
