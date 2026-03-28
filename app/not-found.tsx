import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0F] px-6">
      <div className="max-w-md text-center">
        <p className="text-6xl font-bold text-[#D4A853]">404</p>
        <h1 className="mt-4 text-2xl font-semibold text-white">
          Page not found
        </h1>
        <p className="mt-3 text-sm text-neutral-400">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            href="/dashboard"
            className="inline-block rounded-lg bg-[#D4A853] px-5 py-2.5 text-sm font-semibold text-[#0A0A0A] transition hover:brightness-110"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
