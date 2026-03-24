"use client";

import { useState, useRef } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface ParsedRow {
  name: string;
  phone: string;        // normalized to E.164 before storage
  phoneRaw: string;     // original for display
  service: string;
  last_visit_date: string;
}

// ─── Phone normalization ────────────────────────────────────────────────────
// Accepts: +15551234567, (555) 123-4567, 555-123-4567, 5551234567, etc.
// Returns E.164 (+1XXXXXXXXXX) for US numbers, or null if unparseable.
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length > 7 && raw.trim().startsWith("+")) return `+${digits}`;
  return null;
}

// ─── RFC-4180 compliant CSV parser ──────────────────────────────────────────
// Handles quoted fields, commas inside quotes, escaped quotes ("").
function parseCSVLine(line: string): string[] {
  const cols: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        cols.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
  }
  cols.push(cur.trim());
  return cols;
}

export default function ImportCSVModal({
  businessId,
  onClose,
  onDone,
}: {
  businessId: string;
  onClose: () => void;
  onDone: (count: number) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState("");

  function parseCSV(text: string): { parsed: ParsedRow[]; errors: string[] } {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2)
      return { parsed: [], errors: ["CSV must have a header row and at least one data row."] };

    const header = parseCSVLine(lines[0]).map((h) =>
      h.toLowerCase().replace(/[^a-z_]/g, "")
    );

    const nameIdx = header.findIndex((h) => h === "name");
    const phoneIdx = header.findIndex((h) => h === "phone");
    const serviceIdx = header.findIndex((h) => h === "service");
    const dateIdx = header.findIndex((h) => h === "last_visit_date");

    const missing: string[] = [];
    if (nameIdx === -1) missing.push("name");
    if (phoneIdx === -1) missing.push("phone");
    if (serviceIdx === -1) missing.push("service");
    if (dateIdx === -1) missing.push("last_visit_date");
    if (missing.length > 0)
      return { parsed: [], errors: [`Missing required columns: ${missing.join(", ")}`] };

    const parsed: ParsedRow[] = [];
    const errs: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      const name = cols[nameIdx] || "";
      const phoneRaw = cols[phoneIdx] || "";
      const service = cols[serviceIdx] || "";
      const last_visit_date = cols[dateIdx] || "";

      if (!name || !phoneRaw) {
        errs.push(`Row ${i + 1}: missing name or phone, skipping.`);
        continue;
      }

      // Normalize phone to E.164
      const phone = normalizePhone(phoneRaw);
      if (!phone) {
        errs.push(`Row ${i + 1}: can't parse phone "${phoneRaw}" — use format +15551234567 or 5551234567, skipping.`);
        continue;
      }

      // Validate date
      if (last_visit_date && isNaN(Date.parse(last_visit_date))) {
        errs.push(`Row ${i + 1}: invalid date "${last_visit_date}", skipping.`);
        continue;
      }

      parsed.push({ name, phone, phoneRaw, service, last_visit_date });
    }

    return { parsed, errors: errs };
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setErrors([]);
    setRows([]);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { parsed, errors: parseErrors } = parseCSV(text);
      setRows(parsed);
      setErrors(parseErrors);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (rows.length === 0) return;
    setImporting(true);
    setErrors([]);

    const supabase = createSupabaseBrowserClient();
    const importErrors: string[] = [];
    let successCount = 0;

    // ── Batch upsert clients ──────────────────────────────────────────────
    const clientInserts = rows.map((r) => ({
      business_id: businessId,
      name: r.name,
      phone: r.phone,
      status: "active",
      last_visit: r.last_visit_date ? new Date(r.last_visit_date).toISOString() : null,
    }));

    const { data: upsertedClients, error: clientBatchErr } = await supabase
      .from("clients")
      .upsert(clientInserts, { onConflict: "business_id,phone", ignoreDuplicates: false })
      .select("id, phone");

    if (clientBatchErr || !upsertedClients) {
      // Fall back to row-by-row if batch upsert fails (e.g. no unique constraint yet)
      for (const row of rows) {
        const { data: existing } = await supabase
          .from("clients")
          .select("id")
          .eq("business_id", businessId)
          .eq("phone", row.phone)
          .maybeSingle();

        let clientId = existing?.id;

        if (!clientId) {
          const { data: nc, error: ce } = await supabase
            .from("clients")
            .insert({
              business_id: businessId,
              name: row.name,
              phone: row.phone,
              status: "active",
              last_visit: row.last_visit_date ? new Date(row.last_visit_date).toISOString() : null,
            })
            .select("id")
            .single();
          if (ce || !nc) {
            importErrors.push(`Failed to create client "${row.name}": ${ce?.message ?? "unknown"}`);
            continue;
          }
          clientId = nc.id;
        }

        await insertAppointmentAndConsent(supabase, businessId, clientId, row, importErrors);
        successCount++;
      }
    } else {
      // Build phone → id map from batch result
      const phoneToId: Record<string, string> = {};
      for (const c of upsertedClients) {
        if (c.phone) phoneToId[c.phone] = c.id;
      }

      // ── Batch insert appointments ───────────────────────────────────────
      const apptInserts = rows
        .filter((r) => phoneToId[r.phone])
        .map((r) => ({
          business_id: businessId,
          client_id: phoneToId[r.phone],
          client_name: r.name,
          client_phone: r.phone,
          service: r.service,
          scheduled_at: r.last_visit_date
            ? new Date(r.last_visit_date).toISOString()
            : new Date().toISOString(),
          status: "completed",
        }));

      if (apptInserts.length > 0) {
        const { error: apptErr } = await supabase.from("appointments").insert(apptInserts);
        if (apptErr) importErrors.push(`Appointment insert warning: ${apptErr.message}`);
      }

      // ── Batch insert SMS consent ────────────────────────────────────────
      const consentInserts = rows
        .filter((r) => phoneToId[r.phone])
        .map((r) => ({
          phone: r.phone,
          business_id: businessId,
          consent_source: "import" as const,
          consented_at: new Date().toISOString(),
        }));

      if (consentInserts.length > 0) {
        // Ignore duplicate errors
        await supabase.from("sms_consent").upsert(consentInserts, {
          onConflict: "phone,business_id",
          ignoreDuplicates: true,
        });
      }

      successCount = apptInserts.length;
    }

    if (importErrors.length > 0) setErrors(importErrors);
    setImporting(false);
    if (successCount > 0) onDone(successCount);
  }

  const previewRows = rows.slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-white/[0.08] bg-[#111116] p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Import Clients</h2>
            <p className="text-sm text-neutral-500">
              Upload a CSV to import existing clients and their last visit.
            </p>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition text-xl leading-none">
            &times;
          </button>
        </div>

        {/* Format guide */}
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-xs uppercase tracking-wider text-neutral-500 mb-2">Required CSV format</p>
          <code className="block text-sm text-[#D4A853] font-mono">name,phone,service,last_visit_date</code>
          <code className="block text-sm text-neutral-400 font-mono mt-1">
            Jane Smith,5551234567,Botox,2025-12-15
          </code>
          <p className="mt-2 text-xs text-neutral-500">
            Phone accepts any US format: +15551234567, (555) 123-4567, 555-123-4567, or 10 digits.
          </p>
        </div>

        {/* File upload */}
        <div>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-dashed border-white/[0.15] px-6 py-4 w-full text-sm text-neutral-400 hover:border-[#D4A853]/40 hover:text-white transition"
          >
            {fileName ? (
              <span className="text-white">{fileName} — {rows.length} rows parsed</span>
            ) : (
              "Click to select CSV file"
            )}
          </button>
        </div>

        {/* Parse errors */}
        {errors.length > 0 && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 space-y-1 max-h-32 overflow-y-auto">
            {errors.map((err, i) => (
              <p key={i} className="text-xs text-red-400">{err}</p>
            ))}
          </div>
        )}

        {/* Preview table */}
        {previewRows.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-neutral-500">
              Preview ({Math.min(5, rows.length)} of {rows.length} rows)
            </p>
            <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-xs uppercase tracking-wider text-neutral-500">
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Phone (normalized)</th>
                    <th className="px-3 py-2">Service</th>
                    <th className="px-3 py-2">Last Visit</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((r, i) => (
                    <tr key={i} className="border-b border-white/[0.03] text-neutral-300">
                      <td className="px-3 py-2 text-white">{r.name}</td>
                      <td className="px-3 py-2 font-mono text-xs">
                        <span className="text-emerald-400">{r.phone}</span>
                        {r.phoneRaw !== r.phone && (
                          <span className="ml-1 text-neutral-600">({r.phoneRaw})</span>
                        )}
                      </td>
                      <td className="px-3 py-2">{r.service}</td>
                      <td className="px-3 py-2 text-neutral-500">{r.last_visit_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 5 && (
              <p className="text-xs text-neutral-500">...and {rows.length - 5} more rows</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-white/[0.15] px-5 py-2 text-sm text-neutral-300 hover:border-white/[0.3] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={importing || rows.length === 0}
            className="rounded-lg bg-[#D4A853] px-6 py-2 text-sm font-semibold text-[#0A0A0A] hover:brightness-110 disabled:opacity-40 transition"
          >
            {importing ? `Importing ${rows.length} clients...` : `Import ${rows.length} clients`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helper for row-by-row fallback ────────────────────────────────────────
async function insertAppointmentAndConsent(
  supabase: ReturnType<typeof createSupabaseBrowserClient>,
  businessId: string,
  clientId: string,
  row: ParsedRow,
  importErrors: string[]
) {
  const { error: apptErr } = await supabase.from("appointments").insert({
    business_id: businessId,
    client_id: clientId,
    client_name: row.name,
    client_phone: row.phone,
    service: row.service,
    scheduled_at: row.last_visit_date
      ? new Date(row.last_visit_date).toISOString()
      : new Date().toISOString(),
    status: "completed",
  });
  if (apptErr) importErrors.push(`Appointment error for "${row.name}": ${apptErr.message}`);

  await supabase.from("sms_consent").upsert(
    { phone: row.phone, business_id: businessId, consent_source: "import", consented_at: new Date().toISOString() },
    { onConflict: "phone,business_id", ignoreDuplicates: true }
  );
}
