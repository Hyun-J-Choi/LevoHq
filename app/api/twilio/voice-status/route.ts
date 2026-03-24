import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  getTwilioEnv,
  getTwilioWebhookUrl,
  twilioFormToParams,
  validateTwilioSignature,
  sendCompliantSMS,
} from "@/lib/twilio";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MISSED_STATUSES = new Set(["no-answer", "busy", "failed", "canceled"]);

/**
 * Twilio Voice status callback: log missed calls + fire immediate follow-up SMS.
 * Configure on your Twilio number: Voice → Status Callback URL → POST this route.
 */
export async function POST(request: NextRequest) {
  try {
    const params = await twilioFormToParams(request);
    const { authToken } = getTwilioEnv();

    const skipValidation = process.env.TWILIO_SKIP_SIGNATURE_VALIDATION === "true";
    if (!skipValidation) {
      const signature = request.headers.get("x-twilio-signature");
      const url = getTwilioWebhookUrl(request);
      if (!validateTwilioSignature(authToken, signature, url, params)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
      }
    }

    const callStatus = (params.CallStatus ?? "").toLowerCase();
    const from = params.From ?? "";
    const to = params.To ?? "";
    const callSid = params.CallSid ?? null;

    if (!from || !MISSED_STATUSES.has(callStatus)) {
      return new NextResponse("", { status: 204 });
    }

    const admin = createSupabaseAdmin();

    // Look up which business owns this Twilio number
    const { data: business } = await admin
      .from("businesses")
      .select("id, name, timezone")
      .eq("twilio_number", to)
      .single();

    if (!business) {
      console.error("[voice-status] No business found for number:", to);
      return new NextResponse("", { status: 204 });
    }

    // Log the missed call
    const { error: insertError } = await admin.from("missed_calls").insert({
      business_id: business.id,
      from_phone: from,
      to_phone: to || null,
      call_sid: callSid,
      status: "missed",
    });
    if (insertError) console.error("missed_calls insert:", insertError);

    // Fire immediate follow-up SMS
    // skipConsent: true — the caller just tried to reach us, implying intent to communicate.
    const businessName = business.name ?? "us";
    const message =
      `Hi! Sorry we missed your call — we want to make sure you're taken care of. ` +
      `Reply to this text or call us back and we'll get you sorted. — ${businessName}`;

    const result = await sendCompliantSMS(from, message, business.id, {
      timezone: business.timezone ?? undefined,
      skipConsent: true,
    });

    if (!result.sent) {
      console.warn("[voice-status] SMS not sent:", result.reason, "→", from);
    } else {
      console.log("[voice-status] Missed-call SMS sent to", from, "sid:", result.sid);
    }

    return new NextResponse("", { status: 204 });
  } catch (e) {
    console.error("voice-status webhook:", e);
    return new NextResponse("", { status: 204 });
  }
}
