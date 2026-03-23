import { generateClaudeMessage } from "@/lib/claude";
import { getFollowUpData } from "@/lib/businessData";
import FollowUpSentiment from "@/components/FollowUpSentiment";
import Link from "next/link";

function formatDate(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function FollowUpPage() {
  const rows = await getFollowUpData();

  const enriched = await Promise.all(
    rows.map(async (row) => {
      try {
        const message = await generateClaudeMessage(
          `Write a premium post-appointment check-in SMS.
Client: ${row.client_name}
Service: ${row.service}
Visit time: ${row.appointment_time}

Keep under 60 words. Sound warm and personalized. Ask one simple question about how they are feeling today.`
        );
        return { ...row, message };
      } catch {
        return {
          ...row,
          message: `Hi ${row.client_name.split(" ")[0]}, we hope you are feeling great after your ${row.service}. We wanted to check in and see how your skin is doing today. Reply here if you want any aftercare tips from our team.`,
        };
      }
    })
  );

  return (
    <main className="min-h-screen bg-[#0A0A0F] px-6 py-10 md:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#D4A853]">Post-Visit Care</p>
            <h1 className="font-premium-serif text-4xl text-[#F5F2E8]">24-48 Hour Follow-Up</h1>
          </div>
          <Link href="/dashboard" className="rounded-xl border border-[#1E1E2A] bg-[#111118] px-4 py-2 text-sm text-[#F5F2E8]">
            Back to Dashboard
          </Link>
        </div>

        <section className="space-y-4">
          {enriched.map((entry) => (
            <article key={entry.id} className="rounded-2xl border border-[#1E1E2A] bg-[#111118] p-5">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#F5F2E8]">{entry.client_name}</p>
                  <p className="text-xs text-zinc-400">{entry.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#D4A853]">{entry.service}</p>
                  <p className="text-xs text-zinc-500">{formatDate(entry.appointment_time)}</p>
                </div>
              </div>

              <p className="rounded-xl border border-[#D4A853]/30 bg-[#D4A853]/10 p-4 text-sm text-[#F5F2E8]">{entry.message}</p>
              <FollowUpSentiment clientName={entry.client_name} service={entry.service} />
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
