# Twilio SMS (LevoHQ)

## 1. Supabase

Run migrations in order (SQL Editor or Supabase CLI):

| File | Purpose |
|------|---------|
| `supabase/migrations/001_conversations.sql` | SMS log for Twilio webhooks + `/api/twilio/send` |
| `supabase/migrations/002_missed_calls.sql` | `/missed-call` page data |
| `supabase/migrations/003_appointments_client_phone.sql` | `appointments.client_phone` for reminders & recovery SMS |

RLS policies use `anon` to match `lib/supabase/server.ts`. For production, prefer a **service role** on the server and tighten RLS.

## 2. Environment

Set in `.env.local`:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER` (E.164, e.g. `+15551234567`)

Optional:

- `TWILIO_SKIP_SIGNATURE_VALIDATION=true` — local/ngrok only if the webhook URL Twilio signs does not match your dev URL.
- `TWILIO_SEND_SECRET` — if set, `POST /api/twilio/send` requires header `x-twilio-send-secret: <same value>`.  
  **Note:** Dashboard “Send via Twilio” and recovery “Confirm Send” call this route from the browser without that header — leave `TWILIO_SEND_SECRET` unset for those flows, or add a server-only proxy route later.

## 3. Twilio console

1. **Phone number** → Messaging → **A message comes in** → Webhook `POST` →  
   `https://<your-domain>/api/twilio/incoming`
2. Save. The URL must match what you use for signature validation (scheme + host + path).

## 4. Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/twilio/incoming` | Twilio inbound **SMS** webhook: save message, Claude reply, send SMS, log outbound |
| `POST` | `/api/twilio/send` | JSON `{ "to": "+1...", "body": "..." }` outbound send + log |
| `POST` | `/api/twilio/voice-status` | Twilio **Voice** status callback — logs `no-answer` / `busy` / `failed` / `canceled` to `missed_calls` |
