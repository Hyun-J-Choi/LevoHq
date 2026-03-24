import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ComposeBox from "@/components/conversations/ComposeBox";

export default async function ConversationThread({ params }: { params: { phone: string } }) {
  const supabase = createSupabaseServerClient();
  const businessId = await getCurrentBusinessId(supabase);
  if (!businessId) redirect("/login");

  const phone = decodeURIComponent(params.phone);

  const { data: messages } = await supabase
    .from("conversations")
    .select("id, direction, message, sent_at, from_phone, to_phone")
    .eq("business_id", businessId)
    .or(`from_phone.eq.${phone},to_phone.eq.${phone}`)
    .order("sent_at", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/conversations" className="rounded-lg border border-white/[0.1] px-3 py-1.5 text-xs text-neutral-400 hover:text-white">
          ← Back
        </Link>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#D4A853]">Conversation</p>
          <h1 className="text-2xl font-semibold tracking-tight text-white">{phone}</h1>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-3 max-h-[60vh] overflow-y-auto">
        {(!messages || messages.length === 0) && (
          <p className="text-sm text-neutral-500">No messages in this thread.</p>
        )}
        {messages?.map((m) => (
          <div key={m.id} className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-xl px-4 py-2.5 ${
              m.direction === "outbound"
                ? "bg-[#D4A853]/15 border border-[#D4A853]/20 text-white"
                : "bg-white/[0.05] border border-white/[0.08] text-neutral-300"
            }`}>
              <p className="text-sm">{m.message}</p>
              <p className="mt-1 text-[11px] text-neutral-600">
                {new Date(m.sent_at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}
      </div>

      <ComposeBox phone={phone} />
    </div>
  );
}
