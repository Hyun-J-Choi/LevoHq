import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function trackAttribution(
  businessId: string,
  clientId: string,
  appointmentId: string | null,
  triggerType: string,
  conversationId?: string,
  revenue?: number
) {
  const admin = createSupabaseAdmin();
  const { error } = await admin.from("attribution_events").insert({
    business_id: businessId,
    client_id: clientId,
    appointment_id: appointmentId,
    trigger_type: triggerType,
    trigger_conversation_id: conversationId ?? null,
    revenue: revenue ?? 0,
  });

  if (error) {
    console.error("Failed to track attribution:", error.message);
  }
}
