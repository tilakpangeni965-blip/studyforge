import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { weeklyProgress } from "@/lib/dashboard-data";

export function WeeklyProgress() {
  return (
    <Card aria-labelledby="weekly-progress-heading" className="relative overflow-hidden bg-gradient-to-br from-[#151528] to-[#121217]">
      <div
        className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-blue-500/15 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative">
        <h2
          id="weekly-progress-heading"
          className="text-lg font-semibold text-white"
        >
          Your progress
        </h2>
        <p className="mt-1 text-sm text-zinc-400">You&apos;re ahead of your weekly target.</p>

        <div className="mt-8">
          <p className="text-6xl font-semibold tracking-tight text-white">
            {weeklyProgress.percent}%
          </p>
        </div>

        <div className="mt-6">
          <ProgressBar
            value={weeklyProgress.percent}
            label="Weekly study progress"
          />
        </div>

        <p className="mt-4 text-sm text-zinc-400">
          {weeklyProgress.hoursDone}h of {weeklyProgress.hoursGoal}h this week ·{" "}
          {weeklyProgress.sessions} focus sessions completed.
        </p>
      </div>
    </Card>
  );
}
