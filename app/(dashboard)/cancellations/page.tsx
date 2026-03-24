import RecoveryMessageButton from "@/components/RecoveryMessageButton";
import { getCancellationsData } from "@/lib/businessData";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/auth";
import { redirect } from "next/navigation";

function formatDate(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function CancellationsPage() {
  const supabase = createSupabaseServerClient();
  const businessId = await getCurrentBusinessId(supabase);
  if (!businessId) redirect("/login");

  const { cancellations, waitlist } = await getCancellationsData(businessId);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#D4A853]">Retention Center</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Cancelled Appointments</h1>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
          <h2 className="text-lg font-semibold text-white">Recent Cancellations</h2>
          <div className="mt-4 space-y-4">
            {cancellations.length === 0 && (
              <p className="text-sm text-neutral-500">No recent cancellations.</p>
            )}
            {cancellations.map((item) => (
              <article key={item.id} className="rounded-lg border border-white/[0.06] bg-white/[0.01] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.client_name}</p>
                    <p className="text-xs text-neutral-400">{item.service}</p>
                    <p className="mt-2 text-xs text-neutral-500">{formatDate(item.scheduled_at)}</p>
                    <p className="mt-1 text-xs text-neutral-500">Reason: {item.reason ?? "Not provided"}</p>
                  </div>
                  <RecoveryMessageButton
                    clientName={item.client_name}
                    clientPhone={item.client_phone}
                    service={item.service}
                    appointmentTime={item.scheduled_at}
                    reason={item.reason}
                  />
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
          <h2 className="text-lg font-semibold text-white">Waitlist</h2>
          <div className="mt-4 space-y-3">
            {waitlist.length === 0 && (
              <p className="text-sm text-neutral-500">No one on the waitlist.</p>
            )}
            {waitlist.map((entry) => (
              <div key={entry.id} className="rounded-lg border border-white/[0.06] bg-white/[0.01] p-4">
                <p className="text-sm font-semibold text-white">{entry.name}</p>
                <p className="text-xs text-neutral-400">{entry.phone}</p>
                <p className="mt-1 text-xs text-[#D4A853]">{entry.requested_service}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
