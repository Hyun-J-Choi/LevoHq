import { Suspense } from "react";
import DashboardMainSection from "@/components/dashboard/DashboardMainSection";

export const dynamic = "force-dynamic";
import DashboardRemindersSection from "@/components/dashboard/DashboardRemindersSection";
import {
  DashboardHeader,
  DashboardMainSkeleton,
  DashboardRemindersSkeleton,
} from "@/components/dashboard/DashboardSkeleton";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0F] px-6 py-10 md:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <DashboardHeader />

        <Suspense fallback={<DashboardMainSkeleton />}>
          <DashboardMainSection />
        </Suspense>

        <Suspense fallback={<DashboardRemindersSkeleton />}>
          <DashboardRemindersSection />
        </Suspense>
      </div>
    </main>
  );
}
