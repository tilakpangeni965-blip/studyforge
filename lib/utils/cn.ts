export type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | ClassValue[]

/**
 * Joins class names, dropping falsy values. Deliberately dependency-free: this
 * project has no `clsx`/`tailwind-merge` and does not need one. Variant helpers
 * put caller-supplied `className` last, so a caller can override a utility that
 * appears earlier in the string.
 */
export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) {
      continue;
    }

    if (Array.isArray(input)) {
      const nested = cn(...input);
      if (nested) {
        classes.push(nested);
      }
      continue;
    }

    classes.push(String(input));
  }

  return classes.join(" ");
}
