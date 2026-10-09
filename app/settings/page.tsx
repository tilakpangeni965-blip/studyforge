import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";

export default function SettingsPage() {
  const settings = [
    { category: "Profile", items: ["Edit profile", "Change password", "Account settings"] },
    { category: "Preferences", items: ["Theme", "Language", "Notifications"] },
    { category: "Study", items: ["Daily goals", "Focus timer duration", "Reminder settings"] },
  ];

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Settings
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Customize your StudyForge experience and preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {settings.map((section) => (
            <Card key={section.category}>
              <h2 className="text-lg font-semibold text-white">{section.category}</h2>
              <ul className="mt-4 space-y-2">
                {section.items.map((item) => (
                  <li key={item}>
                    <button
                      type="button"
                      className="w-full text-left rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <Card>
          <h2 className="text-lg font-semibold text-white">Account</h2>
          <p className="mt-1 text-sm text-zinc-400">Manage your account and data</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl border border-white/8 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/10"
            >
              Export Data
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
            >
              Delete Account
            </button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
