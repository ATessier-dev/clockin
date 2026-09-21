import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireEmployee, requireSuperuser, UnauthorizedError, ForbiddenError } from "@/lib/auth/requireSession";
import { isEffectivelyCompleted, type ChecklistRecurrence } from "@/lib/checklist/effectiveCompletion";

const RECURRENCES: ChecklistRecurrence[] = ["ONE_TIME", "DAILY", "WEEKLY", "MONTHLY"];

export async function GET() {
  try {
    await requireEmployee();

    const items = await withPrisma((prisma) =>
      prisma.checklistItem.findMany({
        orderBy: { sortOrder: "asc" },
        include: { completedByEmployee: { select: { id: true, firstName: true, lastName: true } } },
      })
    );

    return NextResponse.json({
      items: items.map((item) => {
        const completed = isEffectivelyCompleted(item.recurrence, item.completed, item.completedAt);
        return {
          ...item,
          completed,
          // A stale "checked by" from a since-reset cycle isn't relevant anymore.
          completedByEmployee: completed ? item.completedByEmployee : null,
        };
      }),
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    await requireSuperuser();

    const body = (await request.json().catch(() => null)) as { label?: unknown; recurrence?: unknown } | null;
    const label = typeof body?.label === "string" ? body.label.trim() : "";
    const recurrence = RECURRENCES.includes(body?.recurrence as ChecklistRecurrence)
      ? (body!.recurrence as ChecklistRecurrence)
      : "ONE_TIME";

    if (!label) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const lastItem = await withPrisma((prisma) =>
      prisma.checklistItem.findFirst({ orderBy: { sortOrder: "desc" } })
    );

    const item = await withPrisma((prisma) =>
      prisma.checklistItem.create({
        data: { label, recurrence, sortOrder: (lastItem?.sortOrder ?? -1) + 1 },
      })
    );

    return NextResponse.json({ item }, { status: 201 });
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
