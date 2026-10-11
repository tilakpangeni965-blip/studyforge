"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { AuthGuard } from "@/components/auth/AuthGuard";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1279px)");
    const syncCollapsed = () => setCollapsed(media.matches);

    syncCollapsed();
    media.addEventListener("change", syncCollapsed);

    return () => media.removeEventListener("change", syncCollapsed);
  }, []);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const desktopWidth = collapsed ? "md:w-[4.75rem]" : "md:w-64 xl:w-72";
  const contentOffset = collapsed ? "md:pl-[4.75rem]" : "md:pl-64 xl:pl-72";

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#0b0b0f] text-zinc-100">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-zinc-900 focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px] md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-white/8 bg-[#101014] transition-transform duration-300 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!mobileOpen}
      >
        <Sidebar
          collapsed={false}
          onToggleCollapse={() => undefined}
          onNavigate={() => setMobileOpen(false)}
        />
      </aside>

      <aside
        className={`hidden border-r border-white/8 bg-[#101014] md:fixed md:inset-y-0 md:left-0 md:z-30 md:block ${desktopWidth}`}
      >
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((value) => !value)}
        />
      </aside>

      <div className={`flex min-h-dvh min-w-0 flex-col ${contentOffset}`}>
        <Header onOpenMenu={() => setMobileOpen(true)} />
        <main id="main-content" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <AuthGuard>{children}</AuthGuard>
        </main>
      </div>
    </div>
  );
}
