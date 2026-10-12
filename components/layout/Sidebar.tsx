import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { mainNav, settingsNav } from "@/lib/dashboard-data";
import { useAuth } from "@/lib/hooks/useAuth";

type SidebarProps = {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate?: () => void;
};

function NavLink({
  href,
  icon,
  label,
  collapsed,
  active = false,
  onNavigate,
}: {
  href: string;
  icon: string;
  label: string;
  collapsed: boolean;
  active?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={collapsed ? label : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
        collapsed ? "justify-center" : ""
      } ${
        active
          ? "bg-accent-soft text-ink shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
          : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
      }`}
    >
      <span className="text-base leading-none" aria-hidden="true">
        {icon}
      </span>
      <span className={collapsed ? "sr-only" : "truncate"}>{label}</span>
    </Link>
  );
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const metadataName = [user?.user_metadata?.full_name, user?.user_metadata?.name, user?.user_metadata?.first_name, user?.user_metadata?.given_name]
    .find((value) => typeof value === "string" && value.trim());
  const displayName = typeof metadataName === "string" ? metadataName.trim() : user?.email?.split("@")[0] || "Student";

  return (
    <div className="flex h-full flex-col">
      <div
        className={`flex items-center gap-3 px-4 pt-5 pb-4 ${
          collapsed ? "justify-center" : ""
        }`}
      >
        <Image
          src="/icon.png"
          alt=""
          width={40}
          height={40}
          priority
          className="h-10 w-10 shrink-0 rounded-xl bg-white object-cover shadow-[0_0_20px_rgba(99,102,241,0.18)]"
        />
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-base font-semibold tracking-tight text-white">
              STUDYFORGE
            </p>
            <p className="truncate text-xs text-zinc-500">Your intelligent study space</p>
          </div>
        ) : (
          <span className="sr-only">STUDYFORGE</span>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2" aria-label="Main">
        {mainNav.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            collapsed={collapsed}
            active={pathname === item.href}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="mt-auto space-y-2 border-t border-white/8 px-3 py-4">
        <NavLink
          href={settingsNav.href}
          icon={settingsNav.icon}
          label={settingsNav.label}
          collapsed={collapsed}
          active={pathname === settingsNav.href}
          onNavigate={onNavigate}
        />

        {user ? (
          <>
            <div
              className={`flex items-center gap-3 rounded-xl px-2 py-2 ${
                collapsed ? "justify-center" : ""
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/30 to-violet-500/30 text-xs font-semibold text-zinc-100 ring-1 ring-white/10">
                {displayName.charAt(0).toUpperCase()}
              </div>
              {!collapsed ? (
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-100">
                    {displayName}
                  </p>
                  <p className="truncate text-xs text-zinc-500">Student</p>
                </div>
              ) : (
                <span className="sr-only">
                  {displayName}, Student
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={async () => {
                await signOut();
                router.push('/auth/signin');
                router.refresh();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100"
            >
              <span className="text-base" aria-hidden="true">🚪</span>
              <span className={collapsed ? "sr-only" : "truncate"}>Sign Out</span>
            </button>
          </>
        ) : (
          <Link
            href="/auth/signin"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100"
          >
            <span className="text-base" aria-hidden="true">🔐</span>
            <span className={collapsed ? "sr-only" : "truncate"}>Sign In</span>
          </Link>
        )}

        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden w-full items-center justify-center rounded-lg py-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300 md:flex"
        >
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>
    </div>
  );
}
