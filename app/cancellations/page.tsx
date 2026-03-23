import Link from "next/link";
import RecoveryMessageButton from "@/components/RecoveryMessageButton";
import { getCancellationsData } from "@/lib/businessData";

function formatDate(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function CancellationsPage() {
  const { cancellations, waitlist } = await getCancellationsData();

  return (
    <main className="min-h-screen bg-[#0A0A0F] px-6 py-10 md:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#D4A853]">Retention Center</p>
            <h1 className="font-premium-serif text-4xl text-[#F5F2E8]">Cancelled Appointments</h1>
          </div>
          <Link href="/dashboard" className="rounded-xl border border-[#1E1E2A] bg-[#111118] px-4 py-2 text-sm text-[#F5F2E8]">
            Back to Dashboard
          </Link>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-[#1E1E2A] bg-[#111118] p-5">
            <h2 className="font-premium-serif text-2xl text-[#F5F2E8]">Recent Cancellations</h2>
            <div className="mt-4 space-y-4">
              {cancellations.map((item) => (
                <article key={item.id} className="rounded-xl border border-[#1E1E2A] bg-[#0E0E14] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[#F5F2E8]">{item.client_name}</p>
                      <p className="text-xs text-zinc-400">{item.service}</p>
                      <p className="mt-2 text-xs text-zinc-500">{formatDate(item.appointment_time)}</p>
                      <p className="mt-1 text-xs text-zinc-500">Reason: {item.reason ?? "Not provided"}</p>
                    </div>
                    <RecoveryMessageButton
                      clientName={item.client_name}
                      clientPhone={item.client_phone}
                      service={item.service}
                      appointmentTime={item.appointment_time}
                      reason={item.reason}
                    />
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="rounded-2xl border border-[#1E1E2A] bg-[#111118] p-5">
            <h2 className="font-premium-serif text-2xl text-[#F5F2E8]">Waitlist</h2>
            <div className="mt-4 space-y-3">
              {waitlist.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-[#1E1E2A] bg-[#0E0E14] p-4">
                  <p className="text-sm font-semibold text-[#F5F2E8]">{entry.name}</p>
                  <p className="text-xs text-zinc-400">{entry.phone}</p>
                  <p className="mt-1 text-xs text-[#D4A853]">{entry.requested_service}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
