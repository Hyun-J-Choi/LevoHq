"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ResolveButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/needs-human-review/${id}/resolve`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? `HTTP ${res.status}`);
        setPending(false);
        return;
      }
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={onClick}
        disabled={pending}
        className="rounded-md border border-[#D4A853]/40 bg-[#D4A853]/10 px-3 py-1.5 text-xs font-medium text-[#D4A853] transition hover:bg-[#D4A853]/20 disabled:opacity-40"
      >
        {pending ? "Resolving…" : "Mark resolved"}
      </button>
      {error && <p className="text-[10px] text-red-400">{error}</p>}
    </div>
  );
}
