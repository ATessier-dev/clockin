import { CalendarClock, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslation, timesheetsTranslations, type Language } from "@/translations";

export type ExpectedEmployee = {
  employeeId: string;
  firstName: string;
  lastName: string;
  workplace: { label: string; color: string } | null;
  isClockedIn: boolean;
};

export function ExpectedStatusCard({
  language,
  expectedEmployees,
}: {
  language: Language;
  expectedEmployees: ExpectedEmployee[];
}) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <CalendarClock className="h-4 w-4 text-primary" aria-hidden="true" />
          {getTranslation(timesheetsTranslations.expectedStatusTitle, language)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {expectedEmployees.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {getTranslation(timesheetsTranslations.expectedStatusEmpty, language)}
          </p>
        ) : (
          expectedEmployees.map((employee) => (
            <div key={employee.employeeId} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 font-medium">
                {employee.isClockedIn ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
                )}
                {employee.firstName} {employee.lastName}
              </span>
              <span className="flex items-center gap-2 text-xs">
                {employee.workplace && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: employee.workplace.color }}
                      aria-hidden="true"
                    />
                    {employee.workplace.label}
                  </span>
                )}
                <span className={employee.isClockedIn ? "text-muted-foreground" : "font-medium text-destructive"}>
                  {getTranslation(
                    employee.isClockedIn
                      ? timesheetsTranslations.expectedStatusClockedIn
                      : timesheetsTranslations.expectedStatusNotClockedIn,
                    language
                  )}
                </span>
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
