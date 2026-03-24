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

---

## Post-visit follow-up & Google review

### Route

`GET /api/cron/followup` (hourly in `vercel.json`)

**Phase 1 — thank you (~2h after visit)**  
- `appointment_time` between **3h and 2h ago** (hourly window)  
- `status` **completed** (case-insensitive)  
- `follow_up_sent_at` **null**  
- SMS: *Hi [name], thanks for visiting today! How was your experience?*  
- Sets **`follow_up_sent_at`**

**Phase 2 — review (24h+ after phase 1)**  
- `follow_up_sent_at` ≤ **now − 24h**  
- `review_request_sent_at` **null**  
- `review_suppression_reason` **null**  
- `status` **completed**  
- If the client has **another non-cancelled appointment** after this visit’s time → set **`review_suppression_reason = 'rebooked'`** (no SMS)  
- Else SMS: *If you loved your visit, we'd appreciate a quick review: [link]*  
- Sets **`review_request_sent_at`**

### Supabase

Run: `supabase/migrations/006_appointments_followup_review.sql`

### Env

- **`GOOGLE_BUSINESS_REVIEW_URL`** — your real review link (defaults to a placeholder URL if unset)

### Local test

```bash
curl -s "http://localhost:3000/api/cron/followup" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```
