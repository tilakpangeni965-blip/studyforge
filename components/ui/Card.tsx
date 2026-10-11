import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type CardVariant = "surface" | "raised" | "quiet";

const VARIANT_CLASSES: Record<CardVariant, string> = {
  surface: "border-hairline bg-surface shadow-card",
  raised: "border-hairline-strong bg-surface-raised shadow-pop",
  quiet: "border-hairline bg-surface/60",
};

type CardProps = {
  /**
   * Rendered element. Defaults to `div`: a card is a generic container, and
   * defaulting to `section` used to create phantom landmarks on every page.
   * Pass `as="section"` or `as="article"` when the card really is one.
   */
  as?: ElementType;
  variant?: CardVariant;
  className?: string;
  children: ReactNode;
  "aria-labelledby"?: string;
  "aria-label"?: string;
};

export function Card({
  as,
  variant = "surface",
  className = "",
  children,
  "aria-labelledby": ariaLabelledBy,
  "aria-label": ariaLabel,
}: CardProps) {
  const Tag = (as ?? "div") as ElementType;

  return (
    <Tag
      aria-labelledby={ariaLabelledBy}
      aria-label={ariaLabel}
      className={cn(
        "rounded-2xl border p-5 transition-colors duration-150",
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {children}
    </Tag>
  );
}
