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

export function toDateTimeLocalUTC8(
  dateInput: string | Date | null | undefined,
): string {
  if (!dateInput) return "";
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return "";
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: MANILA_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    const parts = formatter.formatToParts(d);
    const getVal = (type: string) =>
      parts.find((p) => p.type === type)?.value || "";
    return `${getVal("year")}-${getVal("month")}-${getVal("day")}T${getVal(
      "hour",
    )}:${getVal("minute")}`;
  } catch {
    return "";
  }
}

export function toISOStringUTC8(
  localDateStr: string | null | undefined,
): string | null {
  if (!localDateStr) return null;
  const trimmed = localDateStr.trim();
  if (!trimmed) return null;
  if (trimmed.endsWith("Z") || trimmed.includes("+")) {
    return trimmed;
  }
  const parts = trimmed.split("T");
  if (parts.length === 1) {
    return `${parts[0]}T00:00:00+08:00`;
  }
  const time = parts[1];
  const timeWithSeconds = time.length === 5 ? `${time}:00` : time;
  return `${parts[0]}T${timeWithSeconds}+08:00`;
}
