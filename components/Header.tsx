"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Header({ userName }: { userName?: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-14 items-center justify-end border-b border-white/[0.06] bg-[#0A0A0F] px-6">
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-neutral-300 transition hover:bg-white/[0.04] hover:text-white"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#D4A853]/20 text-xs font-semibold text-[#D4A853]">
            {(userName ?? "U")[0].toUpperCase()}
          </span>
          <span className="hidden sm:inline">{userName ?? "Account"}</span>
        </button>

        {open && (
          <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border border-white/[0.1] bg-[#111118] py-1 shadow-xl">
            <button
              onClick={handleLogout}
              className="block w-full px-4 py-2 text-left text-sm text-neutral-300 transition hover:bg-white/[0.06] hover:text-white"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
