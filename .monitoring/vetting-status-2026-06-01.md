# A2P 10DLC Vetting Status — 2026-06-01

**Check time:** 2026-06-01 22:47 UTC
**Days since submission:** 21 (baseline 2026-05-11; expected window 5–21 days)
**State:** 🚨 **VETTING CLEARED**

## Twilio Console Campaign status
- **Could not read directly.** Navigation to the Campaign URL redirected to the Twilio login page, and authenticating in a browser is outside what this scheduled task is permitted to do.
- Campaign SID: CM14aa9d61bb0e624b17d38d967d637217
- Brand SID: BNeacb395e03046a723f0c7a6e32e8c9c7
- Messaging Service SID: MG410f7ed23c5c7c41386de470326765f0

## SMS delivery — last 7 days (Supabase `public.conversations`)

| delivery_status | count | earliest sent_at | latest sent_at |
|---|---|---|---|
| delivered | 7 | 2026-05-27 23:40 UTC | 2026-05-28 02:42 UTC |
| undelivered | 0 | — | — |

**Zero rows with errorCode 30034.** All 7 outbound sends in the past 7 days delivered cleanly. This is a hard reversal from the baseline (every send returning 30034 "Message from an Unregistered Number").

Sample recent message SIDs (all `delivered`, no error code):
- SM86d81eeeef13d50985de3510cf499bc6 — 2026-05-28 02:42
- SM0fbafd9f51caf4ddc15921cd93cbe35c — 2026-05-28 02:39
- SM39c876baf32b572c3895d7a4aa31c1a5 — 2026-05-28 02:12
- SM7190a92fda6a12ff13c0ae74181fb477 — 2026-05-28 02:06
- SM95f9c1960cb5b36558758b803f72adb3 — 2026-05-28 01:17
- SMe9de1a1f2c9237f2dc3d34bed3e23b27 — 2026-05-27 23:45
- SMa128c58781b1ea47effd06123c6cd469 — 2026-05-27 23:40

## Determination

The Campaign-status check via the Console is blocked by auth, but the Supabase delivery data is unambiguous: the carrier is now accepting messages through the Messaging Service. errorCode 30034 only resolves when the Campaign has been Verified/Approved by TCR + the carriers. Practically, **vetting is cleared and SMS is working end-to-end.**

Caveat worth noting: the most recent outbound was 2026-05-28 — roughly 4 days ago. No traffic in the past 96 hours. The "working" verdict is based on the May 27–28 sends, not on activity today. If you want the strongest possible confirmation today, send one fresh smoke-test message and re-check `delivery_status`.

## Recommended action

**URGENT — VETTING CLEARED, SMS DELIVERY IS WORKING.** Onboarding can proceed.

1. Optionally fire one fresh smoke test today to confirm current-day delivery (paranoid-but-cheap).
2. Log into Twilio Console manually and confirm Campaign status reads "Verified"/"Approved" and the External Campaign ID + Compliance Registration SID are populated — this is the paper trail you'll want for support tickets and audits.
3. Begin / resume customer onboarding on this Messaging Service. Monitor delivery_status for the first batch of real-customer sends to catch any per-number provisioning issues early.
4. This scheduled monitoring task has done its job — consider pausing or repurposing it to "post-launch delivery health" (alert on any spike in undelivered or new errorCodes).
