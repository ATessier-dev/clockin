import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireEmployee, requireSuperuser, UnauthorizedError, ForbiddenError } from "@/lib/auth/requireSession";
import { isEffectivelyCompleted, type ChecklistRecurrence } from "@/lib/checklist/effectiveCompletion";

const RECURRENCES: ChecklistRecurrence[] = ["ONE_TIME", "DAILY", "WEEKLY", "MONTHLY"];

// Any employee can check an item; only the employee who checked it (or a
// superuser) can uncheck it. Only a superuser can rename an item or change
// its recurrence.
export async function PATCH(request: Request, { params }: RouteContext<"/api/checklist/[id]">) {
  try {
    const session = await requireEmployee();
    const { id } = await params;
    const isSuperuser = session.role === "SUPERUSER";

    const existing = await withPrisma((prisma) => prisma.checklistItem.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => null)) as {
      label?: unknown;
      recurrence?: unknown;
      completed?: unknown;
      categoryId?: unknown;
    } | null;

    const completed = typeof body?.completed === "boolean" ? body.completed : undefined;
    const label = isSuperuser && typeof body?.label === "string" ? body.label.trim() || undefined : undefined;
    const recurrence =
      isSuperuser && RECURRENCES.includes(body?.recurrence as ChecklistRecurrence)
        ? (body!.recurrence as ChecklistRecurrence)
        : undefined;
    const categoryId =
      isSuperuser && (body?.categoryId === null || typeof body?.categoryId === "string")
        ? body.categoryId || null
        : undefined;

    if (completed === false) {
      const canUncheck = isSuperuser || existing.completedByEmployeeId === session.employeeId;
      if (!canUncheck) {
        return NextResponse.json({ error: "not_owner" }, { status: 403 });
      }
    }

    if (categoryId) {
      const category = await withPrisma((prisma) => prisma.checklistCategory.findUnique({ where: { id: categoryId } }));
      if (!category) {
        return NextResponse.json({ error: "invalid_body" }, { status: 400 });
      }
    }

    const item = await withPrisma((prisma) =>
      prisma.checklistItem.update({
        where: { id },
        data: {
          completed,
          completedAt: completed === undefined ? undefined : completed ? new Date() : null,
          completedByEmployeeId: completed === undefined ? undefined : completed ? session.employeeId : null,
          label,
          recurrence,
          categoryId,
        },
        include: { completedByEmployee: { select: { id: true, firstName: true, lastName: true } } },
      })
    );

    const effectiveCompleted = isEffectivelyCompleted(item.recurrence, item.completed, item.completedAt);

    return NextResponse.json({
      item: {
        ...item,
        completed: effectiveCompleted,
        completedByEmployee: effectiveCompleted ? item.completedByEmployee : null,
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    throw error;
  }
}

export async function DELETE(request: Request, { params }: RouteContext<"/api/checklist/[id]">) {
  try {
    await requireSuperuser();
    const { id } = await params;

    const existing = await withPrisma((prisma) => prisma.checklistItem.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    await withPrisma((prisma) => prisma.checklistItem.delete({ where: { id } }));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    throw error;
  }
}
