import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { sendCompliantSMS } from "@/lib/twilio";
import { generateClaudeMessage } from "@/lib/claude";
import { getBusinessSystemPrompt } from "@/lib/businessContext";
import { createLogger, genRequestId } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const log = createLogger({ requestId: genRequestId() });
  const admin = createSupabaseAdmin();
  let sent = 0;

  const { data: protocols } = await admin
    .from("treatment_protocols")
    .select("id, business_id, service, interval_days, reminder_template");

  for (const protocol of protocols ?? []) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - protocol.interval_days);
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const { data: appointments } = await admin
      .from("appointments")
      .select("id, client_name, client_phone, service, business_id")
      .eq("business_id", protocol.business_id)
      .eq("service", protocol.service)
      .eq("status", "completed")
      .gte("scheduled_at", dayStart.toISOString())
      .lte("scheduled_at", dayEnd.toISOString())
      .limit(50);

    for (const appt of appointments ?? []) {
      if (!appt.client_phone) continue;

      try {
        const systemPrompt = await getBusinessSystemPrompt(protocol.business_id);
        const message = await generateClaudeMessage(
          `Write a treatment follow-up reminder SMS.
Client: ${appt.client_name ?? "there"}
Service: ${protocol.service}
Days since last treatment: ${protocol.interval_days}
${protocol.reminder_template ? `Template hint: ${protocol.reminder_template}` : ""}

Keep under 250 characters. Suggest rebooking for their next session.`,
          systemPrompt
        );

        const result = await sendCompliantSMS(appt.client_phone, message, protocol.business_id);
        if (result.sent) sent++;
      } catch (err) {
        log.error("Treatment reminder failed", { appointmentId: appt.id, error: String(err) });
      }
    }
  }

  log.info("Treatment reminders cron complete", { sent });
  return NextResponse.json({ sent });
}
