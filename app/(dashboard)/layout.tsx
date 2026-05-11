import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { countUnresolvedForBusiness } from "@/lib/needsReviewQueries";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServerClient();
  const ctx = await getAuthContext(supabase);

  if (!ctx) {
    redirect("/login");
  }

  // Fetch the review-queue count once per nav. Failures here must NOT break
  // the dashboard render — if the table is unavailable, show count 0.
  let reviewBadgeCount = 0;
  try {
    reviewBadgeCount = await countUnresolvedForBusiness(supabase, ctx.businessId);
  } catch (err) {
    console.error("[dashboard layout] review count failed:", err);
  }

  return (
    <div className="flex min-h-screen bg-[#0A0A0F]">
      <Sidebar
        businessName={ctx.business?.name ?? undefined}
        reviewBadgeCount={reviewBadgeCount}
      />
      <div className="flex flex-1 flex-col">
        <Header userName={ctx.business?.owner_name ?? ctx.user.email ?? undefined} />
        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
