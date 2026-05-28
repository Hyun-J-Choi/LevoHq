# LevoHQ A2P 10DLC Vetting Status — 2026-05-27 (UPDATED)

**Check time:** 2026-05-27 23:42 UTC (updated after live smoke test confirmed)
**Days since submission (baseline 2026-05-11):** 16 of expected 5–21
**State:** 🚨 **VETTING CLEARED + DELIVERY CONFIRMED END-TO-END**

## Campaign status (Twilio Console — verified via user screenshot)
- Campaign SID: CM14aa9d61bb0e624b17d38d967d637217
- Brand SID: BNeacb395e03046a723f0c7a6e32e8c9c7 (LQ Capital Holdings LLC)
- Messaging Service SID: MG410f7ed23c5c7c41386de470326765f0
- **Campaign status: Verified** ✓ (changed from "In progress")
- **External Campaign ID: CJKH30D** ✓ (changed from "-")
- Compliance Registration SID: "-" (expected empty for Low Volume Mixed standard registration)
- Use case: Low Volume Mixed

## Recent outbound delivery (Supabase `public.conversations`)
Smoke test at 2026-05-27 23:39 UTC:
- Inbound SMS received (SM2cff65b94200f1f7a8ba0ebed1506df8) at 23:39:58 UTC
- Outbound auto-reply (SMa128c58781b1ea47effd06123c6cd469) at 23:40:00 UTC → **delivery_status = "delivered"**, no error code
- Round-trip ~2 seconds. Webhook + outbound delivery confirmed working.

Pre-verification baseline (for reference):
- `undelivered` / errorCode `30034`: 2 (both 2026-05-12, pre-verification — expected, resolved)
- `delivery_status = NULL` (older sends): 12

## State determination
Campaign vetting is officially **cleared** at TCR/carrier level. However, end-to-end SMS delivery has NOT been empirically confirmed — no post-verification sends have been attempted.

## Recommended action for Justin
Pre-onboarding hardening checklist (do before any paid spa goes live):

1. **STOP / HELP keyword compliance.** Text STOP — verify opt-out confirmation fires, user flagged opted-out in DB, future outbound to that number blocked. Text HELP — verify compliance response fires. Required by carriers; failure = TCR de-listing risk + TCPA exposure ($500–$1,500/violation).
2. **Per-tenant auto-reply branding.** Current copy is LevoHQ-generic. Customers expect the spa's voice, not SaaS boilerplate. Implement per-tenant template before pilot #1.
3. **BOOK keyword end-to-end test.** Confirm the booking flow actually pulls availability and confirms — not just a canned response.
4. **Throughput planning.** Low Volume Mixed ≈ 75 msgs/day on T-Mobile at low trust score. One active spa easily exceeds this. Start the Standard Vetted upgrade application now (2–4 week turnaround).
5. **Numbering architecture.** Decide on shared LevoHQ number vs. per-spa numbers before onboarding spa #2. Reversing this later is expensive.

Operational notes:
- Empty Compliance Registration SID is normal for this registration type — not a red flag.
- This monitoring task can be paused or deleted; vetting is cleared and delivery confirmed.
