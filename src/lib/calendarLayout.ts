/**
 * Calendar layout engine implementing the 6 rules of calendar design.
 *
 * Rules:
 * 1. Subtle color coding (3px accent bar + 10% fill).
 * 2. Zero overlap via horizontal column splitting.
 * 3. Height strictly proportional to duration.
 * 4. Minimum event visibility floor with text clipping.
 * 5. Direct interactive canvas.
 * 6. Density management.
 *
 * Adheres strictly to the 80-character line limit.
 */

import type { Task } from "@/types";

export const CALENDAR_START_HOUR = 7; // 7:00 AM
export const CALENDAR_END_HOUR = 22; // 10:00 PM (22:00)
export const CALENDAR_TOTAL_HOURS = CALENDAR_END_HOUR - CALENDAR_START_HOUR;
export const PIXELS_PER_HOUR = 64;
export const PIXELS_PER_MINUTE = PIXELS_PER_HOUR / 60;
export const MIN_EVENT_HEIGHT_PX = 24;
export const TOTAL_GRID_HEIGHT_PX = CALENDAR_TOTAL_HOURS * PIXELS_PER_HOUR;
export const DEFAULT_SLOT_MINUTES = 30;

export interface PositionedTaskEvent {
  task: Task;
  top: number;
  height: number;
  leftPercent: number;
  widthPercent: number;
  startMinute: number;
  endMinute: number;
}

/**
 * Returns Monday-to-Sunday 7-day array for the week containing reference date.
 */
export function getWeekDates(referenceDate: Date): Date[] {
  const date = new Date(referenceDate);
  const day = date.getDay();
  // Monday as index 0 (if Sunday (0), distance is -6)
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);

  const week: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    week.push(d);
  }
  return week;
}

/**
 * Check if two dates represent the same calendar day.
 */
export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Format hour number into standard 12-hour AM/PM label.
 */
export function formatHourLabel(hour: number): string {
  if (hour === 0 || hour === 24) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour > 12) return `${hour - 12} PM`;
  return `${hour} AM`;
}

interface RawTimeEvent {
  task: Task;
  startMin: number;
  endMin: number;
}

/**
 * Compute side-by-side collision-free layout for tasks on a single day.
 */
export function computeDayEventLayout(
  tasks: Task[],
  dayDate: Date,
): PositionedTaskEvent[] {
  const dayEvents: RawTimeEvent[] = [];

  for (const task of tasks) {
    if (!task.startTime || !task.endTime) continue;
    const start = new Date(task.startTime);
    const end = new Date(task.endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) continue;
    if (!isSameDay(start, dayDate)) continue;

    const startMin = start.getHours() * 60 + start.getMinutes();
    const endMin = end.getHours() * 60 + end.getMinutes();

    if (endMin <= startMin) continue;

    dayEvents.push({ task, startMin, endMin });
  }

  if (dayEvents.length === 0) return [];

  // Sort by start minute ascending, then duration descending
  dayEvents.sort((a, b) => {
    if (a.startMin !== b.startMin) return a.startMin - b.startMin;
    return b.endMin - b.startMin - (a.endMin - a.startMin);
  });

  // Cluster overlapping events into connected groups
  const clusters: RawTimeEvent[][] = [];
  let currentCluster: RawTimeEvent[] = [];
  let clusterEnd = -1;

  for (const evt of dayEvents) {
    if (currentCluster.length === 0) {
      currentCluster.push(evt);
      clusterEnd = evt.endMin;
    } else if (evt.startMin < clusterEnd) {
      currentCluster.push(evt);
      clusterEnd = Math.max(clusterEnd, evt.endMin);
    } else {
      clusters.push(currentCluster);
      currentCluster = [evt];
      clusterEnd = evt.endMin;
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  const results: PositionedTaskEvent[] = [];
  const gridStartMinute = CALENDAR_START_HOUR * 60;

  // Process each collision cluster
  for (const cluster of clusters) {
    const columns: RawTimeEvent[][] = [];
    const eventColumnIndex: Map<string, number> = new Map();

    for (const evt of cluster) {
      let placed = false;
      for (let col = 0; col < columns.length; col++) {
        const lastInCol = columns[col][columns[col].length - 1];
        if (lastInCol.endMin <= evt.startMin) {
          columns[col].push(evt);
          eventColumnIndex.set(evt.task.id, col);
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([evt]);
        eventColumnIndex.set(evt.task.id, columns.length - 1);
      }
    }

    const totalCols = Math.max(columns.length, 1);
    const colWidth = 100 / totalCols;

    for (const evt of cluster) {
      const colIdx = eventColumnIndex.get(evt.task.id) || 0;
      const topMinutes = Math.max(0, evt.startMin - gridStartMinute);
      const durationMinutes = evt.endMin - evt.startMin;

      const topPx = topMinutes * PIXELS_PER_MINUTE;
      const naturalHeightPx = durationMinutes * PIXELS_PER_MINUTE;
      const heightPx = Math.max(naturalHeightPx, MIN_EVENT_HEIGHT_PX);

      results.push({
        task: evt.task,
        top: topPx,
        height: heightPx,
        leftPercent: colIdx * colWidth,
        widthPercent: colWidth,
        startMinute: evt.startMin,
        endMinute: evt.endMin,
      });
    }
  }

  return results;
}
