import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { sendCompliantSMS } from "@/lib/twilio";
import { generateClaudeMessage } from "@/lib/claude";
import {
  getBusinessSystemPrompt,
  getBusinessTimezone,
} from "@/lib/businessContext";
import { preflightCanSend } from "@/lib/sms-compliance";
import { appointmentReminderPrompt } from "@/lib/messageRecipes";
import { createLogger, genRequestId } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestId = genRequestId();
  const log = createLogger({ requestId });
  const admin = createSupabaseAdmin();
  let sent = 0;
  let skippedQuiet = 0;
  let skippedNoConsent = 0;
  const tzCache = new Map<string, string>();

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
      let tz = tzCache.get(appt.business_id);
      if (!tz) {
        tz = await getBusinessTimezone(appt.business_id);
        tzCache.set(appt.business_id, tz);
      }
      const preflight = await preflightCanSend({
        phone: appt.client_phone,
        businessId: appt.business_id,
        timezone: tz,
      });
      if (!preflight.ok) {
        if (preflight.reason === "quiet_hours") skippedQuiet++;
        else skippedNoConsent++;
        continue;
      }

      const systemPrompt = await getBusinessSystemPrompt(appt.business_id);
      const message = await generateClaudeMessage(
        appointmentReminderPrompt({
          clientName: appt.client_name,
          service: appt.service,
          scheduledAt: appt.scheduled_at,
        }),
        systemPrompt,
        { label: "appointment_reminder", requestId }
      );

      // Persist the generated text so the dashboard can display it without
      // calling Claude on render.
      await admin
        .from("appointments")
        .update({
          suggested_reminder_message: message,
          suggested_reminder_message_at: new Date().toISOString(),
        })
        .eq("id", appt.id);

      const result = await sendCompliantSMS(appt.client_phone, message, appt.business_id, {
        timezone: tz,
      });

      if (result.sent) {
        await admin.from("appointments").update({ reminder_sent_at: new Date().toISOString() }).eq("id", appt.id);
        sent++;
      }
    } catch (err) {
      log.error("Reminder send failed", { appointmentId: appt.id, error: String(err) });
    }
  }

  log.info("Reminders cron complete", {
    scanned: appointments?.length ?? 0,
    sent,
    skippedQuiet,
    skippedNoConsent,
  });
  return NextResponse.json({
    scanned: appointments?.length ?? 0,
    sent,
    skippedQuiet,
    skippedNoConsent,
  });
}
