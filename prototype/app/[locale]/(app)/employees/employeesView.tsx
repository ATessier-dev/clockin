"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Pencil, KeyRound, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeading } from "@/components/ui/pageHeading";
import { getTranslation, employeesTranslations, type Language } from "@/translations";
import { EmployeeForm, type EmployeeEntry, type WorkplaceOption } from "./editEmployee";

/** Superuser employee directory: list of employees plus the create/edit form. */
export function EmployeesView({
  language,
  employees,
  workplaces,
}: {
  language: Language;
  employees: EmployeeEntry[];
  workplaces: WorkplaceOption[];
}) {
  const router = useRouter();
  const [formMode, setFormMode] = useState<"create" | EmployeeEntry | null>(null);

  function handleChanged() {
    setFormMode(null);
    router.refresh();
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center space-y-4">
      <PageHeading
        title={
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" aria-hidden="true" />
            {getTranslation(employeesTranslations.title, language)}
          </span>
        }
        actions={
          <Button size="sm" onClick={() => setFormMode("create")}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {getTranslation(employeesTranslations.addEmployee, language)}
          </Button>
        }
      />

      {formMode && (
        <EmployeeForm
          language={language}
          workplaces={workplaces}
          initialValues={formMode === "create" ? undefined : formMode}
          onCancel={() => setFormMode(null)}
          onSaved={handleChanged}
          onStatusChanged={handleChanged}
        />
      )}

      <div className="flex w-full flex-col gap-3">
        {employees.map((employee) => (
          <Card key={employee.id} className={employee.active ? "w-full" : "w-full opacity-60"}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-sm">
                {employee.firstName} {employee.lastName}
                {!employee.active && (
                  <Badge variant="outline">{getTranslation(employeesTranslations.inactiveBadge, language)}</Badge>
                )}
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setFormMode(employee)}>
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                {getTranslation(employeesTranslations.editEmployee, language)}
              </Button>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                {employee.code}
              </span>
              <Badge variant={employee.role === "SUPERUSER" ? "default" : "secondary"}>
                {getTranslation(
                  employee.role === "SUPERUSER"
                    ? employeesTranslations.roleSuperuser
                    : employeesTranslations.roleEmployee,
                  language
                )}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
