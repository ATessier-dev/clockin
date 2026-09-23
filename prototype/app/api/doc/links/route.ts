import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireEmployee, requireSuperuser, UnauthorizedError, ForbiddenError } from "@/lib/auth/requireSession";

export async function GET() {
  try {
    await requireEmployee();

    const links = await withPrisma((prisma) => prisma.docLink.findMany({ orderBy: { sortOrder: "asc" } }));

    return NextResponse.json({ links });
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

    const body = (await request.json().catch(() => null)) as {
      title?: unknown;
      url?: unknown;
      categoryId?: unknown;
    } | null;

    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const url = typeof body?.url === "string" ? body.url.trim() : "";
    const categoryId = typeof body?.categoryId === "string" && body.categoryId ? body.categoryId : null;

    if (!title || !url) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    if (categoryId) {
      const category = await withPrisma((prisma) => prisma.docCategory.findUnique({ where: { id: categoryId } }));
      if (!category) {
        return NextResponse.json({ error: "invalid_body" }, { status: 400 });
      }
    }

    const lastLink = await withPrisma((prisma) => prisma.docLink.findFirst({ orderBy: { sortOrder: "desc" } }));

    const link = await withPrisma((prisma) =>
      prisma.docLink.create({
        data: { title, url, categoryId, sortOrder: (lastLink?.sortOrder ?? -1) + 1 },
      })
    );

    return NextResponse.json({ link }, { status: 201 });
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
