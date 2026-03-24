import { generateClaudeMessage } from "@/lib/claude";
import { getReactivationData } from "@/lib/businessData";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/auth";
import { redirect } from "next/navigation";

function formatDate(value: string | null) {
  if (!value) return "No last visit";
  return new Date(value).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ReactivationPage() {
  const supabase = createSupabaseServerClient();
  const businessId = await getCurrentBusinessId(supabase);
  if (!businessId) redirect("/login");

  const rows = await getReactivationData(businessId);

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
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#D4A853]">Retention Campaigns</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">90+ Day Reactivation</h1>
      </div>

      <section className="space-y-4">
        {enriched.length === 0 && (
          <p className="text-sm text-neutral-500">No inactive clients to reactivate.</p>
        )}
        {enriched.map((entry) => (
          <article key={entry.id} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">{entry.name}</p>
                <p className="text-xs text-neutral-400">{entry.phone}</p>
                <p className="text-xs text-neutral-500">{entry.email}</p>
              </div>
              <p className="text-xs text-neutral-500">Last visit: {formatDate(entry.last_visit)}</p>
            </div>

            <p className="rounded-lg border border-[#D4A853]/35 bg-[#D4A853]/10 p-4 text-sm text-white">{entry.message}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
