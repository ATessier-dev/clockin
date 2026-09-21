import { CalendarClock, CheckCircle2, AlertTriangle, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslation, myShiftStatusTranslations, type Language } from "@/translations";

export type MyShiftNow = { workplace: { label: string; color: string } | null } | null;

export function MyExpectedStatusCard({
  language,
  isClockedIn,
  shiftNow,
}: {
  language: Language;
  isClockedIn: boolean;
  shiftNow: MyShiftNow;
}) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <CalendarClock className="h-4 w-4 text-primary" aria-hidden="true" />
          {getTranslation(myShiftStatusTranslations.title, language)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {shiftNow ? (
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 font-medium">
              {isClockedIn ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
              )}
              {getTranslation(
                isClockedIn ? myShiftStatusTranslations.clockedIn : myShiftStatusTranslations.notClockedIn,
                language
              )}
            </span>
            {shiftNow.workplace && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" aria-hidden="true" style={{ color: shiftNow.workplace.color }} />
                {shiftNow.workplace.label}
              </span>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {getTranslation(myShiftStatusTranslations.empty, language)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
