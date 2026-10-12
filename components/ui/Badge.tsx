import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type BadgeVariant = "neutral" | "accent" | "success" | "warning" | "danger";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: "border-hairline-strong bg-surface-hover text-ink-muted",
  accent: "border-accent/30 bg-accent-soft text-accent-hover",
  success: "border-success/30 bg-success-soft text-success",
  warning: "border-warning/30 bg-warning-soft text-warning",
  danger: "border-danger/30 bg-danger-soft text-danger",
};

export function Badge({
  children,
  variant = "neutral",
  className,
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
