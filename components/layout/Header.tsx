"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { usePathname } from "next/navigation";

type HeaderProps = {
  onOpenMenu: () => void;
};

export function Header({ onOpenMenu }: HeaderProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const getPageTitle = () => {
    switch (pathname) {
      case "/":
        return {
          title: user ? `Good evening, ${user.user_metadata.full_name?.split(' ')[0] || 'Student'} 👋` : "Good evening 👋",
          subtitle: "Ready to make progress today?",
        };
      case "/subjects":
        return {
          title: "Subjects",
          subtitle: "Manage your courses",
        };
      case "/notes":
        return {
          title: "Notes",
          subtitle: "Your study materials",
        };
      case "/flashcards":
        return {
          title: "Flashcards",
          subtitle: "Study with cards",
        };
      case "/practice":
        return {
          title: "Practice",
          subtitle: "Test your knowledge",
        };
      case "/focus":
        return {
          title: "Focus",
          subtitle: "Deep work sessions",
        };
      case "/analytics":
        return {
          title: "Analytics",
          subtitle: "Track your progress",
        };
      case "/ai-tutor":
        return {
          title: "AI Tutor",
          subtitle: "Your study companion",
        };
      case "/settings":
        return {
          title: "Settings",
          subtitle: "Customize your experience",
        };
      default:
        return {
          title: "StudyForge",
          subtitle: "Your study workspace",
        };
    }
  };

  const { title, subtitle } = getPageTitle();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-white/8 bg-[#0b0b0f]/80 px-4 py-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-white/4 text-zinc-200 transition-colors hover:bg-white/8 md:hidden"
          aria-label="Open navigation"
        >
          <span aria-hidden="true">☰</span>
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {title}
          </h1>
          <p className="mt-0.5 truncate text-sm text-zinc-400">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-white/4 text-zinc-200 transition-colors hover:bg-white/8"
          aria-label="Notifications"
        >
          <span aria-hidden="true">🔔</span>
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-violet-400" />
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-white/8 bg-white/4 py-1.5 pr-3 pl-1.5 transition-colors hover:bg-white/8"
          aria-label="Open profile"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/40 to-violet-500/40 text-[11px] font-semibold text-white">
            {user ? user.user_metadata.full_name?.charAt(0).toUpperCase() || 'U' : 'G'}
          </span>
          <span className="hidden text-sm font-medium text-zinc-200 sm:inline">
            {user ? user.user_metadata.full_name?.split(' ')[0] || 'User' : 'Guest'}
          </span>
        </button>
      </div>
    </header>
  );
}
