import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/auth";
import { redirect } from "next/navigation";
import ClientsPageClient from "./ClientsPageClient";

export default async function ClientsPage() {
  const supabase = createSupabaseServerClient();
  let businessId: string;
  try {
    businessId = await getCurrentBusinessId(supabase);
  } catch {
    redirect("/login");
  }

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, phone, email, status, last_visit, lifetime_value")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(100);

  return <ClientsPageClient clients={clients ?? []} businessId={businessId} />;
}
