import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/auth";
import { redirect } from "next/navigation";

function formatDate(d: string) {
  return new Date(d).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default async function AppointmentsPage() {
  const supabase = createSupabaseServerClient();
  const businessId = await getCurrentBusinessId(supabase);
  if (!businessId) redirect("/login");

  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, client_name, client_phone, service, scheduled_at, status, service_price")
    .eq("business_id", businessId)
    .order("scheduled_at", { ascending: false })
    .limit(50);

  const statusColor: Record<string, string> = {
    scheduled: "bg-blue-500/20 text-blue-400",
    confirmed: "bg-emerald-500/20 text-emerald-400",
    completed: "bg-[#D4A853]/20 text-[#D4A853]",
    cancelled: "bg-red-500/20 text-red-400",
    no_show: "bg-orange-500/20 text-orange-400",
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#D4A853]">Schedule</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Appointments</h1>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-white/[0.02]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.08] text-left text-xs uppercase tracking-wider text-neutral-500">
              <th className="px-5 py-3">Client</th>
              <th className="px-5 py-3">Service</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {(!appointments || appointments.length === 0) && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-neutral-500">No appointments yet.</td></tr>
            )}
            {appointments?.map((a) => (
              <tr key={a.id} className="border-b border-white/[0.04] text-neutral-300">
                <td className="px-5 py-3">
                  <p className="font-medium text-white">{a.client_name ?? "—"}</p>
                  <p className="text-xs text-neutral-500">{a.client_phone ?? ""}</p>
                </td>
                <td className="px-5 py-3">{a.service}</td>
                <td className="px-5 py-3 text-neutral-400">{formatDate(a.scheduled_at)}</td>
                <td className="px-5 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[a.status] ?? "bg-neutral-700/40 text-neutral-400"}`}>
                    {a.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right font-mono text-[#D4A853]">${Number(a.service_price ?? 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
