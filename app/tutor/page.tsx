import { AppShell } from "@/components/layout/AppShell";
import { TutorThread } from "@/components/tutor/TutorThread";

export default function TutorPage() {
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

        <TutorThread />
      </div>
    </AppShell>
  );
}
