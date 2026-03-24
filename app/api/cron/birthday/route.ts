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

  const now = new Date();
  const currentYear = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // Query clients with birthdays today who haven't been wished this year
  const { data: clients } = await admin
    .from("clients")
    .select("id, business_id, name, phone, date_of_birth, birthday_sent_year")
    .not("date_of_birth", "is", null)
    .not("phone", "is", null);

  for (const client of clients ?? []) {
    if (!client.date_of_birth || !client.phone) continue;
    if (client.birthday_sent_year === currentYear) continue;

    const dob = new Date(client.date_of_birth);
    if (dob.getMonth() + 1 !== month || dob.getDate() !== day) continue;

    try {
      const systemPrompt = await getBusinessSystemPrompt(client.business_id);
      const message = await generateClaudeMessage(
        `Write a birthday SMS for a valued client.
Client: ${client.name}

Keep under 200 characters. Include a birthday treat or discount offer. Make it feel special and personal.`,
        systemPrompt
      );

      const result = await sendCompliantSMS(client.phone, message, client.business_id);

      if (result.sent) {
        await admin.from("clients").update({ birthday_sent_year: currentYear }).eq("id", client.id);
        sent++;
      }
    } catch (err) {
      log.error("Birthday send failed", { clientId: client.id, error: String(err) });
    }
  }

  log.info("Birthday cron complete", { sent });
  return NextResponse.json({ sent });
}
