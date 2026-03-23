import Link from "next/link";
import { generateClaudeMessage } from "@/lib/claude";
import { getMissedCallsData } from "@/lib/businessData";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function MissedCallPage() {
  const rows = await getMissedCallsData();

  const enriched = await Promise.all(
    rows.map(async (row) => {
      try {
        const autoReply = await generateClaudeMessage(
          `Write a short premium SMS auto-reply for a missed call at a beauty/wellness studio.
Caller number: ${row.from_phone}
Known name (may be unknown): ${row.client_name ?? "unknown"}

Requirements:
- Under 55 words, SMS tone, warm and professional.
- Apologize for missing them, invite them to text back or book.
- Do not claim you looked up their file unless name is known; if unknown, keep it general.
- Single message only, no quotes or markdown.`
        );
        return { ...row, autoReply };
      } catch {
        return {
          ...row,
          autoReply: `Hi — sorry we missed your call at the studio. Reply here or text BOOK and we'll get you scheduled right away.`,
        };
      }
    })
  );

  return (
    <main className="min-h-screen bg-[#0A0A0F] px-6 py-10 md:px-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#D4A853]">Voice</p>
            <h1 className="font-premium-serif text-4xl text-[#F5F2E8]">Missed Calls</h1>
            <p className="mt-1 text-sm text-zinc-500">AI-drafted SMS responses ready to send.</p>
          </div>
          <Link href="/dashboard" className="rounded-xl border border-[#1E1E2A] bg-[#111118] px-4 py-2 text-sm text-[#F5F2E8]">
            Back to Dashboard
          </Link>
        </div>

        <section className="space-y-4">
          {enriched.map((call) => (
            <article key={call.id} className="rounded-2xl border border-[#1E1E2A] bg-[#111118] p-5">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#F5F2E8]">{call.from_phone}</p>
                  {call.client_name ? <p className="text-xs text-zinc-400">{call.client_name}</p> : null}
                  {call.to_phone ? <p className="text-xs text-zinc-500">To: {call.to_phone}</p> : null}
                </div>
                <p className="text-xs text-zinc-500">{formatWhen(call.created_at)}</p>
              </div>
              <div className="rounded-xl border border-[#D4A853]/35 bg-[#D4A853]/10 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-[#D4A853]">Suggested reply</p>
                <p className="mt-2 text-sm text-[#F5F2E8]">{call.autoReply}</p>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
