import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";

export default function FocusPage() {
  const sessions = [
    { date: "Today", duration: "2h 35m", subject: "Physics", icon: "⚛️" },
    { date: "Yesterday", duration: "1h 45m", subject: "Chemistry", icon: "🧪" },
    { date: "2 days ago", duration: "3h 10m", subject: "Mathematics", icon: "📐" },
    { date: "3 days ago", duration: "2h 20m", subject: "Computer Science", icon: "💻" },
  ];

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Focus Sessions
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage your focus sessions and track your deep work time.
          </p>
        </div>

        <Card className="relative overflow-hidden bg-gradient-to-br from-[#151528] to-[#121217]">
          <div
            className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-violet-500/15 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative">
            <h2 className="text-lg font-semibold text-white">Today&apos;s Focus</h2>
            <p className="mt-1 text-sm text-zinc-400">2h 35m total focus time</p>
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
                <span>Daily Goal</span>
                <span className="font-medium text-zinc-300">3h 0m</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                  style={{ width: "85%" }}
                />
              </div>
            </div>
          </div>
        </Card>

        <div>
          <h2 className="text-lg font-semibold text-white">Recent Sessions</h2>
          <div className="mt-4 space-y-3">
            {sessions.map((session) => (
              <Card
                key={session.date}
                as="article"
                className="flex items-center gap-4 transition-transform duration-200 hover:-translate-y-0.5"
              >
                <span className="text-2xl" aria-hidden="true">
                  {session.icon}
                </span>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-white">{session.subject}</h3>
                  <p className="text-sm text-zinc-400">{session.date}</p>
                </div>
                <p className="text-lg font-semibold text-white">{session.duration}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
