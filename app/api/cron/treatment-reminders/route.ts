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
    // Find the most recent completed appointment per client for this service
    // that is overdue (past interval) and hasn't been followed up yet.
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - protocol.interval_days);

    const { data: appointments } = await admin
      .from("appointments")
      .select("id, client_id, client_name, client_phone, service, business_id, scheduled_at")
      .eq("business_id", protocol.business_id)
      .eq("service", protocol.service)
      .eq("status", "completed")
      .lte("scheduled_at", cutoffDate.toISOString())
      .is("follow_up_sent_at", null)
      .order("scheduled_at", { ascending: false })
      .limit(50);

    // Deduplicate: only send to each client once (their most recent overdue appt)
    const seenClients = new Set<string>();

    for (const appt of appointments ?? []) {
      if (!appt.client_phone) continue;
      const clientKey = appt.client_id ?? appt.client_phone;
      if (seenClients.has(clientKey)) continue;
      seenClients.add(clientKey);

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
        if (result.sent) {
          sent++;
          // Mark this appointment so we don't re-send tomorrow
          await admin
            .from("appointments")
            .update({ follow_up_sent_at: new Date().toISOString() })
            .eq("id", appt.id);
        }
      } catch (err) {
        log.error("Treatment reminder failed", { appointmentId: appt.id, error: String(err) });
      }
    }
  }

  log.info("Treatment reminders cron complete", { sent });
  return NextResponse.json({ sent });
}
