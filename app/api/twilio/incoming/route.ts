import { NextRequest, NextResponse } from "next/server";
import { generateClaudeMessage } from "@/lib/claude";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  getTwilioEnv,
  getTwilioWebhookUrl,
  twilioFormToParams,
  validateTwilioSignature,
  sendCompliantSMS,
} from "@/lib/twilio";
import {
  detectKeyword,
  recordOptOut,
  recordOptIn,
  recordConsent,
} from "@/lib/sms-compliance";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EMPTY_TWIML = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;

function twimlResponse() {
  return new NextResponse(EMPTY_TWIML, {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

export async function POST(request: NextRequest) {
  try {
    const params = await twilioFormToParams(request);
    const { authToken } = getTwilioEnv();

    // Validate Twilio signature
    const skipValidation =
      process.env.TWILIO_SKIP_SIGNATURE_VALIDATION === "true";
    if (!skipValidation) {
      const signature = request.headers.get("x-twilio-signature");
      const url = getTwilioWebhookUrl(request);
      if (!validateTwilioSignature(authToken, signature, url, params)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
      }
    }

    const from = params.From ?? "";
    const to = params.To ?? "";
    const body = params.Body ?? "";
    const messageSid = params.MessageSid ?? `local-${Date.now()}`;

    if (!from || !to) {
      return NextResponse.json({ error: "Missing From/To" }, { status: 400 });
    }

    // Rate limit inbound: 60/min per phone
    if (!checkRateLimit(`inbound:${from}`, 60)) {
      return twimlResponse();
    }

    const admin = createSupabaseAdmin();

    // Look up business by Twilio number
    const { data: business } = await admin
      .from("businesses")
      .select("id, name, timezone")
      .eq("twilio_number", to)
      .single();

    if (!business) {
      console.error("[incoming] No business found for number:", to);
      return twimlResponse();
    }

    const businessId = business.id;

    // Log inbound message
    await admin.from("conversations").insert({
      business_id: businessId,
      twilio_message_sid: messageSid,
      direction: "inbound",
      from_phone: from,
      to_phone: to,
      message: body,
    });

    // TCPA keyword handling (STOP/START/HELP)
    const keyword = detectKeyword(body);
    if (keyword) {
      if (keyword.type === "stop") {
        await recordOptOut(from, businessId);
      } else if (keyword.type === "start") {
        await recordOptIn(from, businessId);
      }

      // Send keyword response (skip consent check for compliance responses)
      await sendCompliantSMS(from, keyword.response, businessId, {
        timezone: business.timezone ?? undefined,
        skipConsent: true,
      });

      return twimlResponse();
    }

    // Auto-record consent for inbound messages (they texted us first)
    await recordConsent(from, businessId, "opt_in_sms");

    // Fetch recent conversation history for context
    const { data: recent } = await admin
      .from("conversations")
      .select("direction, message, sent_at")
      .eq("business_id", businessId)
      .or(`from_phone.eq.${from},to_phone.eq.${from}`)
      .order("sent_at", { ascending: false })
      .limit(10);

    const history =
      recent
        ?.reverse()
        .map(
          (row) =>
            `${row.direction === "inbound" ? "Client" : business.name ?? "Studio"}: ${row.message}`
        )
        .join("\n") ?? "";

    // Generate AI reply
    let reply: string;
    try {
      reply = await generateClaudeMessage(
        `You are the SMS assistant for ${business.name ?? "this clinic"}, a medical spa.
Keep replies concise for SMS: aim under 280 characters, never over 500 characters.
Tone: warm, professional, and caring — like a knowledgeable front desk team member.

STRICT RULES — never break these:
1. NEVER invent or guess specific availability, times, or dates. If asked about scheduling, say a team member will confirm shortly.
2. NEVER invent or guess specific pricing. If asked about cost, say a team member will send over the details shortly.
3. NEVER give medical advice or make claims about treatment results.
4. If a client seems upset or has a complaint, express empathy and say a team member will reach out shortly.
5. You can warmly acknowledge thank-you messages, compliments, and general questions about services.
6. Always end messages that need a human follow-up with: "A team member will be in touch shortly!"

Recent conversation (newest last):
${history || "(no prior messages)"}

Latest inbound message from client:
${body}

Reply as a single SMS message only — no quotes, no markdown.`
      );
    } catch (err) {
      console.error("Claude reply failed:", err);
      reply =
        "Thanks for your message — our team will get back to you shortly. Reply BOOK anytime to schedule.";
    }

    // Send reply with compliance checks
    await sendCompliantSMS(from, reply, businessId, {
      timezone: business.timezone ?? undefined,
    });

    return twimlResponse();
  } catch (err) {
    console.error("Twilio incoming webhook error:", err);
    return twimlResponse();
  }
}
