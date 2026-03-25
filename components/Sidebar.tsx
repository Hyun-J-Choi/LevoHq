"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem { href: string; label: string; icon: string }
interface NavGroup { title: string; items: NavItem[] }

const navGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "grid" },
      { href: "/appointments", label: "Appointments", icon: "calendar" },
      { href: "/clients", label: "Clients", icon: "users" },
    ],
  },
  {
    title: "Messaging",
    items: [
      { href: "/conversations", label: "Conversations", icon: "chat" },
      { href: "/missed-call", label: "Missed Calls", icon: "phone" },
    ],
  },
  {
    title: "Retention",
    items: [
      { href: "/cancellations", label: "Recovery", icon: "refresh" },
      { href: "/follow-up", label: "Follow-Up", icon: "heart" },
      { href: "/reactivation", label: "Reactivation", icon: "sparkle" },
    ],
  },
  {
    title: "Growth",
    items: [
      { href: "/waitlist", label: "Waitlist", icon: "list" },
      { href: "/memberships", label: "Memberships", icon: "card" },
      { href: "/referrals", label: "Referrals", icon: "gift" },
    ],
  },
  {
    title: "Insights",
    items: [
      { href: "/analytics", label: "Analytics", icon: "chart" },
    ],
  },
];

const icons: Record<string, string> = {
  grid: "M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z",
  calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  users: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z",
  chat: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  refresh: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  heart: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  sparkle: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
  phone: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
  list: "M4 6h16M4 10h16M4 14h16M4 18h16",
  card: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  gift: "M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7",
  chart: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  gear: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
};

function NavIcon({ name }: { name: string }) {
  const d = icons[name];
  if (!d) return null;
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

export default function Sidebar({ businessName }: { businessName?: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-white/[0.06] bg-[#08080C]">
      <div className="flex h-14 items-center border-b border-white/[0.06] px-5">
        <span className="text-[15px] font-semibold tracking-tight text-white">LevoHQ</span>
      </div>

      {businessName && (
        <div className="border-b border-white/[0.06] px-5 py-3">
          <p className="truncate text-xs font-medium text-[#D4A853]">{businessName}</p>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-1">
            <p className="px-3 pt-4 pb-1.5 text-[10px] uppercase tracking-[0.2em] text-neutral-600">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition ${
                        active
                          ? "bg-[#D4A853]/10 text-[#D4A853]"
                          : "text-neutral-400 hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      <NavIcon name={item.icon} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {/* Settings pinned at bottom */}
        <div className="mt-auto border-t border-white/[0.04] pt-2 mt-4">
          <Link
            href="/settings"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition ${
              pathname === "/settings"
                ? "bg-[#D4A853]/10 text-[#D4A853]"
                : "text-neutral-400 hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            <NavIcon name="gear" />
            Settings
          </Link>
        </div>
      </nav>
    </aside>
  );
}
