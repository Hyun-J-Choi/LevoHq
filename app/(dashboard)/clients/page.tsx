import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/auth";
import { redirect } from "next/navigation";

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export default async function ClientsPage() {
  const supabase = createSupabaseServerClient();
  const businessId = await getCurrentBusinessId(supabase);
  if (!businessId) redirect("/login");

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, phone, email, status, last_visit, lifetime_value")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#D4A853]">CRM</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Clients</h1>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-white/[0.02]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.08] text-left text-xs uppercase tracking-wider text-neutral-500">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Phone</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Last Visit</th>
              <th className="px-5 py-3 text-right">Lifetime Value</th>
            </tr>
          </thead>
          <tbody>
            {(!clients || clients.length === 0) && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-neutral-500">No clients yet.</td></tr>
            )}
            {clients?.map((c) => (
              <tr key={c.id} className="border-b border-white/[0.04] text-neutral-300">
                <td className="px-5 py-3 font-medium text-white">{c.name}</td>
                <td className="px-5 py-3">{c.phone ?? "—"}</td>
                <td className="px-5 py-3">{c.email ?? "—"}</td>
                <td className="px-5 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${c.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-neutral-700/40 text-neutral-400"}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-neutral-500">{formatDate(c.last_visit)}</td>
                <td className="px-5 py-3 text-right font-mono text-[#D4A853]">${Number(c.lifetime_value ?? 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
