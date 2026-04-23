import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isValid } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parses a Postgres `date` column value (string `"YYYY-MM-DD"`) as a LOCAL date,
 * avoiding the timezone shift caused by `new Date("2024-04-25")` which interprets
 * the string as UTC midnight (in BRT/UTC-3 it would render as Apr 24).
 *
 * Use this for ALL fields whose DB type is `date` (no time component):
 *   - tasks.due_date
 *   - creative_demands.deadline
 *   - projects.start_date / end_date
 *   - campaigns.start_date / end_date
 *   - clients.phase_*_start / phase_*_end
 *   - client_goals.deadline
 *   - payments.due_date
 *
 * Do NOT use for `timestamp` / `timestamptz` columns (created_at, appointment_date,
 * etc.) — those already carry the correct instant.
 */
export function parseDateOnly(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;

  // Already includes a time component → safe to parse normally
  if (typeof value === "string" && value.includes("T")) {
    const d = new Date(value);
    return isValid(d) ? d : null;
  }

  // YYYY-MM-DD → build as LOCAL date (no UTC shift)
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const [, y, mo, d] = m;
    const date = new Date(Number(y), Number(mo) - 1, Number(d));
    return isValid(date) ? date : null;
  }

  // DD/MM/YYYY fallback
  const dmy = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (dmy) {
    const [, d, mo, y] = dmy;
    let yearNum = parseInt(y);
    if (yearNum < 100) yearNum += 2000;
    const date = new Date(yearNum, parseInt(mo) - 1, parseInt(d));
    return isValid(date) ? date : null;
  }

  const fallback = new Date(value);
  return isValid(fallback) ? fallback : null;
}

/**
 * Format a Postgres `date` field safely (no timezone shift).
 */
export function formatDateOnly(
  value: string | Date | null | undefined,
  pattern: string = "dd/MM/yyyy",
  fallback: string = "—"
): string {
  const d = parseDateOnly(value);
  if (!d) return fallback;
  return format(d, pattern);
}

export function safeFormatDate(
  value: string | null | undefined,
  pattern: string = "dd/MM/yyyy",
  fallback: string = "Sem data"
): string {
  if (!value) return fallback;
  // Auto-detect: date-only string (YYYY-MM-DD) vs full timestamp.
  // For date-only, parse as local to avoid UTC shift.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const d = parseDateOnly(value);
    return d ? format(d, pattern) : fallback;
  }
  const date = new Date(value);
  return isValid(date) ? format(date, pattern) : fallback;
}
