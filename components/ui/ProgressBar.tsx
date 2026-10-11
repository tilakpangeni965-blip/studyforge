import { cn } from "@/lib/utils/cn";

type ProgressBarProps = {
  value: number;
  /** Accessible name for the bar, e.g. "Physics progress". */
  label: string;
  size?: "sm" | "md";
  tone?: "accent" | "success" | "warning" | "danger";
  className?: string;
};

const SIZE_CLASSES = {
  sm: "h-1.5",
  md: "h-2",
} as const;

const TONE_CLASSES = {
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
} as const;

export function ProgressBar({
  value,
  label,
  size = "sm",
  tone = "accent",
  className,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-full bg-white/8",
        SIZE_CLASSES[size],
        className,
      )}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-out",
          TONE_CLASSES[tone],
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
