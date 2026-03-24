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

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const { data: clients, error } = await admin
    .from("clients")
    .select("id, business_id, name, phone, last_visit, reactivation_sent_at")
    .not("phone", "is", null)
    .not("last_visit", "is", null)
    .lt("last_visit", ninetyDaysAgo);

  if (error) {
    log.error("Reactivation query failed", { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  for (const client of clients ?? []) {
    if (!client.phone) continue;

    // Skip if already sent reactivation within last 90 days
    if (client.reactivation_sent_at) {
      const lastSent = new Date(client.reactivation_sent_at).getTime();
      if (Date.now() - lastSent < 90 * 24 * 60 * 60 * 1000) continue;
    }

    try {
      const systemPrompt = await getBusinessSystemPrompt(client.business_id);
      const message = await generateClaudeMessage(
        `Write a win-back SMS for an inactive client.
Client: ${client.name}
Last visit: ${new Date(client.last_visit).toLocaleDateString()}

Keep under 250 characters. Warm, exclusive, non-pushy. Include a rebooking incentive and CTA.`,
        systemPrompt
      );

      const result = await sendCompliantSMS(client.phone, message, client.business_id);

      if (result.sent) {
        await admin.from("clients").update({ reactivation_sent_at: new Date().toISOString() }).eq("id", client.id);
        sent++;
      }
    } catch (err) {
      log.error("Reactivation send failed", { clientId: client.id, error: String(err) });
    }
  }

  log.info("Reactivation cron complete", { scanned: clients?.length ?? 0, sent });
  return NextResponse.json({ scanned: clients?.length ?? 0, sent });
}
