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

---

## Reactivation (60-day win-back)

### Route

`GET /api/cron/reactivation` — **daily** at **14:00 UTC** (`0 14 * * *` in `vercel.json`).

For each **`clients`** row where **`reactivation_sent_at` is null**:

1. **Last visit** = most recent **non-cancelled** `appointments.appointment_time` for that `client_id`.
2. Last visit must fall in the **60-day window**: between **61 and 60 days ago** (UTC), so the daily job picks each client once.
3. **No future** non-cancelled appointments for that client.
4. Sends (via **`POST /api/twilio/send`**):  
   *Hi [name], it's been a while since your last visit at [business name]. We'd love to see you again — reply YES to get priority booking.*
5. Sets **`clients.reactivation_sent_at`**.

### Supabase

Run: `supabase/migrations/007_clients_reactivation_sent_at.sql`

### Env

- **`BUSINESS_DISPLAY_NAME`** or **`NEXT_PUBLIC_BUSINESS_DISPLAY_NAME`** — inserted as “[business name]” (default: `our studio`).

### Local test

```bash
curl -s "http://localhost:3000/api/cron/reactivation" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```
