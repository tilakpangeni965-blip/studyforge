import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

/**
 * A single metric. `value` is always real data or an explicit placeholder —
 * never a hardcoded figure dressed up as usage.
 */
export function Stat({
  label,
  value,
  hint,
  icon,
  loading = false,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  loading?: boolean;
  className?: string;
}) {
  return (
    <Card as="article" className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ink-muted">{label}</p>
        {icon ? (
          <span aria-hidden="true" className="text-base opacity-80">
            {icon}
          </span>
        ) : null}
      </div>
      <div>
        <p
          className="text-2xl font-semibold tracking-tight text-ink tabular-nums"
          aria-busy={loading || undefined}
        >
          {loading ? (
            <span className="inline-block h-7 w-16 animate-pulse rounded-md bg-white/6 align-middle" />
          ) : (
            value
          )}
        </p>
        {hint ? <p className="mt-1 text-xs text-ink-subtle">{hint}</p> : null}
      </div>
    </Card>
  );
}
