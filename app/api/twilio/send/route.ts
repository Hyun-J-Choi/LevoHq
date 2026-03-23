import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTwilioClient, getTwilioEnv } from "@/lib/twilio";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/twilio/send
 * Body: { "to": "+1...", "body": "message text" }
 * Optional header: x-twilio-send-secret (must match TWILIO_SEND_SECRET if env is set)
 */
export async function POST(request: NextRequest) {
  try {
    const secret = process.env.TWILIO_SEND_SECRET;
    if (secret) {
      const header = request.headers.get("x-twilio-send-secret");
      if (header !== secret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const payload = (await request.json()) as { to?: string; body?: string };
    const to = typeof payload.to === "string" ? payload.to.trim() : "";
    const body = typeof payload.body === "string" ? payload.body.trim() : "";

    if (!to || !body) {
      return NextResponse.json({ error: "Missing `to` or `body`" }, { status: 400 });
    }

    const { fromNumber } = getTwilioEnv();
    const client = getTwilioClient();

    const sent = await client.messages.create({
      from: fromNumber,
      to,
      body,
    });

    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("conversations").insert({
      twilio_message_sid: sent.sid,
      direction: "outbound",
      from_phone: fromNumber,
      to_phone: to,
      body,
    });

    if (error) {
      console.error("Supabase log outbound send:", error);
    }

    return NextResponse.json({
      sid: sent.sid,
      status: sent.status,
      to: sent.to,
    });
  } catch (err) {
    console.error("Twilio send error:", err);
    const message = err instanceof Error ? err.message : "Send failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
