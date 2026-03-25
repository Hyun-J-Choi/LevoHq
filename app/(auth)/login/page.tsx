"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSuccess("Check your email for a password reset link.");
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          LevoHQ
        </h1>
        <p className="mt-2 text-sm text-neutral-400">
          Sign in to your account
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {success}
        </div>
      )}

      {showReset ? (
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-medium uppercase tracking-wide text-neutral-400">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="mt-1.5 block w-full rounded-lg border border-white/[0.1] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none transition focus:border-[#D4A853]/50 focus:ring-1 focus:ring-[#D4A853]/30"
              placeholder="you@clinic.com" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-[#D4A853] py-3 text-sm font-semibold text-[#0A0A0A] transition hover:brightness-110 disabled:opacity-50">
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
          <button type="button" onClick={() => { setShowReset(false); setError(""); setSuccess(""); }}
            className="w-full text-sm text-neutral-400 hover:text-white transition">
            Back to sign in
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-medium uppercase tracking-wide text-neutral-400">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="mt-1.5 block w-full rounded-lg border border-white/[0.1] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none transition focus:border-[#D4A853]/50 focus:ring-1 focus:ring-[#D4A853]/30"
              placeholder="you@clinic.com" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-xs font-medium uppercase tracking-wide text-neutral-400">Password</label>
              <button type="button" onClick={() => { setShowReset(true); setError(""); setSuccess(""); }}
                className="text-xs text-[#D4A853] hover:text-[#e0bc6a] transition">
                Forgot password?
              </button>
            </div>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="mt-1.5 block w-full rounded-lg border border-white/[0.1] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none transition focus:border-[#D4A853]/50 focus:ring-1 focus:ring-[#D4A853]/30"
              placeholder="Your password" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-[#D4A853] py-3 text-sm font-semibold text-[#0A0A0A] transition hover:brightness-110 disabled:opacity-50">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      )}

      <p className="text-center text-sm text-neutral-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-[#D4A853] transition hover:text-[#e0bc6a]"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
