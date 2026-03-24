import Link from "next/link";
import { ReactNode } from "react";
import { getDashboardSnapshot } from "@/lib/dashboardData";

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusClasses(status: string) {
  const s = status.toLowerCase();
  if (s.includes("active") || s.includes("confirmed") || s.includes("completed")) {
    return "bg-emerald-500/10 text-emerald-300 border border-emerald-400/25";
  }
  if (s.includes("progress") || s.includes("pending")) {
    return "bg-amber-500/10 text-amber-300 border border-amber-400/25";
  }
  return "bg-zinc-500/10 text-zinc-300 border border-zinc-400/25";
}

export default async function DashboardMainSection() {
  const { todayAppointments, activeClientsCount, revenueMtdUsd, completedMtdCount, activity, errors } =
    await getDashboardSnapshot();

  return (
    <>
      {errors.length > 0 ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <p className="font-medium text-amber-100">Some data could not load</p>
          <ul className="mt-1 list-inside list-disc text-xs text-amber-200/80">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Revenue MTD"
          value={`$${revenueMtdUsd.toLocaleString()}`}
          sub={`${completedMtdCount} completed × $150 avg`}
        />
        <MetricCard label="Active clients" value={String(activeClientsCount)} sub="Status = Active" />
        <MetricCard
          label="Today"
          value={String(todayAppointments.length)}
          sub="Appointments on calendar"
        />
        <MetricCard
          label="Completed MTD"
          value={String(completedMtdCount)}
          sub="This month"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Today&apos;s appointments">
          {todayAppointments.length === 0 ? (
            <p className="text-sm text-zinc-500">No appointments scheduled for today.</p>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((appt) => (
                <div key={appt.id} className="rounded-xl border border-[#1E1E2A] bg-[#0E0E14] p-4">
                  <p className="text-sm font-semibold text-[#F5F2E8]">{appt.service}</p>
                  <p className="text-xs text-zinc-400">{appt.client_name}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-zinc-500">{formatDateTime(appt.appointment_time)}</p>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] ${statusClasses(appt.status)}`}>
                      {appt.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Recent SMS activity">
          {activity.length === 0 ? (
            <p className="text-sm text-zinc-500">No messages in conversations yet.</p>
          ) : (
            <div className="space-y-3">
              {activity.map((item) => (
                <div key={item.id} className="flex items-start gap-3 rounded-xl border border-[#1E1E2A] bg-[#0E0E14] p-4">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#D4A853]" />
                  <div className="min-w-0">
                    <p className="break-words text-sm text-[#F5F2E8]">{item.detail}</p>
                    <p className="mt-1 text-xs text-zinc-500">{formatDateTime(item.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </section>
    </>
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

export function DashboardNavLinks() {
  return (
    <div className="flex flex-wrap gap-3 text-sm">
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
  );
}
