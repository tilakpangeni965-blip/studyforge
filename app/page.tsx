import { ContinueStudying } from "@/components/dashboard/ContinueStudying";
import { FocusCard } from "@/components/dashboard/FocusCard";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { TaskList } from "@/components/dashboard/TaskList";
import { WeeklyProgress } from "@/components/dashboard/WeeklyProgress";
import { AppShell } from "@/components/layout/AppShell";

export default function Home() {
  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-8">
        <StatsGrid />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <WeeklyProgress />
          </div>
          <FocusCard />
        </div>

        <ContinueStudying />
        <TaskList />
      </div>
    </AppShell>
  );
}
