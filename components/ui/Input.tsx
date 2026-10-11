import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils/cn";

/** Shared control chrome so every input, textarea and select lines up exactly. */
export const controlClasses = cn(
  "w-full rounded-xl border border-hairline bg-surface-raised px-3.5 py-2.5 text-sm text-ink",
  "placeholder:text-ink-subtle transition-colors duration-150",
  "hover:border-hairline-strong focus:border-accent disabled:cursor-not-allowed disabled:opacity-60",
);

export function Input({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={cn(controlClasses, className)} />;
}

export function Textarea({
  className,
  rows = 6,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...rest}
      rows={rows}
      className={cn(controlClasses, "resize-y leading-relaxed", className)}
    />
  );
}

export function Select({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...rest}
      className={cn(controlClasses, "appearance-none pr-9", className)}
    >
      {children}
    </select>
  );
}

/**
 * Label + control + hint/error wrapper. Wires `htmlFor`, `aria-describedby`
 * and `aria-invalid` so the error is announced rather than just coloured.
 */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-ink"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-xs text-ink-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
