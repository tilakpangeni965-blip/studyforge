import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/Button";

export default function FlashcardsPage() {
  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Flashcards</h1>
          <p className="mt-1 text-sm text-zinc-400">Review your own study cards.</p>
        </div>
        <Card>
          <div className="py-8 text-center">
            <h2 className="font-medium text-white">Flashcards are not connected yet</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-zinc-400">
              There is no flashcard database in this project, so no sample decks or card counts are shown. Use your notes or ask the AI Tutor while this feature is being connected.
            </p>
            <Link href="/tutor" className={`${buttonVariants()} mt-4`}>Ask the AI Tutor</Link>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
