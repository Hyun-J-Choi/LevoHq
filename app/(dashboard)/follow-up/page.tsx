import { generateClaudeMessage } from "@/lib/claude";
import { getFollowUpData } from "@/lib/businessData";
import FollowUpSentiment from "@/components/FollowUpSentiment";
import SendSMSButton from "@/components/SendSMSButton";
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

export default async function FollowUpPage() {
  const supabase = createSupabaseServerClient();
  const businessId = await getCurrentBusinessId(supabase);
  if (!businessId) redirect("/login");

  const rows = await getFollowUpData(businessId);

  const enriched = await Promise.all(
    rows.map(async (row) => {
      try {
        const message = await generateClaudeMessage(
          `Write a premium post-appointment check-in SMS.
Client: ${row.client_name}
Service: ${row.service}
Visit time: ${row.scheduled_at}

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
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#D4A853]">Post-Visit Care</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">24-48 Hour Follow-Up</h1>
      </div>

      <section className="space-y-4">
        {enriched.length === 0 && (
          <p className="text-sm text-neutral-500">No recent completed appointments to follow up on.</p>
        )}
        {enriched.map((entry) => (
          <article key={entry.id} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">{entry.client_name}</p>
                <p className="text-xs text-neutral-400">{entry.phone}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#D4A853]">{entry.service}</p>
                <p className="text-xs text-neutral-500">{formatDate(entry.scheduled_at)}</p>
              </div>
            </div>

            <p className="rounded-lg border border-[#D4A853]/30 bg-[#D4A853]/10 p-4 text-sm text-white">{entry.message}</p>
            <div className="flex items-center gap-4">
              <SendSMSButton phone={entry.phone} message={entry.message} label="Send Follow-Up" />
              <FollowUpSentiment clientName={entry.client_name} service={entry.service} />
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
