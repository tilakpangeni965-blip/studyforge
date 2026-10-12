import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "@/components/ui/Spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-contrast hover:bg-accent-hover active:bg-accent",
  secondary:
    "border border-hairline-strong bg-surface-raised text-ink hover:bg-surface-hover",
  ghost: "text-ink-muted hover:bg-surface-hover hover:text-ink",
  danger:
    "border border-danger/30 bg-danger-soft text-danger hover:border-danger/60",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 px-3 text-xs",
  md: "h-10 gap-2 px-4 text-sm",
  lg: "h-11 gap-2 px-5 text-sm",
  icon: "h-10 w-10 justify-center",
};

/**
 * Shared button styling, exported so next/link anchors can look identical to
 * buttons without a wrapper component or an `asChild` implementation.
 *
 *   <Link href="/notes" className={buttonVariants({ variant: "primary" })}>
 */
export function buttonVariants(
  options: { variant?: ButtonVariant; size?: ButtonSize } = {},
): string {
  const { variant = "primary", size = "md" } = options;

  return cn(
    "inline-flex shrink-0 items-center justify-center rounded-xl font-medium whitespace-nowrap transition-colors",
    "duration-150 disabled:pointer-events-none disabled:opacity-50",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Replaces the label while loading. Falls back to the existing children. */
  loadingLabel?: string;
  leftIcon?: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  loadingLabel,
  leftIcon,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size }), className)}
    >
      {loading ? (
        <Spinner className="h-4 w-4" label={null} />
      ) : (
        leftIcon
      )}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
}
