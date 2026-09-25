import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireEmployee, requireSuperuser, UnauthorizedError, ForbiddenError } from "@/lib/auth/requireSession";

/** Lists checklist categories in display order. Any authenticated employee can read them. */
export async function GET() {
  try {
    await requireEmployee();

    const categories = await withPrisma((prisma) =>
      prisma.checklistCategory.findMany({ orderBy: { sortOrder: "asc" } })
    );

    return NextResponse.json({ categories });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    throw error;
  }
}

/** Creates a checklist category appended at the end of the sort order. Superuser only. */
export async function POST(request: Request) {
  try {
    await requireSuperuser();

    const body = (await request.json().catch(() => null)) as { name?: unknown } | null;
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const lastCategory = await withPrisma((prisma) =>
      prisma.checklistCategory.findFirst({ orderBy: { sortOrder: "desc" } })
    );

    const category = await withPrisma((prisma) =>
      prisma.checklistCategory.create({
        data: { name, sortOrder: (lastCategory?.sortOrder ?? -1) + 1 },
      })
    );

    return NextResponse.json({ category }, { status: 201 });
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
