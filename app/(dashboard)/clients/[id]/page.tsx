import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

function formatDate(d: string | null) {
  if (!d) return "\u2014";
  return new Date(d).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  let businessId: string;
  try {
    businessId = await getCurrentBusinessId(supabase);
  } catch {
    redirect("/login");
  }

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", params.id)
    .eq("business_id", businessId)
    .single();

  if (!client) notFound();

  const [{ data: appointments }, { data: messages }] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, service, scheduled_at, status, notes, service_price")
      .eq("business_id", businessId)
      .eq("client_id", client.id)
      .order("scheduled_at", { ascending: false })
      .limit(50),
    supabase
      .from("conversations")
      .select("id, direction, message, sent_at")
      .eq("business_id", businessId)
      .eq("client_id", client.id)
      .order("sent_at", { ascending: false })
      .limit(50),
  ]);

  const statusColor: Record<string, string> = {
    active: "bg-emerald-500/20 text-emerald-400",
    inactive: "bg-neutral-700/40 text-neutral-400",
    churned: "bg-red-500/20 text-red-400",
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/clients" className="text-neutral-500 hover:text-white transition text-sm">&larr; Clients</Link>
      </div>

      {/* Client header */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">{client.name}</h1>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-neutral-400">
              {client.phone && <span>{client.phone}</span>}
              {client.email && <span>{client.email}</span>}
            </div>
          </div>
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${statusColor[client.status] ?? statusColor.inactive}`}>
            {client.status ?? "unknown"}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-neutral-600">Lifetime Value</p>
            <p className="mt-1 text-lg font-semibold text-[#D4A853]">${Number(client.lifetime_value ?? 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-neutral-600">Last Visit</p>
            <p className="mt-1 text-sm text-neutral-300">{formatDate(client.last_visit)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-neutral-600">Appointments</p>
            <p className="mt-1 text-sm text-neutral-300">{appointments?.length ?? 0}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-neutral-600">Messages</p>
            <p className="mt-1 text-sm text-neutral-300">{messages?.length ?? 0}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Appointment history */}
        <section className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">Appointment History</h2>
          {(!appointments || appointments.length === 0) ? (
            <p className="text-sm text-neutral-500">No appointments found.</p>
          ) : (
            <div className="space-y-3">
              {appointments.map((a) => (
                <div key={a.id} className="flex items-start justify-between rounded-lg border border-white/[0.04] bg-white/[0.01] p-3">
                  <div>
                    <p className="text-sm font-medium text-white">{a.service ?? "Appointment"}</p>
                    <p className="text-xs text-neutral-500">{formatDateTime(a.scheduled_at)}</p>
                    {a.notes && <p className="mt-1 text-xs text-neutral-600">{a.notes}</p>}
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-medium ${a.status === "completed" ? "text-emerald-400" : a.status === "cancelled" ? "text-red-400" : "text-[#D4A853]"}`}>
                      {a.status}
                    </span>
                    {a.service_price > 0 && (
                      <p className="mt-0.5 text-xs font-mono text-neutral-400">${Number(a.service_price).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SMS history */}
        <section className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">SMS History</h2>
          {(!messages || messages.length === 0) ? (
            <p className="text-sm text-neutral-500">No messages found.</p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {messages.map((m) => (
                <div key={m.id} className={`rounded-lg p-3 text-sm ${m.direction === "inbound" ? "border border-white/[0.06] bg-white/[0.02] text-neutral-300" : "border border-[#D4A853]/20 bg-[#D4A853]/5 text-white"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-wider text-neutral-600">{m.direction === "inbound" ? "Received" : "Sent"}</span>
                    <span className="text-[11px] text-neutral-600">{formatDateTime(m.sent_at)}</span>
                  </div>
                  <p>{m.message}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
