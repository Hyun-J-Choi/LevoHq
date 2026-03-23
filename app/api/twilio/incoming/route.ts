import { NextRequest, NextResponse } from "next/server";
import { generateClaudeMessage } from "@/lib/claude";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getTwilioClient,
  getTwilioEnv,
  getTwilioWebhookUrl,
  twilioFormToParams,
  validateTwilioSignature,
} from "@/lib/twilio";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EMPTY_TWIML = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;

export async function POST(request: NextRequest) {
  try {
    const params = await twilioFormToParams(request);
    const { authToken, fromNumber } = getTwilioEnv();

    const skipValidation = process.env.TWILIO_SKIP_SIGNATURE_VALIDATION === "true";
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

    const supabase = createSupabaseServerClient();

    const { error: inboundError } = await supabase.from("conversations").insert({
      twilio_message_sid: messageSid,
      direction: "inbound",
      from_phone: from,
      to_phone: to,
      body,
    });

    if (inboundError) {
      console.error("Supabase insert inbound:", inboundError);
    }

    const safePhone = from.replace(/"/g, "");
    const phoneEq = `"${safePhone}"`;
    const { data: recent } = await supabase
      .from("conversations")
      .select("direction, body, created_at")
      .or(`from_phone.eq.${phoneEq},to_phone.eq.${phoneEq}`)
      .order("created_at", { ascending: false })
      .limit(10);

    const history =
      recent
        ?.reverse()
        .map((row) => `${row.direction === "inbound" ? "Client" : "LevoHQ"}: ${row.body}`)
        .join("\n") ?? "";

    let reply: string;
    try {
      reply = await generateClaudeMessage(
        `You are LevoHQ, the SMS assistant for a premium beauty and wellness studio.
Keep replies concise for SMS: aim under 280 characters when possible, never over 500 characters.
Tone: warm, professional, luxurious but not stiff.

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

    const client = getTwilioClient();
    const sent = await client.messages.create({
      from: fromNumber,
      to: from,
      body: reply,
    });

    const { error: outboundError } = await supabase.from("conversations").insert({
      twilio_message_sid: sent.sid,
      direction: "outbound",
      from_phone: fromNumber,
      to_phone: from,
      body: reply,
    });

    if (outboundError) {
      console.error("Supabase insert outbound:", outboundError);
    }

    return new NextResponse(EMPTY_TWIML, {
      status: 200,
      headers: { "Content-Type": "text/xml; charset=utf-8" },
    });
  } catch (err) {
    console.error("Twilio incoming webhook error:", err);
    return new NextResponse(EMPTY_TWIML, {
      status: 200,
      headers: { "Content-Type": "text/xml; charset=utf-8" },
    });
  }
}
