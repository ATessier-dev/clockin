import { format } from "date-fns";
import { CalendarClock, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslation, upcomingShiftTranslations, type Language } from "@/translations";
import { dateLocales } from "../schedule/clockDisplay";

export type UpcomingShift = {
  id: string;
  startAt: Date;
  endAt: Date;
  workplace: { label: string; color: string } | null;
} | null;

export function UpcomingShiftCard({ language, shift }: { language: Language; shift: UpcomingShift }) {
  const dateLocale = dateLocales[language];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <CalendarClock className="h-4 w-4 text-primary" aria-hidden="true" />
          {getTranslation(upcomingShiftTranslations.title, language)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {shift ? (
          <div className="space-y-1 text-sm">
            <p className="font-medium capitalize">
              {format(shift.startAt, "EEEE d MMM", { locale: dateLocale })}
            </p>
            <p className="text-muted-foreground">
              {format(shift.startAt, "HH:mm", { locale: dateLocale })} –{" "}
              {format(shift.endAt, "HH:mm", { locale: dateLocale })}
            </p>
            {shift.workplace && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" aria-hidden="true" style={{ color: shift.workplace.color }} />
                {shift.workplace.label}
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {getTranslation(upcomingShiftTranslations.none, language)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
