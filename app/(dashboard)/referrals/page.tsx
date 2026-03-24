import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ReferralsPage() {
  const supabase = createSupabaseServerClient();
  const businessId = await getCurrentBusinessId(supabase);
  if (!businessId) redirect("/login");

  const { data: referrals } = await supabase
    .from("referrals")
    .select("id, referred_name, referred_phone, referral_code, status, reward_type, created_at, clients(name)")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  const statusColor: Record<string, string> = {
    pending: "bg-neutral-700/40 text-neutral-400",
    contacted: "bg-blue-500/20 text-blue-400",
    booked: "bg-emerald-500/20 text-emerald-400",
    rewarded: "bg-[#D4A853]/20 text-[#D4A853]",
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#D4A853]">Growth</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Referrals</h1>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-white/[0.02]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.08] text-left text-xs uppercase tracking-wider text-neutral-500">
              <th className="px-5 py-3">Referrer</th>
              <th className="px-5 py-3">Referred</th>
              <th className="px-5 py-3">Code</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {(!referrals || referrals.length === 0) && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-neutral-500">No referrals yet.</td></tr>
            )}
            {referrals?.map((r) => {
              const referrerName = Array.isArray(r.clients) ? (r.clients[0] as { name: string })?.name : (r.clients as { name: string } | null)?.name;
              return (
                <tr key={r.id} className="border-b border-white/[0.04] text-neutral-300">
                  <td className="px-5 py-3 font-medium text-white">{referrerName ?? "—"}</td>
                  <td className="px-5 py-3">{r.referred_name ?? "—"}</td>
                  <td className="px-5 py-3 font-mono text-xs text-[#D4A853]">{r.referral_code}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[r.status] ?? "bg-neutral-700/40 text-neutral-400"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-neutral-500">{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
