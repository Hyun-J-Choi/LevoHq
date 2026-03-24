import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function WaitlistPage() {
  const supabase = createSupabaseServerClient();
  const businessId = await getCurrentBusinessId(supabase);
  if (!businessId) redirect("/login");

  const { data: entries } = await supabase
    .from("waitlist")
    .select("id, name, phone, requested_service, added_at, notified_at")
    .eq("business_id", businessId)
    .eq("claimed", false)
    .order("added_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#D4A853]">Fill Gaps</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Waitlist</h1>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-white/[0.02]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.08] text-left text-xs uppercase tracking-wider text-neutral-500">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Phone</th>
              <th className="px-5 py-3">Service</th>
              <th className="px-5 py-3">Added</th>
              <th className="px-5 py-3">Notified</th>
            </tr>
          </thead>
          <tbody>
            {(!entries || entries.length === 0) && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-neutral-500">No one on the waitlist.</td></tr>
            )}
            {entries?.map((e) => (
              <tr key={e.id} className="border-b border-white/[0.04] text-neutral-300">
                <td className="px-5 py-3 font-medium text-white">{e.name ?? "—"}</td>
                <td className="px-5 py-3">{e.phone ?? "—"}</td>
                <td className="px-5 py-3 text-[#D4A853]">{e.requested_service ?? "—"}</td>
                <td className="px-5 py-3 text-neutral-500">{e.added_at ? new Date(e.added_at).toLocaleDateString() : "—"}</td>
                <td className="px-5 py-3">{e.notified_at ? <span className="text-emerald-400 text-xs">Sent</span> : <span className="text-neutral-600 text-xs">Pending</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
