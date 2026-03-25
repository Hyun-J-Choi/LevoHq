import { generateClaudeMessage } from "@/lib/claude";
import { getMissedCallsData } from "@/lib/businessData";
import SendSMSButton from "@/components/SendSMSButton";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/auth";
import { redirect } from "next/navigation";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function MissedCallPage() {
  const supabase = createSupabaseServerClient();
  const businessId = await getCurrentBusinessId(supabase);
  if (!businessId) redirect("/login");

  const rows = await getMissedCallsData(businessId);

  const enriched = await Promise.all(
    rows.map(async (row) => {
      try {
        const autoReply = await generateClaudeMessage(
          `Write a short SMS auto-reply for a missed call at a clinic.
Caller number: ${row.from_phone}
Known name (may be unknown): ${row.client_name ?? "unknown"}

Requirements:
- Under 55 words, SMS tone, warm and professional.
- Apologize for missing them, invite them to text back or book.
- Do not claim you looked up their file unless name is known.
- Single message only, no quotes or markdown.`
        );
        return { ...row, autoReply };
      } catch {
        return {
          ...row,
          autoReply: `Hi — sorry we missed your call. Reply here or text BOOK and we'll get you scheduled right away.`,
        };
      }
    })
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#D4A853]">Voice</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Missed Calls</h1>
        <p className="mt-1 text-sm text-neutral-500">AI-drafted SMS responses ready to send.</p>
      </div>

      <section className="space-y-4">
        {enriched.length === 0 && (
          <p className="text-sm text-neutral-500">No missed calls.</p>
        )}
        {enriched.map((call) => (
          <article key={call.id} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{call.from_phone}</p>
                {call.client_name ? <p className="text-xs text-neutral-400">{call.client_name}</p> : null}
                {call.to_phone ? <p className="text-xs text-neutral-500">To: {call.to_phone}</p> : null}
              </div>
              <p className="text-xs text-neutral-500">{formatWhen(call.created_at)}</p>
            </div>
            <div className="rounded-lg border border-[#D4A853]/35 bg-[#D4A853]/10 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[#D4A853]">Suggested reply</p>
              <p className="mt-2 text-sm text-white">{call.autoReply}</p>
            </div>
            <SendSMSButton phone={call.from_phone} message={call.autoReply} label="Send Reply" />
          </article>
        ))}
      </section>
    </div>
  );
}
