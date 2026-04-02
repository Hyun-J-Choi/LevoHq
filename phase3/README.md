# Phase 3: API Integration Setup Guide

## What You're Adding

3 new database tables + 1 API route that gives your bot real scheduling data.

### New Tables:
- **providers** — Who works at the spa (Dr. Sarah Kim, Jessica Chen, etc.)
- **services** — What they offer with real pricing and prep instructions
- **provider_services** — Which provider can do which service
- **availability_slots** — Each provider's weekly schedule

### New API Route:
- **GET /api/availability** — Your bot calls this to check real open slots

## Setup Steps

### Step 1: Apply the migration
```bash
cd ~/Desktop/levohq
cp ~/Desktop/levohq/phase3/001_availability_tables.sql supabase/migrations/$(date +%Y%m%d%H%M%S)_availability_tables.sql
npx supabase db push
```

Or paste the contents of `001_availability_tables.sql` directly into your Supabase SQL editor (Dashboard > SQL Editor > New Query).

### Step 2: Seed the data
Paste the contents of `002_seed_data.sql` into the Supabase SQL editor and run it.

### Step 3: Add the API route
```bash
mkdir -p app/api/availability
cp ~/Desktop/levohq/phase3/availability-route.ts app/api/availability/route.ts
```

### Step 4: Test it
```bash
# Start your dev server
npm run dev

# In another terminal, test the endpoint:
curl "http://localhost:3000/api/availability?service=botox&date=this_week"
```

You should get back real time slots with real provider names and real prices.

## How It Works

1. Customer texts: "Do you have Botox available this week?"
2. Your AI calls: GET /api/availability?service=botox&date=this_week
3. API returns: "Wednesday 2:00 PM with Dr. Sarah Kim, Thursday 10:00 AM with Jessica Chen..."
4. Your AI responds with REAL data instead of making it up

## What This Fixes

- Hallucinated appointment times (eval flagged 5x)
- Made-up provider names
- Fabricated pricing
- The eval's "accuracy" score should jump significantly
