import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { sendCompliantSMS } from "@/lib/twilio";

export async function notifyNextWaitlisted(businessId: string, service: string) {
  const admin = createSupabaseAdmin();

  const { data: entry } = await admin
    .from("waitlist")
    .select("id, name, phone, requested_service")
    .eq("business_id", businessId)
    .eq("requested_service", service)
    .eq("claimed", false)
    .is("notified_at", null)
    .order("added_at", { ascending: true })
    .limit(1)
    .single();

  if (!entry || !entry.phone) return null;

  const firstName = entry.name?.split(" ")[0] ?? "there";
  const body = `Hi ${firstName}! Great news — a ${entry.requested_service} slot just opened up. Reply YES to claim it before it fills!`;

  const result = await sendCompliantSMS(entry.phone, body, businessId);

  if (result.sent) {
    await admin
      .from("waitlist")
      .update({ notified_at: new Date().toISOString() })
      .eq("id", entry.id);
  }

  return { notified: result.sent, entry };
}
