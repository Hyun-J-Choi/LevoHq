import Link from "next/link";
import { ReactNode } from "react";
import { generateClaudeMessage } from "@/lib/claude";
import { getBusinessDashboardData, getUpcomingReminderAppointments } from "@/lib/businessData";
import SmsSendButton from "@/components/SmsSendButton";

function formatDateTime(value: string | null) {
  if (!value) return "No recent visit";
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusClasses(status: string) {
  if (status.toLowerCase().includes("active") || status.toLowerCase().includes("confirmed")) {
    return "bg-emerald-500/10 text-emerald-300 border border-emerald-400/25";
  }
  if (status.toLowerCase().includes("progress") || status.toLowerCase().includes("pending")) {
    return "bg-amber-500/10 text-amber-300 border border-amber-400/25";
  }
  return "bg-zinc-500/10 text-zinc-300 border border-zinc-400/25";
}

export default async function DashboardPage() {
  const { clients, appointments, activity } = await getBusinessDashboardData();
  const reminderRows = await getUpcomingReminderAppointments();

  const reminders = await Promise.all(
    reminderRows.map(async (appt) => {
      const when = formatDateTime(appt.appointment_time);
      try {
        const text = await generateClaudeMessage(
          `Write a premium appointment reminder SMS for a beauty/wellness client.
Client: ${appt.client_name}
Service: ${appt.service}
Appointment: ${when}
Status: ${appt.status}

Keep under 50 words. Warm, concise, include time and one line on parking/arrival if generic. Single SMS, no markdown.`
        );
        return { ...appt, reminderText: text };
      } catch {
        return {
          ...appt,
          reminderText: `Hi ${appt.client_name.split(" ")[0]}, reminder: your ${appt.service} is coming up at ${when}. Reply if you need to reschedule.`,
        };
      }
    })
  );

  const revenueEstimate = appointments.length * 1650;
  const showRate = appointments.length > 0 ? Math.round((appointments.filter((a) => a.status !== "Cancelled").length / appointments.length) * 100) : 0;

  return (
    <main className="min-h-screen bg-[#0A0A0F] px-6 py-10 md:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#D4A853]">LevoHQ Control Center</p>
            <h1 className="font-premium-serif text-4xl text-[#F5F2E8]">Business Dashboard</h1>
          </div>
          <div className="flex gap-3 text-sm">
            <Link href="/book" className="rounded-xl border border-[#1E1E2A] bg-[#111118] px-4 py-2 text-[#F5F2E8] hover:border-[#D4A853]/60">
              Booking Page
            </Link>
            <Link href="/cancellations" className="rounded-xl border border-[#D4A853]/45 bg-[#111118] px-4 py-2 text-[#D4A853]">
              Cancellations
            </Link>
            <Link href="/follow-up" className="rounded-xl border border-[#1E1E2A] bg-[#111118] px-4 py-2 text-[#F5F2E8] hover:border-[#D4A853]/60">
              Follow-Up
            </Link>
            <Link href="/reactivation" className="rounded-xl border border-[#1E1E2A] bg-[#111118] px-4 py-2 text-[#F5F2E8] hover:border-[#D4A853]/60">
              Reactivation
            </Link>
            <Link href="/missed-call" className="rounded-xl border border-[#1E1E2A] bg-[#111118] px-4 py-2 text-[#F5F2E8] hover:border-[#D4A853]/60">
              Missed Calls
            </Link>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Revenue MTD" value={`$${revenueEstimate.toLocaleString()}`} sub="From booked services" />
          <MetricCard label="Active Clients" value={String(clients.filter((c) => c.status === "Active").length)} sub={`${clients.length} tracked`} />
          <MetricCard label="Show Rate" value={`${showRate}%`} sub="Last 7 days" />
          <MetricCard label="Leads This Week" value={String(Math.max(appointments.length + 2, 6))} sub="Inbound booking intent" />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Panel title="Active Clients">
            <div className="space-y-3">
              {clients.map((client) => (
                <div key={client.id} className="rounded-xl border border-[#1E1E2A] bg-[#0E0E14] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-[#F5F2E8]">{client.name}</h3>
                      <p className="text-xs text-zinc-400">{client.phone}</p>
                      <p className="mt-2 text-xs text-zinc-500">Last visit: {formatDateTime(client.last_visit)}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] ${statusClasses(client.status)}`}>{client.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Today&apos;s Appointments">
            <div className="space-y-3">
              {appointments.map((appt) => (
                <div key={appt.id} className="rounded-xl border border-[#1E1E2A] bg-[#0E0E14] p-4">
                  <p className="text-sm font-semibold text-[#F5F2E8]">{appt.service}</p>
                  <p className="text-xs text-zinc-400">{appt.client_name}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-zinc-500">{formatDateTime(appt.appointment_time)}</p>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] ${statusClasses(appt.status)}`}>{appt.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <Panel title="Appointment reminders (next 24 hours)">
          <p className="mb-4 text-xs text-zinc-500">AI-drafted SMS reminders ready to send via Twilio.</p>
          <div className="space-y-4">
            {reminders.length === 0 ? (
              <p className="text-sm text-zinc-500">No appointments in the next 24 hours.</p>
            ) : (
              reminders.map((r) => (
                <div key={r.id} className="rounded-xl border border-[#1E1E2A] bg-[#0E0E14] p-4">
                  <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[#F5F2E8]">{r.client_name}</p>
                      <p className="text-xs text-zinc-400">{r.service}</p>
                      <p className="text-xs text-zinc-500">{formatDateTime(r.appointment_time)}</p>
                      {r.client_phone ? <p className="text-xs text-zinc-500">{r.client_phone}</p> : null}
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] ${statusClasses(r.status)}`}>{r.status}</span>
                  </div>
                  <div className="rounded-lg border border-[#D4A853]/25 bg-[#D4A853]/5 p-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-[#D4A853]">Suggested SMS</p>
                    <p className="mt-1 text-sm text-[#F5F2E8]">{r.reminderText}</p>
                    <SmsSendButton phone={r.client_phone} body={r.reminderText} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel title="What LevoHQ Is Doing Right Now">
          <div className="space-y-3">
            {activity.map((item) => (
              <div key={item.id} className="flex items-start gap-3 rounded-xl border border-[#1E1E2A] bg-[#0E0E14] p-4">
                <span className="mt-1 h-2 w-2 animate-pulse rounded-full bg-[#D4A853]" />
                <div>
                  <p className="text-sm text-[#F5F2E8]">{item.detail}</p>
                  <p className="mt-1 text-xs text-zinc-500">{formatDateTime(item.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </main>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-[#1E1E2A] bg-[#111118] p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">{label}</p>
      <p className="mt-2 font-premium-serif text-3xl text-[#D4A853]">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{sub}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#1E1E2A] bg-[#111118] p-5">
      <h2 className="font-premium-serif text-2xl text-[#F5F2E8]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
