import { format, differenceInMinutes } from "date-fns";

export type ClockEventForDuration = { type: "CLOCK_IN" | "CLOCK_OUT"; at: Date };

/** Normalizes a date to a stable "yyyy-MM-dd" key for grouping worked minutes by day. */
export function dayKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

// A day only counts once it has a matching CLOCK_OUT — an open clock-in
// (no clock-out yet) contributes nothing, by design.
export function computeWorkedMinutes(events: ClockEventForDuration[]): {
  totalMinutes: number;
  byDay: Map<string, number>;
} {
  const byDay = new Map<string, number>();
  let totalMinutes = 0;
  let openClockIn: Date | null = null;

  for (const event of events) {
    if (event.type === "CLOCK_IN") {
      openClockIn = event.at;
      continue;
    }

    if (!openClockIn) continue; // stray clock-out with no matching clock-in — ignore defensively

    const minutes = differenceInMinutes(event.at, openClockIn);
    totalMinutes += minutes;
    const key = dayKey(openClockIn);
    byDay.set(key, (byDay.get(key) ?? 0) + minutes);
    openClockIn = null;
  }

  return { totalMinutes, byDay };
}

/** Formats minutes as "XhYY", omitting the minutes part when it's zero (e.g. "3h" vs "3h05"). */
export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h${String(minutes).padStart(2, "0")}`;
}
