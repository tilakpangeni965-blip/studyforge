import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Heading block for a page section. `id` is applied to the h2 so the wrapping
 * section can point `aria-labelledby` at it.
 */
export function SectionHeader({
  id,
  title,
  description,
  action,
  className,
}: {
  id?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-3",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 id={id} className="text-base font-semibold tracking-tight text-ink">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-ink-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
