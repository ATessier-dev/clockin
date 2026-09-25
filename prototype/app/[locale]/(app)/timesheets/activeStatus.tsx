import { format } from "date-fns";
import { CircleDot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslation, timesheetsTranslations, type Language } from "@/translations";
import { dateLocales } from "../schedule/clockDisplay";

export type ActiveEmployee = {
  employeeId: string;
  firstName: string;
  lastName: string;
  since: Date;
  workplace: { label: string; color: string } | null;
};

/**
 * Card listing employees currently clocked in, with their workplace and
 * clock-in time (`since`).
 */
export function ActiveStatusCard({ language, activeEmployees }: { language: Language; activeEmployees: ActiveEmployee[] }) {
  const dateLocale = dateLocales[language];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <CircleDot className="h-4 w-4 text-primary" aria-hidden="true" />
          {getTranslation(timesheetsTranslations.activeStatusTitle, language)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {activeEmployees.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {getTranslation(timesheetsTranslations.activeStatusEmpty, language)}
          </p>
        ) : (
          activeEmployees.map((employee) => (
            <div key={employee.employeeId} className="flex items-center justify-between gap-2 text-sm">
              <span className="font-medium">
                {employee.firstName} {employee.lastName}
              </span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                {employee.workplace && (
                  <span className="flex items-center gap-1">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: employee.workplace.color }}
                      aria-hidden="true"
                    />
                    {employee.workplace.label}
                  </span>
                )}
                {getTranslation(timesheetsTranslations.activeStatusSince, language)}{" "}
                {format(employee.since, "HH:mm", { locale: dateLocale })}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
