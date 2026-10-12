import { AppShell } from "@/components/layout/AppShell";
import { PracticeClient } from "@/app/practice/PracticeClient";
import { getPracticeDashboard } from "@/app/practice/actions";

export default async function PracticePage() {
  const initial = await getPracticeDashboard();
  return (
    <AppShell>
      <PracticeClient initial={initial} />
    </AppShell>
  );
}
