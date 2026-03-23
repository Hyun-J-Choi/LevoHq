"use client";

import { useState } from "react";

type Sentiment = "positive" | "neutral" | "negative";

export default function FollowUpSentiment({ clientName, service }: { clientName: string; service: string }) {
  const [sentiment, setSentiment] = useState<Sentiment>("neutral");

  const reviewMessage = `Hi ${clientName.split(" ")[0]}, we are so glad you loved your ${service}. If you have 30 seconds, would you mind leaving us a Google review? It helps us so much: https://g.page/r/your-business-id/review`;

  return (
    <div className="mt-4 rounded-xl border border-[#1E1E2A] bg-[#0E0E14] p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">Client Sentiment</p>
      <div className="mt-2 flex gap-2">
        {(["positive", "neutral", "negative"] as Sentiment[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setSentiment(value)}
            className={`rounded-lg px-3 py-1.5 text-xs capitalize ${
              sentiment === value ? "bg-[#D4A853] text-[#0A0A0F]" : "border border-[#1E1E2A] bg-[#111118] text-zinc-300"
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      {sentiment === "positive" ? (
        <div className="mt-3 rounded-xl border border-[#D4A853]/35 bg-[#D4A853]/10 p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-[#D4A853]">Google Review Request</p>
          <p className="mt-1 text-sm text-[#F5F2E8]">{reviewMessage}</p>
        </div>
      ) : null}
    </div>
  );
}
