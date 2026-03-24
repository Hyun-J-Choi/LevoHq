import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { sendCompliantSMS } from "@/lib/twilio";
import { generateClaudeMessage } from "@/lib/claude";
import { getBusinessSystemPrompt } from "@/lib/businessContext";
import { createLogger, genRequestId } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const log = createLogger({ requestId: genRequestId() });
  const admin = createSupabaseAdmin();
  let sent = 0;

  const now = Date.now();
  const lower = new Date(now + 23 * 60 * 60 * 1000).toISOString();
  const upper = new Date(now + 25 * 60 * 60 * 1000).toISOString();

  const { data: appointments, error } = await admin
    .from("appointments")
    .select("id, business_id, client_name, client_phone, service, scheduled_at, status")
    .gte("scheduled_at", lower)
    .lte("scheduled_at", upper)
    .is("reminder_sent_at", null)
    .in("status", ["scheduled", "confirmed"]);

  if (error) {
    log.error("Reminders query failed", { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  for (const appt of appointments ?? []) {
    if (!appt.client_phone) continue;

    try {
      const systemPrompt = await getBusinessSystemPrompt(appt.business_id);
      const message = await generateClaudeMessage(
        `Write a friendly appointment reminder SMS.
Client: ${appt.client_name ?? "there"}
Service: ${appt.service}
Time: ${new Date(appt.scheduled_at).toLocaleString("en-US", { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}

Keep under 250 characters. Include CTA to reply if they need to reschedule.`,
        systemPrompt
      );

      const result = await sendCompliantSMS(appt.client_phone, message, appt.business_id);

      if (result.sent) {
        await admin.from("appointments").update({ reminder_sent_at: new Date().toISOString() }).eq("id", appt.id);
        sent++;
      }
    } catch (err) {
      log.error("Reminder send failed", { appointmentId: appt.id, error: String(err) });
    }
  }

  log.info("Reminders cron complete", { scanned: appointments?.length ?? 0, sent });
  return NextResponse.json({ scanned: appointments?.length ?? 0, sent });
}
