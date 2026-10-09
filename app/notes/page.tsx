import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";

export default function NotesPage() {
  const notes = [
    { title: "Newton's Laws of Motion", subject: "Physics", date: "2 hours ago", icon: "⚛️" },
    { title: "Chemical Equilibrium Basics", subject: "Chemistry", date: "Yesterday", icon: "🧪" },
    { title: "Limits and Continuity", subject: "Mathematics", date: "2 days ago", icon: "📐" },
    { title: "Binary Search Trees", subject: "Computer Science", date: "3 days ago", icon: "💻" },
  ];

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Notes
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Create, organize, and review your study notes.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(99,102,241,0.28)] transition-opacity hover:opacity-90"
          >
            + New Note
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {notes.map((note) => (
            <Card
              key={note.title}
              as="article"
              className="flex items-start gap-4 transition-transform duration-200 hover:-translate-y-0.5"
            >
              <span className="text-2xl" aria-hidden="true">
                {note.icon}
              </span>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">{note.title}</h3>
                <p className="mt-1 text-sm text-zinc-400">{note.subject}</p>
                <p className="mt-2 text-xs text-zinc-500">{note.date}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
