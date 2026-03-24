import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ConversationsPage() {
  const supabase = createSupabaseServerClient();
  const businessId = await getCurrentBusinessId(supabase);
  if (!businessId) redirect("/login");

  const { data: messages } = await supabase
    .from("conversations")
    .select("id, direction, from_phone, to_phone, message, sent_at")
    .eq("business_id", businessId)
    .order("sent_at", { ascending: false })
    .limit(500);

  // Group by contact phone
  const contacts = new Map<string, { phone: string; lastMessage: string; lastAt: string; count: number }>();
  for (const m of messages ?? []) {
    const phone = m.direction === "inbound" ? m.from_phone : m.to_phone;
    if (!phone) continue;
    if (!contacts.has(phone)) {
      contacts.set(phone, { phone, lastMessage: m.message, lastAt: m.sent_at, count: 1 });
    } else {
      contacts.get(phone)!.count++;
    }
  }

  const sortedContacts = Array.from(contacts.values());

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#D4A853]">Messaging</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Conversations</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-2 max-h-[70vh] overflow-y-auto">
          {sortedContacts.length === 0 && (
            <p className="text-sm text-neutral-500 p-4">No conversations yet.</p>
          )}
          {sortedContacts.map((c) => (
            <Link key={c.phone} href={`/conversations/${encodeURIComponent(c.phone)}`}
              className="block rounded-lg border border-white/[0.04] bg-white/[0.01] p-3 hover:border-[#D4A853]/30 transition">
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium text-white">{c.phone}</p>
                <span className="text-[11px] text-neutral-600">{c.count} msgs</span>
              </div>
              <p className="mt-1 text-xs text-neutral-500 truncate">{c.lastMessage}</p>
              <p className="mt-1 text-[11px] text-neutral-600">{new Date(c.lastAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
            </Link>
          ))}
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-center min-h-[400px]">
          <p className="text-neutral-500 text-sm">Select a conversation to view messages</p>
        </div>
      </div>
    </div>
  );
}
