"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImportCSVModal from "@/components/clients/ImportCSVModal";

interface Client {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: string | null;
  last_visit: string | null;
  lifetime_value: number | null;
}

function formatDate(d: string | null) {
  if (!d) return "\u2014";
  return new Date(d).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export default function ClientsPageClient({
  clients,
  businessId,
}: {
  clients: Client[];
  businessId: string;
}) {
  const [showImport, setShowImport] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const router = useRouter();

  function handleImportDone(count: number) {
    setShowImport(false);
    setSuccessMsg(`Successfully imported ${count} client${count === 1 ? "" : "s"}.`);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#D4A853]">CRM</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Clients</h1>
        </div>
        <button
          onClick={() => { setShowImport(true); setSuccessMsg(""); }}
          className="rounded-lg bg-[#D4A853] px-5 py-2.5 text-sm font-semibold text-[#0A0A0A] hover:brightness-110 transition"
        >
          Import Clients
        </button>
      </div>

      {successMsg && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {successMsg}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-white/[0.02]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.08] text-left text-xs uppercase tracking-wider text-neutral-500">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Phone</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Last Visit</th>
              <th className="px-5 py-3 text-right">Lifetime Value</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-neutral-500">No clients yet. Import a CSV to get started.</td></tr>
            )}
            {clients.map((c) => (
              <tr key={c.id} className="border-b border-white/[0.04] text-neutral-300">
                <td className="px-5 py-3 font-medium text-white">{c.name}</td>
                <td className="px-5 py-3">{c.phone ?? "\u2014"}</td>
                <td className="px-5 py-3">{c.email ?? "\u2014"}</td>
                <td className="px-5 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${c.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-neutral-700/40 text-neutral-400"}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-neutral-500">{formatDate(c.last_visit)}</td>
                <td className="px-5 py-3 text-right font-mono text-[#D4A853]">${Number(c.lifetime_value ?? 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showImport && (
        <ImportCSVModal
          businessId={businessId}
          onClose={() => setShowImport(false)}
          onDone={handleImportDone}
        />
      )}
    </div>
  );
}
