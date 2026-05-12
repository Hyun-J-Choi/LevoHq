import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  getTwilioEnv,
  getTwilioWebhookUrl,
  twilioFormToParams,
  validateTwilioSignature,
} from "@/lib/twilio";
import {
  assertSignatureValidationConfigOk,
  isSignatureValidationSkipped,
} from "@/lib/twilioSignatureGuard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Twilio StatusCallback receiver.
 *
 * Twilio POSTs here every time the status of an outbound message changes:
 * queued → sent → delivered (or → undelivered / failed). We store the latest
 * status, error code, and error message against the outbound conversations
 * row keyed by twilio_message_sid.
 *
 * Without this endpoint, sends go into a black box and we have no idea if
 * carriers are filtering us. With it, we can query Supabase for delivery
 * rate per carrier and alert when filtering spikes.
 *
 * Key Twilio statuses we care about:
 *   - queued / sending / sent     → in flight, not yet delivered
 *   - delivered                   → carrier confirmed delivery to handset
 *   - undelivered                 → carrier rejected (filtered, spam, etc)
 *   - failed                      → Twilio could not even hand off to carrier
 *
 * Common error codes (ErrorCode field):
 *   - 30003  → unreachable destination
 *   - 30004  → message blocked (recipient blocked the sender)
 *   - 30005  → unknown destination handset
 *   - 30006  → landline / unreachable carrier
 *   - 30007  → carrier flagged as spam / filtered
 *   - 30008  → unknown error from carrier
 *   - 30032  → toll-free not registered / not approved
 *   - 30034  → US A2P 10DLC — number not registered with a campaign
 *   - 30454  → destination number is invalid
 *   - 21610  → recipient previously sent STOP (opted out)
 */
export async function POST(request: NextRequest) {
  try {
    assertSignatureValidationConfigOk();

    const params = await twilioFormToParams(request);
    const { authToken } = getTwilioEnv();

    const skipValidation = isSignatureValidationSkipped();
    if (!skipValidation) {
      const signature = request.headers.get("x-twilio-signature");
      const url = getTwilioWebhookUrl(request);
      if (!validateTwilioSignature(authToken, signature, url, params)) {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 403 }
        );
      }
    }

    const messageSid = params.MessageSid ?? params.SmsSid;
    const status = params.MessageStatus ?? params.SmsStatus;
    const errorCode = params.ErrorCode || null;
    const errorMessage = params.ErrorMessage || null;

    if (!messageSid || !status) {
      // Twilio sometimes sends partial callbacks during account-level events.
      // We accept the POST so Twilio doesn't retry, but no DB write is needed.
      return NextResponse.json({ ok: true, skipped: "missing_sid_or_status" });
    }

    const admin = createSupabaseAdmin();

    // Update the outbound row by SID. There should only ever be one match.
    const { error: updateErr } = await admin
      .from("conversations")
      .update({
        delivery_status: status,
        delivery_error_code: errorCode,
        delivery_error_message: errorMessage,
        delivery_updated_at: new Date().toISOString(),
      })
      .eq("twilio_message_sid", messageSid);

    if (updateErr) {
      console.error(
        "[delivery-status] DB update failed",
        { messageSid, status, errorCode, error: updateErr.message }
      );
    } else {
      // Structured log so Vercel logs are filterable.
      console.log(
        JSON.stringify({
          tag: "delivery_status_update",
          messageSid,
          status,
          errorCode,
          errorMessage,
          ts: new Date().toISOString(),
        })
      );
    }

    // Surface the worst-case statuses for human attention
    if (status === "undelivered" || status === "failed") {
      try {
        const admin2 = createSupabaseAdmin();
        const { data: convRow } = await admin2
          .from("conversations")
          .select("id, business_id, to_phone, message")
          .eq("twilio_message_sid", messageSid)
          .single();

        if (convRow) {
          await admin2.from("needs_human_review").insert({
            business_id: convRow.business_id,
            recipient_phone: convRow.to_phone,
            original_message: convRow.message,
            sent_replacement: null,
            trigger_types: [`delivery_${status}`],
            matched_substrings: errorCode ? [`error_${errorCode}`] : [],
            source_label: "delivery_status_webhook",
          });
        }
      } catch (escalateErr) {
        // Audit-only — don't fail the webhook response on this.
        console.error("[delivery-status] escalation insert failed:", escalateErr);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[delivery-status] webhook error:", err);
    // Always 200 so Twilio doesn't aggressively retry; the error is logged.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
