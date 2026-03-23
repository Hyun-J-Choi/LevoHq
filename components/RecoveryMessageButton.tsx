"use client";

import { useState } from "react";

export default function RecoveryMessageButton({
  clientName,
  service,
  appointmentTime,
  reason,
}: {
  clientName: string;
  service: string;
  appointmentTime: string;
  reason?: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sent, setSent] = useState(false);

  async function generateMessage() {
    setLoading(true);
    setError("");
    setSent(false);

    try {
      const response = await fetch("/api/ai/recovery-message", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ clientName, service, appointmentTime, reason }),
      });

      if (!response.ok) throw new Error("Generation failed");
      const data = (await response.json()) as { message: string };
      setMessage(data.message);
      setIsModalOpen(true);
    } catch (err) {
      console.error(err);
      setError("Could not generate a recovery message right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={generateMessage}
        disabled={loading}
        className="rounded-xl bg-[#D4A853] px-3 py-2 text-xs font-semibold text-[#0A0A0F] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Generating..." : "Send Recovery Message"}
      </button>

      {error ? <p className="text-xs text-rose-300">{error}</p> : null}

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#1E1E2A] bg-[#111118] p-5 shadow-2xl">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[#D4A853]">SMS Preview</p>
              <h3 className="font-premium-serif text-2xl text-[#F5F2E8]">Recovery Message</h3>
            </div>
            <p className="rounded-xl border border-[#D4A853]/30 bg-[#D4A853]/10 p-4 text-sm text-[#F5F2E8]">{message}</p>
            {sent ? <p className="mt-3 text-xs text-emerald-300">Message marked as sent.</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl border border-[#1E1E2A] bg-[#0E0E14] px-3 py-2 text-xs text-zinc-300"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setSent(true)}
                className="rounded-xl bg-[#D4A853] px-3 py-2 text-xs font-semibold text-[#0A0A0F]"
              >
                Send SMS
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
