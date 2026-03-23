import Link from "next/link";
import BookForm from "@/components/BookForm";

export default function BookPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0F] px-6 py-10 md:px-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#D4A853]">Client Booking</p>
            <h1 className="font-premium-serif text-4xl text-[#F5F2E8]">Reserve Your Session</h1>
          </div>
          <Link href="/dashboard" className="rounded-xl border border-[#1E1E2A] bg-[#111118] px-4 py-2 text-sm text-[#F5F2E8]">
            Back to Dashboard
          </Link>
        </div>

        <BookForm />
      </div>
    </main>
  );
}
