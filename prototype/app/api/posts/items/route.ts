import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireEmployee, requireSuperuser, UnauthorizedError, ForbiddenError } from "@/lib/auth/requireSession";

/** Lists post items with their reference documents. Any authenticated employee can read them. */
export async function GET() {
  try {
    await requireEmployee();

    const items = await withPrisma((prisma) =>
      prisma.postItem.findMany({
        orderBy: { sortOrder: "asc" },
        include: { documents: { select: { id: true, filename: true, createdAt: true } } },
      })
    );

    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    throw error;
  }
}

/** Creates a post item appended at the end of the sort order. Superuser only. */
export async function POST(request: Request) {
  try {
    await requireSuperuser();

    const body = (await request.json().catch(() => null)) as { title?: unknown; categoryId?: unknown } | null;
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const categoryId = typeof body?.categoryId === "string" && body.categoryId ? body.categoryId : null;

    if (!title) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    if (categoryId) {
      const category = await withPrisma((prisma) => prisma.postCategory.findUnique({ where: { id: categoryId } }));
      if (!category) {
        return NextResponse.json({ error: "invalid_body" }, { status: 400 });
      }
    }

    const lastItem = await withPrisma((prisma) => prisma.postItem.findFirst({ orderBy: { sortOrder: "desc" } }));

    const item = await withPrisma((prisma) =>
      prisma.postItem.create({
        data: { title, categoryId, sortOrder: (lastItem?.sortOrder ?? -1) + 1 },
        include: { documents: { select: { id: true, filename: true, createdAt: true } } },
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
