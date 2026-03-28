"use client";

export default function GlobalError({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0F] px-6">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-[0.22em] text-[#D4A853]">
          Something went wrong
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-white">
          Unexpected Error
        </h1>
        <p className="mt-3 text-sm text-neutral-400">
          We hit an issue loading this page. Try again or head back to the
          dashboard.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-[#D4A853] px-5 py-2.5 text-sm font-semibold text-[#0A0A0A] transition hover:brightness-110"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="rounded-lg border border-white/[0.1] px-5 py-2.5 text-sm font-medium text-neutral-300 transition hover:border-white/20 hover:text-white"
          >
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
