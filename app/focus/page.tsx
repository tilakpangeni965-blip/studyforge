import { FocusCard } from "@/components/dashboard/FocusCard";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";

export default function FocusPage() {
  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Focus sessions</h1>
          <p className="mt-1 text-sm text-zinc-400">Start a focus timer and study without distractions.</p>
        </div>

        <div className="max-w-xl">
          <FocusCard />
        </div>

        <Card>
          <h2 className="text-lg font-semibold text-white">Session history</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Focus sessions are not saved to your account yet, so there is no history or total time to show.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
