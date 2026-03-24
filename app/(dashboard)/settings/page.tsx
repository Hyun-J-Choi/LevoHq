"use client";

import { useEffect, useState, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface Service { name: string; price: number }
interface Protocol { id: string; service: string; interval_days: number; reminder_template: string | null }

const DEFAULT_PROTOCOLS: Omit<Protocol, "id">[] = [
  { service: "Botox", interval_days: 90, reminder_template: null },
  { service: "Dermal Filler", interval_days: 180, reminder_template: null },
  { service: "Laser Hair Removal", interval_days: 42, reminder_template: null },
  { service: "Chemical Peel", interval_days: 30, reminder_template: null },
  { service: "Microneedling", interval_days: 45, reminder_template: null },
  { service: "HydraFacial", interval_days: 30, reminder_template: null },
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [timezone, setTimezone] = useState("America/Los_Angeles");
  const [brandVoice, setBrandVoice] = useState("");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [message, setMessage] = useState("");

  // Treatment protocols state
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [newProtoService, setNewProtoService] = useState("");
  const [newProtoDays, setNewProtoDays] = useState("");
  const [newProtoTemplate, setNewProtoTemplate] = useState("");
  const [protoSaving, setProtoSaving] = useState(false);
  const [protoMessage, setProtoMessage] = useState("");

  const supabase = createSupabaseBrowserClient();

  const loadProtocols = useCallback(async (bizId: string) => {
    const { data } = await supabase
      .from("treatment_protocols")
      .select("id, service, interval_days, reminder_template")
      .eq("business_id", bizId)
      .order("service");

    if (data && data.length > 0) {
      setProtocols(data);
    } else if (data && data.length === 0) {
      // Pre-populate defaults on first load
      const inserts = DEFAULT_PROTOCOLS.map((p) => ({
        ...p,
        business_id: bizId,
      }));
      const { data: inserted } = await supabase
        .from("treatment_protocols")
        .insert(inserts)
        .select("id, service, interval_days, reminder_template");
      if (inserted) setProtocols(inserted);
    }
  }, [supabase]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membership } = await supabase
        .from("business_users")
        .select("business_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (!membership) return;
      setBusinessId(membership.business_id);

      const { data: biz } = await supabase
        .from("businesses")
        .select("phone, timezone, brand_voice, google_review_url, services")
        .eq("id", membership.business_id)
        .single();

      if (biz) {
        setPhone(biz.phone ?? "");
        setTimezone(biz.timezone ?? "America/Los_Angeles");
        setBrandVoice(biz.brand_voice ?? "");
        setGoogleReviewUrl(biz.google_review_url ?? "");
        setServices(Array.isArray(biz.services) ? biz.services : []);
      }

      await loadProtocols(membership.business_id);
      setLoading(false);
    }
    load();
  }, [supabase, loadProtocols]);

  async function handleSave() {
    if (!businessId) return;
    setSaving(true);
    setMessage("");
    const { error } = await supabase
      .from("businesses")
      .update({ phone, timezone, brand_voice: brandVoice, google_review_url: googleReviewUrl, services })
      .eq("id", businessId);

    setMessage(error ? "Failed to save." : "Settings saved.");
    setSaving(false);
  }

  function addService() { setServices([...services, { name: "", price: 0 }]); }
  function removeService(i: number) { setServices(services.filter((_, idx) => idx !== i)); }
  function updateService(i: number, field: keyof Service, val: string) {
    const updated = [...services];
    if (field === "price") updated[i].price = Number(val) || 0;
    else updated[i].name = val;
    setServices(updated);
  }

  async function addProtocol() {
    if (!businessId || !newProtoService.trim() || !newProtoDays) return;
    setProtoSaving(true);
    setProtoMessage("");

    const { data, error } = await supabase
      .from("treatment_protocols")
      .insert({
        business_id: businessId,
        service: newProtoService.trim(),
        interval_days: Number(newProtoDays),
        reminder_template: newProtoTemplate.trim() || null,
      })
      .select("id, service, interval_days, reminder_template")
      .single();

    if (error) {
      setProtoMessage("Failed to add protocol.");
    } else if (data) {
      setProtocols([...protocols, data]);
      setNewProtoService("");
      setNewProtoDays("");
      setNewProtoTemplate("");
      setProtoMessage("Protocol added.");
    }
    setProtoSaving(false);
  }

  async function deleteProtocol(id: string) {
    const { error } = await supabase
      .from("treatment_protocols")
      .delete()
      .eq("id", id);

    if (!error) {
      setProtocols(protocols.filter((p) => p.id !== id));
    }
  }

  if (loading) return <div className="space-y-8"><p className="text-neutral-500">Loading settings...</p></div>;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#D4A853]">Configuration</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Settings</h1>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Business Info */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Business Info</h2>
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-neutral-500">Phone</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-[#D4A853]/50" />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-neutral-500">Timezone</span>
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="mt-1 w-full rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none">
              {["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Phoenix"].map((tz) => (
                <option key={tz} value={tz}>{tz.replace("America/", "").replace(/_/g, " ")}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-neutral-500">Brand Voice</span>
            <textarea value={brandVoice} onChange={(e) => setBrandVoice(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-[#D4A853]/50" placeholder="e.g. warm, professional, luxury" />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-neutral-500">Google Review URL</span>
            <input value={googleReviewUrl} onChange={(e) => setGoogleReviewUrl(e.target.value)} className="mt-1 w-full rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-[#D4A853]/50" />
          </label>
        </div>

        {/* Services */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Services</h2>
            <button onClick={addService} className="rounded-lg border border-[#D4A853]/30 px-3 py-1 text-xs font-medium text-[#D4A853] hover:bg-[#D4A853]/10">+ Add</button>
          </div>
          {services.map((s, i) => (
            <div key={i} className="flex gap-3 items-end">
              <label className="flex-1">
                <span className="text-xs text-neutral-500">Name</span>
                <input value={s.name} onChange={(e) => updateService(i, "name", e.target.value)} className="mt-1 w-full rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none" />
              </label>
              <label className="w-28">
                <span className="text-xs text-neutral-500">Price</span>
                <input type="number" value={s.price} onChange={(e) => updateService(i, "price", e.target.value)} className="mt-1 w-full rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none" />
              </label>
              <button onClick={() => removeService(i)} className="mb-1 text-xs text-red-400 hover:text-red-300">Remove</button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button onClick={handleSave} disabled={saving} className="rounded-lg bg-[#D4A853] px-6 py-2.5 text-sm font-semibold text-[#0A0A0A] hover:brightness-110 disabled:opacity-60">
            {saving ? "Saving..." : "Save Settings"}
          </button>
          {message && <p className="text-sm text-neutral-400">{message}</p>}
        </div>

        {/* Treatment Intervals */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-white">Treatment Intervals</h2>
            <p className="mt-1 text-sm text-neutral-500">
              LevoHQ will automatically remind clients when it&apos;s time for their next treatment based on these intervals.
            </p>
          </div>

          {/* Existing protocols */}
          {protocols.length > 0 && (
            <div className="space-y-2">
              {protocols.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.01] px-4 py-3">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-white">{p.service}</span>
                    <span className="rounded-full bg-[#D4A853]/15 px-2.5 py-0.5 text-xs font-medium text-[#D4A853]">
                      every {p.interval_days} days
                    </span>
                    {p.reminder_template && (
                      <span className="text-xs text-neutral-500 truncate max-w-[200px]" title={p.reminder_template}>
                        {p.reminder_template}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => deleteProtocol(p.id)}
                    className="text-xs text-red-400 hover:text-red-300 transition"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}

          {protocols.length === 0 && (
            <p className="text-sm text-neutral-500 py-2">No protocols configured yet.</p>
          )}

          {/* Add new protocol */}
          <div className="space-y-3 border-t border-white/[0.06] pt-5">
            <p className="text-xs uppercase tracking-wider text-neutral-500">Add Protocol</p>
            <div className="flex gap-3 items-end flex-wrap">
              <label className="flex-1 min-w-[160px]">
                <span className="text-xs text-neutral-500">Service name</span>
                <input
                  value={newProtoService}
                  onChange={(e) => setNewProtoService(e.target.value)}
                  placeholder="e.g. Botox"
                  className="mt-1 w-full rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-[#D4A853]/50"
                />
              </label>
              <label className="w-32">
                <span className="text-xs text-neutral-500">Interval (days)</span>
                <input
                  type="number"
                  min={1}
                  value={newProtoDays}
                  onChange={(e) => setNewProtoDays(e.target.value)}
                  placeholder="90"
                  className="mt-1 w-full rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-[#D4A853]/50"
                />
              </label>
              <label className="flex-1 min-w-[160px]">
                <span className="text-xs text-neutral-500">Reminder hint (optional)</span>
                <input
                  value={newProtoTemplate}
                  onChange={(e) => setNewProtoTemplate(e.target.value)}
                  placeholder="e.g. Time for a touch-up!"
                  className="mt-1 w-full rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-[#D4A853]/50"
                />
              </label>
              <button
                onClick={addProtocol}
                disabled={protoSaving || !newProtoService.trim() || !newProtoDays}
                className="rounded-lg bg-[#D4A853] px-5 py-2 text-sm font-semibold text-[#0A0A0A] hover:brightness-110 disabled:opacity-40 transition"
              >
                {protoSaving ? "Adding..." : "Add"}
              </button>
            </div>
            {protoMessage && <p className="text-sm text-neutral-400">{protoMessage}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
