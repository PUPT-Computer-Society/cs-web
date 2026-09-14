/**
 * Utility to generate standard Google Calendar Web Intent template URLs.
 * Requires zero OAuth, zero server secrets, and zero backend maintenance.
 */

export interface GoogleCalendarEventParams {
  title: string;
  description?: string | null;
  location?: string | null;
  startTime: string | Date;
  endTime?: string | Date | null;
}

/**
 * Format a Date object or ISO string to Google Calendar UTC format: YYYYMMDDTHHmmssZ
 */
function formatUtcForGCal(dateInput: string | Date): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    return "";
  }
  return d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/**
 * Build a 1-click Google Calendar Web Intent URL.
 */
export function buildGoogleCalendarUrl({
  title,
  description,
  location,
  startTime,
  endTime,
}: GoogleCalendarEventParams): string {
  const startUtc = formatUtcForGCal(startTime);
  if (!startUtc) return "";

  let endUtc = "";
  if (endTime) {
    endUtc = formatUtcForGCal(endTime);
  }

  // If no end time, default to 1 hour after start time
  if (!endUtc) {
    const fallbackEndDate = new Date(
      new Date(startTime).getTime() + 60 * 60 * 1000,
    );
    endUtc = formatUtcForGCal(fallbackEndDate);
  }

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title.trim(),
    dates: `${startUtc}/${endUtc}`,
  });

  if (description?.trim()) {
    params.set("details", description.trim());
  }

  if (location?.trim()) {
    params.set("location", location.trim());
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
