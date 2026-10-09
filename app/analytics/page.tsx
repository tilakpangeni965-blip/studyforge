import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";

export default function AnalyticsPage() {
  const stats = [
    { label: "Total Study Time", value: "48h 30m", change: "+12%", icon: "⏱" },
    { label: "Questions Solved", value: "342", change: "+24%", icon: "🧠" },
    { label: "Focus Sessions", value: "28", change: "+8%", icon: "🎯" },
    { label: "Streak", value: "7 days", change: "Keep going!", icon: "🔥" },
  ];

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            View detailed statistics and insights about your study habits.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card
              key={stat.label}
              as="article"
              className="transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-zinc-400">{stat.label}</p>
                <span className="text-base" aria-hidden="true">
                  {stat.icon}
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-zinc-500">{stat.change}</p>
            </Card>
          ))}
        </div>

        <Card>
          <h2 className="text-lg font-semibold text-white">Weekly Overview</h2>
          <p className="mt-1 text-sm text-zinc-400">Your study activity this week</p>
          <div className="mt-6 flex items-end gap-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
              const heights = [60, 80, 45, 90, 70, 30, 50];
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-blue-500 to-violet-500 transition-all hover:opacity-80"
                    style={{ height: `${heights[i]}%` }}
                  />
                  <span className="text-xs text-zinc-500">{day}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
