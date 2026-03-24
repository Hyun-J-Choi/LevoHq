import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AnalyticsPage() {
  const supabase = createSupabaseServerClient();
  const businessId = await getCurrentBusinessId(supabase);
  if (!businessId) redirect("/login");

  // Get attribution events
  const { data: events } = await supabase
    .from("attribution_events")
    .select("trigger_type, revenue")
    .eq("business_id", businessId);

  // Group by trigger_type
  const breakdown: Record<string, { count: number; revenue: number }> = {};
  let totalRevenue = 0;
  for (const e of events ?? []) {
    const key = e.trigger_type;
    if (!breakdown[key]) breakdown[key] = { count: 0, revenue: 0 };
    breakdown[key].count++;
    breakdown[key].revenue += Number(e.revenue ?? 0);
    totalRevenue += Number(e.revenue ?? 0);
  }

  // Get NPS
  const { data: npsData } = await supabase
    .from("nps_responses")
    .select("score")
    .eq("business_id", businessId);

  const npsScores = (npsData ?? []).map((n) => n.score).filter((s): s is number => s != null);
  const avgNps = npsScores.length > 0 ? (npsScores.reduce((a, b) => a + b, 0) / npsScores.length).toFixed(1) : "—";
  const promoters = npsScores.filter((s) => s >= 9).length;
  const detractors = npsScores.filter((s) => s <= 6).length;
  const npsScore = npsScores.length > 0 ? Math.round(((promoters - detractors) / npsScores.length) * 100) : null;

  const triggerLabels: Record<string, string> = {
    reminder: "Reminders",
    recovery: "Cancel Recovery",
    reactivation: "Reactivation",
    follow_up: "Follow-Up",
    nurture: "Lead Nurture",
    treatment_reminder: "Treatment Reminders",
    birthday: "Birthday",
    waitlist: "Waitlist",
    referral: "Referrals",
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#D4A853]">Intelligence</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Analytics</h1>
      </div>

      {/* Top stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
          <p className="text-xs uppercase tracking-wider text-neutral-500">Total Revenue Attributed</p>
          <p className="mt-2 font-mono text-3xl font-medium text-[#D4A853]">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
          <p className="text-xs uppercase tracking-wider text-neutral-500">Events Tracked</p>
          <p className="mt-2 font-mono text-3xl font-medium text-white">{(events ?? []).length}</p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
          <p className="text-xs uppercase tracking-wider text-neutral-500">NPS Score</p>
          <p className="mt-2 font-mono text-3xl font-medium text-white">{npsScore !== null ? npsScore : "—"}</p>
          <p className="mt-1 text-xs text-neutral-500">Avg rating: {avgNps}/10 ({npsScores.length} responses)</p>
        </div>
      </div>

      {/* Revenue breakdown */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
        <h2 className="text-lg font-semibold text-white">Revenue by Trigger</h2>
        <div className="mt-6 space-y-3">
          {Object.entries(breakdown).length === 0 && (
            <p className="text-sm text-neutral-500">No attribution events yet. Revenue will appear here as SMS automations generate bookings.</p>
          )}
          {Object.entries(breakdown)
            .sort((a, b) => b[1].revenue - a[1].revenue)
            .map(([key, val]) => (
              <div key={key} className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.01] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{triggerLabels[key] ?? key}</p>
                  <p className="text-xs text-neutral-500">{val.count} events</p>
                </div>
                <p className="font-mono text-lg font-medium text-[#D4A853]">${val.revenue.toLocaleString()}</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
