import { Suspense } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardMainSection from "@/components/dashboard/DashboardMainSection";
import DashboardRemindersSection from "@/components/dashboard/DashboardRemindersSection";
import {
  DashboardMainSkeleton,
  DashboardRemindersSkeleton,
} from "@/components/dashboard/DashboardSkeleton";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  let businessId: string;
  try {
    businessId = await getCurrentBusinessId(supabase);
  } catch {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#D4A853]">
          LevoHQ Control Center
        </p>
        <h1 className="font-premium-serif text-4xl text-[#F5F2E8]">
          Dashboard
        </h1>
      </div>

      <Suspense fallback={<DashboardMainSkeleton />}>
        <DashboardMainSection businessId={businessId} />
      </Suspense>

      <Suspense fallback={<DashboardRemindersSkeleton />}>
        <DashboardRemindersSection businessId={businessId} />
      </Suspense>
    </div>
  );
}
