import type { ElementType, ReactNode } from "react";

type CardProps = {
  as?: "article" | "section" | "div";
  className?: string;
  children: ReactNode;
  "aria-labelledby"?: string;
};

export function Card({
  as,
  className = "",
  children,
  "aria-labelledby": ariaLabelledBy,
}: CardProps) {
  const Tag = (as ?? "section") as ElementType;

  return (
    <Tag
      aria-labelledby={ariaLabelledBy}
      className={`rounded-2xl border border-white/8 bg-[#121217]/90 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.25)] ${className}`}
    >
      {children}
    </Tag>
  );
}
