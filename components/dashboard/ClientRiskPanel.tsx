import { getClientRiskScores } from "@/lib/dashboardData";

function riskDot(risk: "green" | "yellow" | "red") {
  const colors = {
    green: "bg-emerald-400",
    yellow: "bg-amber-400",
    red: "bg-red-400 animate-pulse",
  };
  return colors[risk];
}

function riskLabel(risk: "green" | "yellow" | "red") {
  const labels = {
    green: "On Track",
    yellow: "Due Now",
    red: "Needs Call",
  };
  return labels[risk];
}

function riskLabelClasses(risk: "green" | "yellow" | "red") {
  const classes = {
    green: "bg-emerald-500/10 text-emerald-300 border border-emerald-400/25",
    yellow: "bg-amber-500/10 text-amber-300 border border-amber-400/25",
    red: "bg-red-500/10 text-red-300 border border-red-400/25",
  };
  return classes[risk];
}

function formatDaysAgo(days: number) {
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export default async function ClientRiskPanel({
  businessId,
}: {
  businessId: string;
}) {
  const riskData = await getClientRiskScores(businessId);

  const redCount = riskData.filter((c) => c.risk === "red").length;
  const yellowCount = riskData.filter((c) => c.risk === "yellow").length;
  const greenCount = riskData.filter((c) => c.risk === "green").length;

  // Show red and yellow clients (actionable), limit to 20
  const actionable = riskData.filter((c) => c.risk !== "green").slice(0, 20);

  return (
    <section className="rounded-2xl border border-[#1E1E2A] bg-[#111118] p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-premium-serif text-2xl text-[#F5F2E8]">
          Client Risk Monitor
        </h2>
      </div>

      {/* Summary pills */}
      <div className="mt-4 flex gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400 animate-pulse" />
          <span className="text-sm font-semibold text-red-300">{redCount}</span>
          <span className="text-xs text-red-300/70">Need Call</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="text-sm font-semibold text-amber-300">{yellowCount}</span>
          <span className="text-xs text-amber-300/70">Due Now</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="text-sm font-semibold text-emerald-300">{greenCount}</span>
          <span className="text-xs text-emerald-300/70">On Track</span>
        </div>
      </div>

      {/* Client list */}
      <div className="mt-4 space-y-2">
        {actionable.length === 0 ? (
          <p className="text-sm text-zinc-500">
            All clients are on track. No action needed.
          </p>
        ) : (
          actionable.map((client) => (
            <div
              key={`${client.id}-${client.service}`}
              className="flex items-center gap-3 rounded-xl border border-[#1E1E2A] bg-[#0E0E14] p-4"
            >
              {/* Risk dot */}
              <span
                className={`h-3 w-3 shrink-0 rounded-full ${riskDot(client.risk)}`}
              />

              {/* Client info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[#F5F2E8] truncate">
                    {client.name}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${riskLabelClasses(client.risk)}`}
                  >
                    {riskLabel(client.risk)}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  {client.service} · Last visit {formatDaysAgo(client.days_since)}
                  {client.days_overdue > 0 && (
                    <span className="text-amber-400">
                      {" "}· {client.days_overdue}d overdue
                    </span>
                  )}
                </p>
                {client.risk === "red" && (
                  <p className="mt-1 text-[11px] text-red-300/60">
                    Reminder sent — no response or rebooking
                  </p>
                )}
              </div>

              {/* Phone number for quick action */}
              {client.phone && client.risk === "red" && (
                <a
                  href={`tel:${client.phone.replace(/\D/g, "")}`}
                  className="shrink-0 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/20 transition-colors"
                >
                  Call
                </a>
              )}
            </div>
          ))
        )}
      </div>

      {riskData.filter((c) => c.risk !== "green").length > 20 && (
        <p className="mt-3 text-center text-xs text-zinc-500">
          Showing top 20 of {riskData.filter((c) => c.risk !== "green").length} clients needing attention
        </p>
      )}
    </section>
  );
}
