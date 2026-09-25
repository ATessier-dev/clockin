"use client";

import type { ReactNode } from "react";
import { format } from "date-fns";
import { MapPin } from "lucide-react";
import { ShiftCard, ShiftTime, ShiftEmployee, ShiftTitle } from '@/components/ui/shiftContent';

export type ShiftListItem = {
    id: string;
    employeeId: string;
    workplaceId: string;
    positionId: string | null;
    startAt: Date;
    endAt: Date;
    employee: { firstName: string; lastName: string };
    workplace: { label: string; color: string } | null;
    position: { name: string; color: string } | null;
};

/** Renders a list of shift cards; `renderActions` lets the caller add per-shift buttons (e.g. edit) without this component knowing about permissions. */
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
            {shift.position && (
                <ShiftTitle className="flex items-center gap-1.5">
                    <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: shift.position.color }}
                        aria-hidden="true"
                    />
                    {shift.position.name}
                </ShiftTitle>
            )}
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