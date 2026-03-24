import {
  DashboardHeader,
  DashboardMainSkeleton,
  DashboardRemindersSkeleton,
} from "@/components/dashboard/DashboardSkeleton";

export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-[#0A0A0F] px-6 py-10 md:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <DashboardHeader />
        <DashboardMainSkeleton />
        <DashboardRemindersSkeleton />
      </div>
    </main>
  );
}
