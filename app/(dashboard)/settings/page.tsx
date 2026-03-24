"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface Service { name: string; price: number }

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

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowserClient();
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
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    if (!businessId) return;
    setSaving(true);
    setMessage("");
    const supabase = createSupabaseBrowserClient();
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

  if (loading) return <div className="space-y-8"><p className="text-neutral-500">Loading settings...</p></div>;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#D4A853]">Configuration</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Settings</h1>
      </div>

      <div className="max-w-2xl space-y-6">
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
      </div>
    </div>
  );
}
