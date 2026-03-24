export function DashboardMainSkeleton() {
  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-[#1E1E2A] bg-[#111118] p-5">
            <div className="h-3 w-24 rounded bg-zinc-700/80" />
            <div className="mt-4 h-9 w-28 rounded bg-[#D4A853]/20" />
            <div className="mt-2 h-3 w-36 rounded bg-zinc-700/60" />
          </div>
        ))}
      </section>
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="animate-pulse rounded-2xl border border-[#1E1E2A] bg-[#111118] p-5">
          <div className="h-7 w-48 rounded bg-zinc-700/70" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-24 rounded-xl border border-[#1E1E2A] bg-[#0E0E14]/80" />
            ))}
          </div>
        </div>
        <div className="animate-pulse rounded-2xl border border-[#1E1E2A] bg-[#111118] p-5">
          <div className="h-7 w-40 rounded bg-zinc-700/70" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-20 rounded-xl border border-[#1E1E2A] bg-[#0E0E14]/80" />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export function DashboardRemindersSkeleton() {
  return (
    <section className="animate-pulse rounded-2xl border border-[#1E1E2A] bg-[#111118] p-5">
      <div className="h-7 w-64 rounded bg-zinc-700/70" />
      <div className="mt-2 h-3 w-72 rounded bg-zinc-700/50" />
      <div className="mt-6 space-y-4">
        {Array.from({ length: 2 }).map((_, j) => (
          <div key={j} className="h-40 rounded-xl border border-[#1E1E2A] bg-[#0E0E14]/80" />
        ))}
      </div>
    </section>
  );
}
