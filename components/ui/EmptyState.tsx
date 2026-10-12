import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * The honest "there is nothing here yet" state. Every page that has no data
 * uses this instead of inventing placeholder content.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-hairline-strong bg-surface/50 px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? (
        <div
          aria-hidden="true"
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-raised text-xl"
        >
          {icon}
        </div>
      ) : null}
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-ink-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
