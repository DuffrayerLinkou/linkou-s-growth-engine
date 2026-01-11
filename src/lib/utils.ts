import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isValid } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeFormatDate(
  value: string | null | undefined,
  pattern: string = "dd/MM/yyyy",
  fallback: string = "Sem data"
): string {
  if (!value) return fallback;
  const date = new Date(value);
  return isValid(date) ? format(date, pattern) : fallback;
}
