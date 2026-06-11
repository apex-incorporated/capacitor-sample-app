/**
 * Tiny `cn` utility — concatenates class names, drops falsy values.
 * No dependency on `clsx` or `tailwind-merge`; keeps the design
 * system primitives dependency-free at runtime.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
