# Hourly appointment reminders

## Route

`GET /api/cron/reminders`

- Selects `appointments` where:
  - `appointment_time` is between **23 and 25 hours** from now
  - `status` matches **`confirmed`** (case-insensitive)
  - `reminder_sent_at` is **null** (avoids duplicate SMS)
- For each row, sends SMS via **`POST /api/twilio/send`** (same logging to `conversations` as manual sends).
- Sets `reminder_sent_at` after a successful send.

## Supabase

Run migration: `supabase/migrations/005_appointments_reminder_sent_at.sql`

## Vercel

1. `vercel.json` schedules the job every hour (`0 * * * *`).
2. Add env var **`CRON_SECRET`** (e.g. `openssl rand -hex 32`). Vercel sends `Authorization: Bearer <CRON_SECRET>` on cron invocations.
3. Ensure **`TWILIO_*`** vars are set.
4. If **`TWILIO_SEND_SECRET`** is set, cron includes `x-twilio-send-secret` automatically (same value from env).
5. Cron runs on **production** deployments only.

## Local test

```bash
curl -s "http://localhost:3000/api/cron/reminders" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

If `CRON_SECRET` is unset locally, the route allows unauthenticated access (dev only — set the secret in production).
