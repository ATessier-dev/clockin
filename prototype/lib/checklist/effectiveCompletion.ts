import { isSameDay, isSameWeek, isSameMonth } from "date-fns";

export type ChecklistRecurrence = "ONE_TIME" | "DAILY" | "WEEKLY" | "MONTHLY";

// Recurring items are never reset by a background job — `completed` just
// records the last time someone checked it off, and this decides whether
// that check-off still counts for the current day/week/month.
export function isEffectivelyCompleted(
  recurrence: ChecklistRecurrence,
  completed: boolean,
  completedAt: Date | null,
  now: Date = new Date()
): boolean {
  if (!completed) return false;
  if (recurrence === "ONE_TIME") return true;
  if (!completedAt) return false;

  switch (recurrence) {
    case "DAILY":
      return isSameDay(completedAt, now);
    case "WEEKLY":
      return isSameWeek(completedAt, now, { weekStartsOn: 1 });
    case "MONTHLY":
      return isSameMonth(completedAt, now);
  }
}
