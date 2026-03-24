"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ComposeBox({ phone }: { phone: string }) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSend() {
    if (!body.trim()) return;
    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/conversations/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to: phone, body }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Send failed");
      }

      setBody("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
      {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
      <div className="flex gap-3">
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-[#D4A853]/50"
        />
        <button
          onClick={handleSend}
          disabled={sending || !body.trim()}
          className="rounded-lg bg-[#D4A853] px-5 py-2 text-sm font-semibold text-[#0A0A0A] hover:brightness-110 disabled:opacity-50"
        >
          {sending ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
