import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";

export default function FlashcardsPage() {
  const decks = [
    { name: "Physics Formulas", cards: 45, subject: "Physics", icon: "⚛️" },
    { name: "Chemistry Reactions", cards: 32, subject: "Chemistry", icon: "🧪" },
    { name: "Calculus Derivatives", cards: 56, subject: "Mathematics", icon: "📐" },
    { name: "Data Structures", cards: 28, subject: "Computer Science", icon: "💻" },
  ];

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Flashcards
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Study with interactive flashcards to reinforce your learning.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(99,102,241,0.28)] transition-opacity hover:opacity-90"
          >
            + Create Deck
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {decks.map((deck) => (
            <Card
              key={deck.name}
              as="article"
              className="flex flex-col transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="text-2xl" aria-hidden="true">
                  {deck.icon}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-white">{deck.name}</h3>
                  <p className="text-sm text-zinc-400">{deck.subject}</p>
                </div>
              </div>
              <div className="mt-auto">
                <p className="text-sm text-zinc-400">{deck.cards} cards</p>
              </div>
              <button
                type="button"
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-white/8 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/10"
              >
                Study Now
              </button>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
