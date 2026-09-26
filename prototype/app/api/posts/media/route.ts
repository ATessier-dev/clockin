import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireEmployee, requireSuperuser, UnauthorizedError, ForbiddenError } from "@/lib/auth/requireSession";

/** Lists post media (where a text can be posted) in display order. Any authenticated employee can read them. */
export async function GET() {
  try {
    await requireEmployee();

    const media = await withPrisma((prisma) => prisma.postMedia.findMany({ orderBy: { sortOrder: "asc" } }));

    return NextResponse.json({ media });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    throw error;
  }
}

/** Creates a post medium appended at the end of the sort order. Superuser only. */
export async function POST(request: Request) {
  try {
    await requireSuperuser();

    const body = (await request.json().catch(() => null)) as { name?: unknown } | null;
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const lastMedia = await withPrisma((prisma) => prisma.postMedia.findFirst({ orderBy: { sortOrder: "desc" } }));

    const medium = await withPrisma((prisma) =>
      prisma.postMedia.create({ data: { name, sortOrder: (lastMedia?.sortOrder ?? -1) + 1 } })
    );

    return NextResponse.json({ medium }, { status: 201 });
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
