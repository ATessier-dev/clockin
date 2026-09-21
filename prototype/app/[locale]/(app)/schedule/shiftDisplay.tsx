"use client";

import type { ReactNode } from "react";
import { format } from "date-fns";
import { MapPin } from "lucide-react";
import { ShiftCard, ShiftTime, ShiftEmployee, ShiftTitle } from '@/components/ui/shiftContent';

export type ShiftListItem = {
    id: string;
    employeeId: string;
    workplaceId: string;
    startAt: Date;
    endAt: Date;
    employee: { firstName: string; lastName: string };
    workplace: { label: string; color: string } | null;
};

export function ShiftDisplay({
    shiftList,
    renderActions,
}: {
    shiftList: ShiftListItem[];
    renderActions?: (shift: ShiftListItem) => ReactNode;
}) {
    return (
        <>
            {shiftList.map((shift) => getShiftCard(shift, renderActions))}
        </>
    );
}

function getShiftCard(shift: ShiftListItem, renderActions?: (shift: ShiftListItem) => ReactNode) {
    return (
        <ShiftCard
            key={shift.id}
            className="w-[90%]"
            style={shift.workplace ? { borderLeftColor: shift.workplace.color } : undefined}
        >
            <ShiftTitle>Galeriste</ShiftTitle>
            <ShiftEmployee>{shift.employee.firstName} {shift.employee.lastName}</ShiftEmployee>
            <ShiftTime>{format(shift.startAt, "HH:mm")} -- {format(shift.endAt, "HH:mm")}</ShiftTime>
            {shift.workplace && (
                <ShiftTime className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" aria-hidden="true" style={{ color: shift.workplace.color }} />
                    {shift.workplace.label}
                </ShiftTime>
            )}
            {renderActions?.(shift)}
        </ShiftCard>
    )
}