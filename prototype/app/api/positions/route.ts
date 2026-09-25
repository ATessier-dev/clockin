import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireEmployee, requireSuperuser, UnauthorizedError, ForbiddenError } from "@/lib/auth/requireSession";

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

/** Lists positions in display order. Any authenticated employee can read them. */
export async function GET() {
  try {
    await requireEmployee();

    const positions = await withPrisma((prisma) =>
      prisma.position.findMany({ orderBy: { sortOrder: "asc" } })
    );

    return NextResponse.json({ positions });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    throw error;
  }
}

/** Creates a position appended at the end of the sort order. Superuser only. */
export async function POST(request: Request) {
  try {
    await requireSuperuser();

    const body = (await request.json().catch(() => null)) as { name?: unknown; color?: unknown } | null;
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const color = typeof body?.color === "string" && HEX_COLOR_PATTERN.test(body.color) ? body.color : "#0ea5e9";

    if (!name) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const lastPosition = await withPrisma((prisma) =>
      prisma.position.findFirst({ orderBy: { sortOrder: "desc" } })
    );

    const position = await withPrisma((prisma) =>
      prisma.position.create({
        data: { name, color, sortOrder: (lastPosition?.sortOrder ?? -1) + 1 },
      })
    );

    return NextResponse.json({ position }, { status: 201 });
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
