import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/auth";
import { sendCompliantSMS } from "@/lib/twilio";
import { createLogger, genRequestId } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const log = createLogger({ requestId: genRequestId() });

  try {
    const supabase = createSupabaseServerClient();
    const businessId = await getCurrentBusinessId(supabase);

    const { to, body } = (await request.json()) as { to: string; body: string };

    if (!to || !body) {
      return NextResponse.json({ error: "Missing 'to' or 'body'" }, { status: 400 });
    }

    log.info("Sending manual SMS", { businessId, to });

    const result = await sendCompliantSMS(to, body, businessId);

    if (!result.sent) {
      return NextResponse.json({ error: result.reason ?? "Send failed" }, { status: 422 });
    }

    return NextResponse.json({ success: true, sid: result.sid });
  } catch (error) {
    log.error("Conversation send failed", { error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
