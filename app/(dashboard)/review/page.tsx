import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listUnresolvedForBusiness } from "@/lib/needsReviewQueries";
import ResolveButton from "./ResolveButton";

export const dynamic = "force-dynamic";

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default async function ReviewQueuePage() {
  const supabase = createSupabaseServerClient();
  let businessId: string;
  try {
    businessId = await getCurrentBusinessId(supabase);
  } catch {
    redirect("/login");
  }

  const rows = await listUnresolvedForBusiness(supabase, businessId, 100);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#D4A853]">
          Safety
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Review Queue
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-400">
          Messages our safety guard caught before going out. The client got a
          neutral &ldquo;a team member will follow up&rdquo; reply. Review each
          one, then reach out personally if appropriate.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-6 py-12 text-center">
          <p className="text-sm text-neutral-400">
            Nothing to review. Your queue is clean.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li
              key={row.id}
              className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                    <span className="font-mono text-neutral-300">
                      {row.recipient_phone}
                    </span>
                    <span>·</span>
                    <span>{formatTime(row.created_at)}</span>
                    {row.source_label && (
                      <>
                        <span>·</span>
                        <span className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-neutral-400">
                          {row.source_label}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {row.trigger_types.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-red-400/30 bg-red-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-red-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-500">
                      Original (blocked)
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-200">
                      {row.original_message}
                    </p>
                  </div>

                  {row.matched_substrings.length > 0 && (
                    <p className="mt-2 text-[11px] text-neutral-500">
                      Matched: {row.matched_substrings.join(", ")}
                    </p>
                  )}

                  {row.sent_replacement && (
                    <div className="mt-4">
                      <p className="text-[10px] uppercase tracking-wider text-neutral-500">
                        Sent instead
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-400">
                        {row.sent_replacement}
                      </p>
                    </div>
                  )}
                </div>

                <ResolveButton id={row.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
