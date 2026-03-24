import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function createNurtureSequence(businessId: string, leadId: string) {
  const admin = createSupabaseAdmin();
  const now = new Date();

  const steps = [
    { step: 1, daysFromNow: 1 },
    { step: 2, daysFromNow: 3 },
    { step: 3, daysFromNow: 7 },
  ];

  const rows = steps.map((s) => {
    const scheduledFor = new Date(now);
    scheduledFor.setDate(scheduledFor.getDate() + s.daysFromNow);
    scheduledFor.setHours(10, 0, 0, 0); // 10 AM

    return {
      business_id: businessId,
      lead_id: leadId,
      step: s.step,
      scheduled_for: scheduledFor.toISOString(),
    };
  });

  const { error } = await admin.from("nurture_sequences").insert(rows);
  if (error) {
    console.error("Failed to create nurture sequence:", error.message);
  }
}
