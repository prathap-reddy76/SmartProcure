/**
 * Safely converts a YYYY-MM-DD string into a UTC midnight Date object.
 * This ensures that timezone conversion doesn't shift the calendar date.
 */
export function parseDateStringAsUTC(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Gets today's calendar date as a UTC midnight Date object.
 * Uses the local browser/server timezone to determine what "today" is,
 * but returns a Date object set to midnight UTC of that local calendar date.
 */
export function getTodayAsUTCDate(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

/**
 * Returns a date object at midnight UTC for a specific Date.
 */
export function toUTCMidnight(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

/**
 * Gets a YYYY-MM-DD string for the local timezone from a Date object.
 */
export function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Gets a YYYY-MM-DD string from a UTC midnight Date object.
 * Since the date is stored as UTC midnight, this uses UTC getters.
 */
export function getUTCDateString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

import { format } from "date-fns";

export function formatUTCDate(date: Date | string | null | undefined, formatString: string): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const localDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return format(localDate, formatString);
}

/**
 * Safely and deterministically formats a Date or ISO date string into DD/MM/YYYY.
 * Evaluates the calendar date deterministically using UTC date components
 * to guarantee that the server (SSR) and client (Hydration) render the exact same string,
 * avoiding locale-dependent mismatches caused by toLocaleDateString().
 */
export function formatDeterministicDate(
  dateInput: Date | string | null | undefined,
  pattern: string = "dd/MM/yyyy"
): string {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "";

  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();

  if (pattern === "dd/MM/yyyy") {
    return `${day}/${month}/${year}`;
  }

  const localDate = new Date(year, d.getUTCMonth(), d.getUTCDate());
  return format(localDate, pattern);
}
