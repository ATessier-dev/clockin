"use client";

import { format, startOfDay, endOfDay, getDay } from "date-fns";
import { Clock3, PartyPopper, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTranslation, eventsTranslations, type Language } from "@/translations";
import { dateLocales } from "./clockDisplay";
import type { GalleryEventEntry } from "./editGalleryEvent";
import type { DayOfWeek } from "../settings/editDailyMeeting";

export type DailyMeetingDisplay = {
  id: string;
  name: string;
  time: string;
  days: DayOfWeek[];
  workplace: { label: string; color: string };
};

// date-fns getDay() returns 0 (Sunday) through 6 (Saturday).
const DAY_OF_WEEK_BY_INDEX: DayOfWeek[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

function eventOverlapsDay(event: GalleryEventEntry, day: Date): boolean {
  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);
  return event.startAt <= dayEnd && event.endAt >= dayStart;
}

export function DayExtras({
  language,
  day,
  dailyMeetings,
  events,
  isSuperuser,
  onEditEvent,
}: {
  language: Language;
  day: Date;
  dailyMeetings: DailyMeetingDisplay[];
  events: GalleryEventEntry[];
  isSuperuser: boolean;
  onEditEvent: (event: GalleryEventEntry) => void;
}) {
  const dateLocale = dateLocales[language];
  const dayOfWeek = DAY_OF_WEEK_BY_INDEX[getDay(day)];
  const dayMeetings = dailyMeetings.filter((meeting) => meeting.days.includes(dayOfWeek));
  const dayEvents = events.filter((event) => eventOverlapsDay(event, day));

  if (dayMeetings.length === 0 && dayEvents.length === 0) return null;

  return (
    <div className="w-full space-y-1.5 border-b border-border pb-2">
      {dayMeetings.map((meeting) => (
        <div key={meeting.id} className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock3 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{meeting.time}</span>
          <span>{meeting.name}</span>
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: meeting.workplace.color }}
            aria-hidden="true"
          />
          <span>{meeting.workplace.label}</span>
        </div>
      ))}
      {dayEvents.map((event) => (
        <div key={event.id} className="flex items-center gap-2 text-xs">
          <PartyPopper className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
          <span className="font-medium">{event.title}</span>
          <span className="text-muted-foreground">
            {format(event.startAt, "HH:mm", { locale: dateLocale })}
            {"–"}
            {format(event.endAt, "HH:mm", { locale: dateLocale })}
          </span>
          {event.workplace && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: event.workplace.color }}
                aria-hidden="true"
              />
              {event.workplace.label}
            </span>
          )}
          {isSuperuser && (
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto h-6 w-6 shrink-0"
              onClick={() => onEditEvent(event)}
            >
              <Pencil className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">{getTranslation(eventsTranslations.editEvent, language)}</span>
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
