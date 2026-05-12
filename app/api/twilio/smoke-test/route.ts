import { NextRequest, NextResponse } from "next/server";
import { sendCompliantSMS, getTwilioClient } from "@/lib/twilio";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { recordConsent } from "@/lib/sms-compliance";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * End-to-end SMS smoke test.
 *
 * Why this exists:
 *   When deliverability breaks, the question is always "is it the code, the
 *   AI, the Twilio config, or the carrier filter?" This endpoint isolates
 *   every layer so we can tell exactly where things fail.
 *
 * What it does:
 *   1. Records SMS consent for the target number (so the compliance gate
 *      doesn't silently block a deliberate test).
 *   2. Sends a plain test message — no AI involved, no template language.
 *      Body is intentionally boring to avoid any carrier filter heuristic.
 *   3. Waits ~3 seconds for Twilio to update message status.
 *   4. Re-fetches the Message resource from Twilio and returns the live
 *      status + error code so the caller knows immediately whether the
 *      message was queued / sent / delivered / undelivered / failed.
 *
 * Auth:
 *   Requires header `x-smoke-secret` matching env SMOKE_TEST_SECRET, OR
 *   `Authorization: Bearer <CRON_SECRET>`. The endpoint is not safe to
 *   leave open — it can send real SMS to any number.
 *
 * Usage:
 *   curl -X POST https://levohq.ai/api/twilio/smoke-test \
 *     -H "x-smoke-secret: <secret>" \
 *     -H "content-type: application/json" \
 *     -d '{"businessId":"06b3e666-2077-43f8-8b60-c59c9582e69e","to":"+14257544411"}'
 */
export async function POST(request: NextRequest) {
  // Auth gate
  const provided =
    request.headers.get("x-smoke-secret") ??
    (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const expected =
    process.env.SMOKE_TEST_SECRET ?? process.env.CRON_SECRET ?? "";

  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: { businessId?: string; to?: string; body?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { businessId, to } = payload;
  if (!businessId || !to) {
    return NextResponse.json(
      { error: "missing_businessId_or_to" },
      { status: 400 }
    );
  }

  const body =
    payload.body ??
    "This is a deliverability test from your team. No action needed. Reply STOP to opt out.";

  // Ensure consent is recorded so the SMS pipeline doesn't refuse to send.
  // Smoke tests are deliberate operator actions; we treat them as manual
  // opt-in for record-keeping consistency.
  await recordConsent(to, businessId, "manual");

  // Verify the business exists; otherwise the conversations.insert in
  // sendCompliantSMS will fail with a foreign-key error.
  const admin = createSupabaseAdmin();
  const { data: business, error: bErr } = await admin
    .from("businesses")
    .select("id, name, timezone")
    .eq("id", businessId)
    .single();
  if (bErr || !business) {
    return NextResponse.json(
      { error: "business_not_found", details: bErr?.message },
      { status: 404 }
    );
  }

  // Fire the send.
  const result = await sendCompliantSMS(to, body, businessId, {
    timezone: business.timezone ?? undefined,
    sourceLabel: "smoke_test",
    skipConsent: true,
  });

  if (!result.sent || !result.sid) {
    return NextResponse.json({
      ok: false,
      stage: "send",
      result,
      hint:
        result.reason === "quiet_hours"
          ? "TCPA quiet hours (8pm–8am local). Try again during business hours."
          : result.reason === "rate_limited"
            ? "Per-business rate limit hit (30/min)."
            : result.reason === "recipient_pacing"
              ? "Per-recipient pacing hit (2 in 60s). Wait a minute and retry."
              : result.reason === "no_consent"
                ? "Consent record missing — should not happen here since we recorded one above."
                : "Send refused by an upstream compliance gate.",
    });
  }

  // Give Twilio a moment to update the message status, then re-fetch.
  await new Promise((resolve) => setTimeout(resolve, 3000));

  let live:
    | {
        status: string;
        errorCode: number | null;
        errorMessage: string | null;
        dateCreated: string | null;
        dateSent: string | null;
        dateUpdated: string | null;
      }
    | { error: string };
  try {
    const client = getTwilioClient();
    const fetched = await client.messages(result.sid).fetch();
    live = {
      status: fetched.status,
      errorCode: fetched.errorCode ?? null,
      errorMessage: fetched.errorMessage ?? null,
      dateCreated: fetched.dateCreated?.toISOString() ?? null,
      dateSent: fetched.dateSent?.toISOString() ?? null,
      dateUpdated: fetched.dateUpdated?.toISOString() ?? null,
    };
  } catch (fetchErr) {
    live = {
      error:
        fetchErr instanceof Error
          ? fetchErr.message
          : "twilio fetch failed",
    };
  }

  return NextResponse.json({
    ok: true,
    sid: result.sid,
    sentBody: body,
    business: { id: business.id, name: business.name },
    to,
    live,
    note:
      "status=delivered means carrier confirmed handset delivery. " +
      "status=sent means handed off but not yet confirmed. " +
      "status=undelivered/failed means filtered or rejected — see errorCode.",
  });
}
