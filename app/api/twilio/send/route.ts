import { NextRequest, NextResponse } from "next/server";
import { sendCompliantSMS } from "@/lib/twilio";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/twilio/send
 * Body: { "to": "+1...", "body": "message text", "businessId": "uuid" }
 * Auth: x-twilio-send-secret header OR authenticated session.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify access
    const secret = process.env.TWILIO_SEND_SECRET;
    if (secret) {
      const header = request.headers.get("x-twilio-send-secret");
      if (header !== secret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const payload = (await request.json()) as {
      to?: string;
      body?: string;
      businessId?: string;
    };
    const to = typeof payload.to === "string" ? payload.to.trim() : "";
    const body = typeof payload.body === "string" ? payload.body.trim() : "";
    const businessId =
      typeof payload.businessId === "string" ? payload.businessId.trim() : "";

    if (!to || !body) {
      return NextResponse.json(
        { error: "Missing `to` or `body`" },
        { status: 400 }
      );
    }

    // If businessId provided, use compliant sending with consent checks
    if (businessId) {
      // Look up business timezone
      const admin = createSupabaseAdmin();
      const { data: biz } = await admin
        .from("businesses")
        .select("timezone")
        .eq("id", businessId)
        .single();

      const result = await sendCompliantSMS(to, body, businessId, {
        timezone: biz?.timezone ?? undefined,
      });

      if (!result.sent) {
        return NextResponse.json(
          { error: `Message not sent: ${result.reason}` },
          { status: 422 }
        );
      }

      return NextResponse.json({ sid: result.sid, status: "sent", to });
    }

    // Legacy path (no businessId — kept for backwards compat during migration)
    const twilio = await import("@/lib/twilio");
    const { fromNumber } = twilio.getTwilioEnv();
    const client = twilio.getTwilioClient();
    const sent = await client.messages.create({ from: fromNumber, to, body });

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
