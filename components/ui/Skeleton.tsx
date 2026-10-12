import { cn } from "@/lib/utils/cn";

/**
 * Loading placeholder. Marked `aria-hidden` and wrapped in nothing that
 * announces it, because the surrounding region carries the live status text.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-lg bg-white/6", className)}
    />
  );
}

/** A card-shaped skeleton for list and grid loading states. */
export function SkeletonCard({ lines = 2 }: { lines?: number }) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-card">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="mt-5 space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            className={index === lines - 1 ? "h-3 w-2/3" : "h-3 w-full"}
          />
        ))}
      </div>
    </div>
  );
}
