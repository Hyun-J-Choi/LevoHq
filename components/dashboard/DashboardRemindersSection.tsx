import { generateClaudeMessage } from "@/lib/claude";
import { getUpcomingReminderAppointments } from "@/lib/businessData";
import SmsSendButton from "@/components/SmsSendButton";
import { ReactNode } from "react";

function formatDateTime(value: string | null) {
  if (!value) return "-";
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
  if (s.includes("progress") || s.includes("pending") || s.includes("scheduled")) {
    return "bg-amber-500/10 text-amber-300 border border-amber-400/25";
  }
  return "bg-zinc-500/10 text-zinc-300 border border-zinc-400/25";
}

export default async function DashboardRemindersSection({
  businessId,
}: {
  businessId: string;
}) {
  const reminderRows = await getUpcomingReminderAppointments(businessId);

  const reminders = await Promise.all(
    reminderRows.map(async (appt) => {
      const when = formatDateTime(appt.scheduled_at);
      try {
        const text = await generateClaudeMessage(
          `Write a premium appointment reminder SMS for a beauty/wellness client.
Client: ${appt.client_name}
Service: ${appt.service}
Appointment: ${when}

Keep under 50 words. Warm, concise, include time. Single SMS, no markdown.`
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

  return (
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
                  <p className="text-xs text-zinc-500">{formatDateTime(r.scheduled_at)}</p>
                  {r.client_phone && <p className="text-xs text-zinc-500">{r.client_phone}</p>}
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] ${statusClasses(r.status)}`}>
                  {r.status}
                </span>
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
