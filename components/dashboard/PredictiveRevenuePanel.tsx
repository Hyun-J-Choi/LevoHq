import { getPredictiveRevenue } from "@/lib/dashboardData";

function formatUsd(amount: number) {
  return `$${amount.toLocaleString()}`;
}

export default async function PredictiveRevenuePanel({
  businessId,
}: {
  businessId: string;
}) {
  const data = await getPredictiveRevenue(businessId);

  const grandTotal = data.totalProjected + data.alreadyBooked;

  return (
    <section className="rounded-2xl border border-[#1E1E2A] bg-[#111118] p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-premium-serif text-2xl text-[#F5F2E8]">
          Revenue Forecast
        </h2>
        <span className="rounded-full border border-[#D4A853]/20 bg-[#D4A853]/5 px-3 py-1 text-xs text-[#D4A853]">
          Next 30 days
        </span>
      </div>

      {/* Big number */}
      <div className="mt-4">
        <p className="font-premium-serif text-4xl text-[#D4A853]">
          {formatUsd(grandTotal)}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          {data.clientsDueCount} clients projected due · {data.alreadyBookedCount} already booked
        </p>
      </div>

      {/* Breakdown bars */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
          <p className="text-xs text-emerald-300/70">Already Booked</p>
          <p className="mt-1 text-lg font-semibold text-emerald-300">
            {formatUsd(data.alreadyBooked)}
          </p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
          <p className="text-xs text-amber-300/70">On Track to Book</p>
          <p className="mt-1 text-lg font-semibold text-amber-300">
            {formatUsd(data.totalOnTrack)}
          </p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
          <p className="text-xs text-red-300/70">At Risk</p>
          <p className="mt-1 text-lg font-semibold text-red-300">
            {formatUsd(data.totalAtRisk)}
          </p>
        </div>
      </div>

      {/* Service breakdown */}
      {data.next30Days.length > 0 && (
        <div className="mt-5">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-400 mb-3">
            By Service
          </p>
          <div className="space-y-2">
            {data.next30Days.map((row) => {
              const pct = data.totalProjected > 0
                ? Math.round((row.projectedRevenue / data.totalProjected) * 100)
                : 0;

              return (
                <div key={row.service} className="rounded-xl border border-[#1E1E2A] bg-[#0E0E14] p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#F5F2E8]">
                        {row.service}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {row.clientsDue} clients due · avg {formatUsd(row.avgPrice)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[#D4A853]">
                      {formatUsd(row.projectedRevenue)}
                    </p>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 w-full rounded-full bg-[#1E1E2A]">
                    <div
                      className="h-1.5 rounded-full bg-[#D4A853]"
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data.next30Days.length === 0 && (
        <p className="mt-4 text-sm text-zinc-500">
          No clients are due for treatment in the next 30 days.
        </p>
      )}
    </section>
  );
}
