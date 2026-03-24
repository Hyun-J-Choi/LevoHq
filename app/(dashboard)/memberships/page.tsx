import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function MembershipsPage() {
  const supabase = createSupabaseServerClient();
  const businessId = await getCurrentBusinessId(supabase);
  if (!businessId) redirect("/login");

  const { data: memberships } = await supabase
    .from("memberships")
    .select("id, package_name, total_sessions, used_sessions, expires_at, status, clients(name)")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  const statusColor: Record<string, string> = {
    active: "bg-emerald-500/20 text-emerald-400",
    expired: "bg-neutral-700/40 text-neutral-400",
    cancelled: "bg-red-500/20 text-red-400",
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#D4A853]">Retention</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Memberships</h1>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-white/[0.02]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.08] text-left text-xs uppercase tracking-wider text-neutral-500">
              <th className="px-5 py-3">Client</th>
              <th className="px-5 py-3">Package</th>
              <th className="px-5 py-3">Sessions</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Expires</th>
            </tr>
          </thead>
          <tbody>
            {(!memberships || memberships.length === 0) && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-neutral-500">No memberships yet.</td></tr>
            )}
            {memberships?.map((m) => {
              const clientName = Array.isArray(m.clients) ? (m.clients[0] as { name: string })?.name : (m.clients as { name: string } | null)?.name;
              return (
                <tr key={m.id} className="border-b border-white/[0.04] text-neutral-300">
                  <td className="px-5 py-3 font-medium text-white">{clientName ?? "—"}</td>
                  <td className="px-5 py-3">{m.package_name}</td>
                  <td className="px-5 py-3">
                    <span className="font-mono text-[#D4A853]">{m.used_sessions}</span>
                    <span className="text-neutral-600">/{m.total_sessions}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[m.status] ?? "bg-neutral-700/40 text-neutral-400"}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-neutral-500">{m.expires_at ? new Date(m.expires_at).toLocaleDateString() : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
