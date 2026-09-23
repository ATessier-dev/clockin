"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Clock3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/ui/pageHeading";
import { getTranslation, dailyMeetingsTranslations, availabilityTranslations, type Language } from "@/translations";
import {
  DailyMeetingForm,
  DAY_SHORT_LABEL_KEY,
  type DailyMeetingEntry,
  type DailyMeetingWorkplaceOption,
} from "./editDailyMeeting";

export type DailyMeetingListEntry = DailyMeetingEntry & {
  workplace: { label: string; color: string };
};

export function DailyMeetingsManager({
  language,
  dailyMeetings,
  workplaces,
}: {
  language: Language;
  dailyMeetings: DailyMeetingListEntry[];
  workplaces: DailyMeetingWorkplaceOption[];
}) {
  const router = useRouter();
  const [formMode, setFormMode] = useState<"create" | DailyMeetingEntry | null>(null);

  function handleSaved() {
    setFormMode(null);
    router.refresh();
  }

  return (
    <div className="w-full max-w-md space-y-4">
      <PageHeading
        title={
          <span className="flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-primary" aria-hidden="true" />
            {getTranslation(dailyMeetingsTranslations.title, language)}
          </span>
        }
        actions={
          workplaces.length > 0 ? (
            <Button size="sm" onClick={() => setFormMode("create")}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {getTranslation(dailyMeetingsTranslations.addMeeting, language)}
            </Button>
          ) : undefined
        }
      />

      {formMode && (
        <DailyMeetingForm
          language={language}
          initialValues={formMode === "create" ? undefined : formMode}
          workplaces={workplaces}
          onCancel={() => setFormMode(null)}
          onSaved={handleSaved}
          onDeleted={handleSaved}
        />
      )}

      <div className="flex w-full flex-col gap-3">
        {dailyMeetings.length === 0 ? (
          <p className="text-xs text-muted-foreground">{getTranslation(dailyMeetingsTranslations.empty, language)}</p>
        ) : (
          dailyMeetings.map((meeting) => (
            <Card key={meeting.id} className="w-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: meeting.workplace.color }}
                    aria-hidden="true"
                  />
                  {meeting.name}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => setFormMode(meeting)}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  {getTranslation(dailyMeetingsTranslations.editMeeting, language)}
                </Button>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {meeting.days
                  .map((day) => getTranslation(availabilityTranslations[DAY_SHORT_LABEL_KEY[day]], language))
                  .join(", ")}{" "}
                · {meeting.time} · {meeting.workplace.label}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
