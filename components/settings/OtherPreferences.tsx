"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

type ThemeChoice = "dark" | "light";
type Preferences = { theme: ThemeChoice; notifications: boolean; reminderEnabled: boolean; reminderTime: string };

const DEFAULT_PREFERENCES: Preferences = {
  theme: "dark",
  notifications: false,
  reminderEnabled: false,
  reminderTime: "18:00",
};

function getLocalDateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function OtherPreferences({ user }: { user: User | null }) {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [loaded, setLoaded] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [notificationError, setNotificationError] = useState<string | null>(null);

  const storageKey = useMemo(() => user ? `studyforge:preferences:${user.id}` : null, [user]);

  useEffect(() => {
    if (!storageKey) return;
    const loadTimer = window.setTimeout(() => {
      let saved: Partial<Preferences> = {};
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (raw) saved = JSON.parse(raw) as Partial<Preferences>;
      } catch {
        // Ignore invalid or unavailable local settings and use the defaults.
      }
      const next: Preferences = {
        ...DEFAULT_PREFERENCES,
        ...saved,
        theme: saved.theme === "light" ? "light" : "dark",
        notifications: saved.notifications === true,
        reminderEnabled: saved.reminderEnabled === true,
        reminderTime: typeof saved.reminderTime === "string" && /^\d{2}:\d{2}$/.test(saved.reminderTime) ? saved.reminderTime : DEFAULT_PREFERENCES.reminderTime,
      };
      setPreferences(next);
      setLoaded(true);
      if ("Notification" in window) setNotificationPermission(Notification.permission);
    }, 0);
    return () => window.clearTimeout(loadTimer);
  }, [storageKey]);

  useEffect(() => {
    if (!loaded) return;
    document.documentElement.dataset.theme = preferences.theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      "content",
      preferences.theme === "light" ? "#f4f6fb" : "#0b0b0f",
    );
    if (storageKey) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(preferences));
      } catch {
        // Keep the current page usable when browser storage is disabled.
      }
    }
  }, [loaded, preferences, storageKey]);

  useEffect(() => {
    if (!loaded || !user || !preferences.notifications || !preferences.reminderEnabled || notificationPermission !== "granted") return;
    const reminderKey = `studyforge:last-reminder:${user.id}`;
    const checkReminder = () => {
      const now = new Date();
      const today = getLocalDateKey(now);
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      if (time !== preferences.reminderTime || window.localStorage.getItem(reminderKey) === today) return;
      new Notification("StudyForge study reminder", {
        body: "Your study reminder is here. Open StudyForge when you’re ready to focus.",
        icon: "/icon.png",
        tag: "studyforge-daily-reminder",
      });
      window.localStorage.setItem(reminderKey, today);
    };
    checkReminder();
    const timer = window.setInterval(checkReminder, 30_000);
    return () => window.clearInterval(timer);
  }, [loaded, notificationPermission, preferences.notifications, preferences.reminderEnabled, preferences.reminderTime, user]);

  function updatePreference<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    setPreferences((current) => ({ ...current, [key]: value }));
  }

  async function enableNotifications() {
    setNotificationMessage(null);
    setNotificationError(null);
    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");
      setNotificationError("This browser does not support notifications.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === "granted") {
        updatePreference("notifications", true);
        setNotificationMessage("Browser notifications are enabled for your reminders.");
      } else {
        updatePreference("notifications", false);
        setNotificationError(permission === "denied" ? "Notifications are blocked in browser settings." : "Notification permission was not granted.");
      }
    } catch {
      setNotificationError("Could not request notification permission in this browser.");
    }
  }

  async function exportAccountData() {
    if (!user) {
      setExportError("Sign in to export your account data.");
      return;
    }
    setExporting(true);
    setExportMessage(null);
    setExportError(null);
    const supabase = createClient();
    try {
      const [subjects, notes, conversations, messages] = await Promise.all([
        supabase.from("subjects").select("*").eq("user_id", user.id),
        supabase.from("notes").select("*").eq("user_id", user.id),
        supabase.from("tutor_conversations").select("*").eq("user_id", user.id),
        supabase.from("tutor_messages").select("*").eq("user_id", user.id),
      ]);
      const datasets = { subjects, notes, tutorConversations: conversations, tutorMessages: messages };
      const unavailableSections = Object.entries(datasets)
        .filter(([, result]) => result.error)
        .map(([name]) => name);
      const exportData = {
        exportedAt: new Date().toISOString(),
        account: { id: user.id, email: user.email ?? null, name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null },
        dataScope: "Only rows available to this signed-in account under Supabase row-level security are included. Passwords and access tokens are never exported.",
        subjects: subjects.data ?? [],
        notes: notes.data ?? [],
        tutorConversations: conversations.data ?? [],
        tutorMessages: messages.data ?? [],
        unavailableSections,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = `studyforge-data-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      setExportMessage(unavailableSections.length
        ? "Your export was downloaded, but some study data was unavailable."
        : "Your account data export has been downloaded.");
    } catch {
      setExportError("Could not export account data. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-white">Other preferences</h2>
      <p className="mt-1 text-sm text-zinc-400">These preferences are saved in this browser for your signed-in account.</p>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="theme-heading" className="space-y-3">
          <h3 id="theme-heading" className="text-sm font-semibold text-zinc-200">Theme</h3>
          <div className="flex gap-3">
            <Button type="button" variant={preferences.theme === "dark" ? "primary" : "secondary"} aria-pressed={preferences.theme === "dark"} onClick={() => updatePreference("theme", "dark")}>Dark</Button>
            <Button type="button" variant={preferences.theme === "light" ? "primary" : "secondary"} aria-pressed={preferences.theme === "light"} onClick={() => updatePreference("theme", "light")}>Light</Button>
          </div>
          <p className="text-xs leading-5 text-zinc-500">Applies throughout StudyForge on this browser.</p>
        </section>

        <section aria-labelledby="notifications-heading" className="space-y-3">
          <h3 id="notifications-heading" className="text-sm font-semibold text-zinc-200">Notifications and reminders</h3>
          <p className="text-sm leading-5 text-zinc-400">A daily browser notification can remind you to study. It runs while StudyForge is open.</p>
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Daily reminder time" htmlFor="study-reminder-time">
              <Input id="study-reminder-time" type="time" value={preferences.reminderTime} onChange={(event) => updatePreference("reminderTime", event.target.value)} />
            </Field>
            {preferences.notifications && notificationPermission === "granted" ? (
              <Button type="button" variant="secondary" aria-pressed={preferences.reminderEnabled} onClick={() => updatePreference("reminderEnabled", !preferences.reminderEnabled)}>
                {preferences.reminderEnabled ? "Pause reminder" : "Enable reminder"}
              </Button>
            ) : (
              <Button type="button" variant="secondary" onClick={() => void enableNotifications()}>
                Allow browser notifications
              </Button>
            )}
          </div>
          <p className="text-xs leading-5 text-zinc-500">
            {notificationPermission === "denied" ? "Allow notifications in your browser’s site settings to turn reminders on." : preferences.reminderEnabled ? "Daily reminder is on." : "Reminders are off."}
          </p>
          {(notificationMessage || notificationError) && <p role={notificationError ? "alert" : "status"} className={`text-sm ${notificationError ? "text-red-400" : "text-emerald-400"}`}>{notificationError ?? notificationMessage}</p>}
        </section>
      </div>

      <section aria-labelledby="export-heading" className="mt-6 border-t border-white/8 pt-5">
        <h3 id="export-heading" className="text-sm font-semibold text-zinc-200">Account export</h3>
        <p className="mt-1 max-w-2xl text-sm leading-5 text-zinc-400">Download your account details, subjects, notes, and AI tutor history as a JSON file. The export is created in this browser and is not sent to another service.</p>
        <Button type="button" className="mt-4" variant="secondary" loading={exporting} onClick={() => void exportAccountData()}>
          Download my data
        </Button>
        {(exportMessage || exportError) && <p role={exportError ? "alert" : "status"} className={`mt-3 text-sm ${exportError ? "text-red-400" : "text-emerald-400"}`}>{exportError ?? exportMessage}</p>}
      </section>
    </Card>
  );
}
