/**
 * Timezone-aware date formatting utilities for UTC+8 (Asia/Manila).
 *
 * Strict 80-character line limit enforced.
 */

export const MANILA_TIMEZONE = "Asia/Manila";

export function formatDateTimeUTC8(
  dateInput: string | Date | null | undefined,
): string {
  if (!dateInput) return "N/A";
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toLocaleString("en-US", {
      timeZone: MANILA_TIMEZONE,
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  } catch {
    return String(dateInput);
  }
}

export function formatDateUTC8(
  dateInput: string | Date | null | undefined,
): string {
  if (!dateInput) return "N/A";
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toLocaleDateString("en-US", {
      timeZone: MANILA_TIMEZONE,
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return String(dateInput);
  }
}

export function formatTimeUTC8(
  dateInput: string | Date | null | undefined,
): string {
  if (!dateInput) return "N/A";
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toLocaleTimeString("en-US", {
      timeZone: MANILA_TIMEZONE,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return String(dateInput);
  }
}
