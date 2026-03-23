import Link from "next/link";
import { generateClaudeMessage } from "@/lib/claude";
import { getReactivationData } from "@/lib/businessData";

function formatDate(value: string | null) {
  if (!value) return "No last visit";
  return new Date(value).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ReactivationPage() {
  const rows = await getReactivationData();

  const enriched = await Promise.all(
    rows.map(async (row) => {
      try {
        const message = await generateClaudeMessage(
          `Write a premium win-back SMS for an inactive client.
Client: ${row.name}
Last visit: ${row.last_visit ?? "unknown"}

Keep it under 65 words. Tone should be warm, exclusive, and non-pushy.
Include a limited-time rebooking incentive and a direct CTA.`
        );
        return { ...row, message };
      } catch {
        return {
          ...row,
          message: `Hi ${row.name.split(" ")[0]}, it has been a while and we would love to welcome you back. For this week only, we can reserve a priority slot with a returning-client refresh perk. Reply with your preferred day and we will handle the rest.`,
        };
      }
    })
  );

  return (
    <main className="min-h-screen bg-[#0A0A0F] px-6 py-10 md:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#D4A853]">Retention Campaigns</p>
            <h1 className="font-premium-serif text-4xl text-[#F5F2E8]">90+ Day Reactivation</h1>
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
                  <p className="text-sm font-semibold text-[#F5F2E8]">{entry.name}</p>
                  <p className="text-xs text-zinc-400">{entry.phone}</p>
                  <p className="text-xs text-zinc-500">{entry.email}</p>
                </div>
                <p className="text-xs text-zinc-500">Last visit: {formatDate(entry.last_visit)}</p>
              </div>

              <p className="rounded-xl border border-[#D4A853]/35 bg-[#D4A853]/10 p-4 text-sm text-[#F5F2E8]">{entry.message}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
