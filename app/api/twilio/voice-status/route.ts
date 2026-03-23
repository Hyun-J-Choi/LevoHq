import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getTwilioEnv,
  getTwilioWebhookUrl,
  twilioFormToParams,
  validateTwilioSignature,
} from "@/lib/twilio";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MISSED_STATUSES = new Set(["no-answer", "busy", "failed", "canceled"]);

/**
 * Twilio Voice status callback: log missed / unanswered calls to `missed_calls`.
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

    if (from && MISSED_STATUSES.has(callStatus)) {
      const supabase = createSupabaseServerClient();
      const { error } = await supabase.from("missed_calls").insert({
        from_phone: from,
        to_phone: to || null,
        call_sid: callSid,
        status: "missed",
      });
      if (error) console.error("missed_calls insert:", error);
    }

    return new NextResponse("", { status: 204 });
  } catch (e) {
    console.error("voice-status webhook:", e);
    return new NextResponse("", { status: 204 });
  }
}
