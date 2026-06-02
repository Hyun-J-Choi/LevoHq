"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Create the user + business + owner link server-side. This route
      // runs with the service role and derives identity safely — it replaces
      // the old client-side signUp + anon `signup_create_business` RPC, which
      // trusted a client-supplied user id and was callable by anyone.
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, businessName, ownerName }),
      });

      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!res.ok) {
        setError(json.error ?? "Failed to create account");
        setLoading(false);
        return;
      }

      // 2. Sign the new user in (the server route created the account but the
      // browser has no session yet).
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        // Account + business exist, but login failed — send to login page.
        router.push("/login");
        return;
      }

      router.push("/onboarding");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Create your LevoHQ account
        </h1>
        <p className="mt-2 text-sm text-neutral-400">
          Set up your clinic in under 5 minutes
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="ownerName"
            className="block text-xs font-medium uppercase tracking-wide text-neutral-400"
          >
            Your name
          </label>
          <input
            id="ownerName"
            type="text"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            required
            className="mt-1.5 block w-full rounded-lg border border-white/[0.1] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none transition focus:border-[#D4A853]/50 focus:ring-1 focus:ring-[#D4A853]/30"
            placeholder="Dr. Sarah Chen"
          />
        </div>

        <div>
          <label
            htmlFor="businessName"
            className="block text-xs font-medium uppercase tracking-wide text-neutral-400"
          >
            Business name
          </label>
          <input
            id="businessName"
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
            className="mt-1.5 block w-full rounded-lg border border-white/[0.1] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none transition focus:border-[#D4A853]/50 focus:ring-1 focus:ring-[#D4A853]/30"
            placeholder="Glow Med Spa"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-xs font-medium uppercase tracking-wide text-neutral-400"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1.5 block w-full rounded-lg border border-white/[0.1] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none transition focus:border-[#D4A853]/50 focus:ring-1 focus:ring-[#D4A853]/30"
            placeholder="you@clinic.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-medium uppercase tracking-wide text-neutral-400"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="mt-1.5 block w-full rounded-lg border border-white/[0.1] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none transition focus:border-[#D4A853]/50 focus:ring-1 focus:ring-[#D4A853]/30"
            placeholder="Min. 8 characters"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#D4A853] py-3 text-sm font-semibold text-[#0A0A0A] transition hover:brightness-110 disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-[#D4A853] transition hover:text-[#e0bc6a]"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
