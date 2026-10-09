import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";

export default function TutorPage() {
  const suggestions = [
    { title: "Explain Newton's Third Law", subject: "Physics", icon: "⚛️" },
    { title: "Help with equilibrium problems", subject: "Chemistry", icon: "🧪" },
    { title: "Practice limits step by step", subject: "Mathematics", icon: "📐" },
    { title: "Explain binary search trees", subject: "Computer Science", icon: "💻" },
  ];

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            AI Tutor
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Get personalized help and explanations from your AI study companion.
          </p>
        </div>

        <Card className="relative overflow-hidden bg-gradient-to-br from-[#151528] to-[#121217]">
          <div
            className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-blue-500/15 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative">
            <h2 className="text-lg font-semibold text-white">Ask anything</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Get instant explanations, step-by-step solutions, and personalized study guidance.
            </p>
            <div className="mt-6">
              <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 px-4 py-3">
                <span className="text-2xl" aria-hidden="true">🤖</span>
                <input
                  type="text"
                  placeholder="Type your question here..."
                  className="flex-1 bg-transparent text-white placeholder:text-zinc-500 focus:outline-none"
                  disabled
                />
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  disabled
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </Card>

        <div>
          <h2 className="text-lg font-semibold text-white">Suggested Questions</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {suggestions.map((suggestion) => (
              <Card
                key={suggestion.title}
                as="article"
                className="flex items-center gap-3 transition-transform duration-200 hover:-translate-y-0.5 cursor-pointer"
              >
                <span className="text-xl" aria-hidden="true">
                  {suggestion.icon}
                </span>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-white">{suggestion.title}</h3>
                  <p className="text-xs text-zinc-500">{suggestion.subject}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
