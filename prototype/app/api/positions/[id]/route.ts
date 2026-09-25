import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireSuperuser, UnauthorizedError, ForbiddenError } from "@/lib/auth/requireSession";

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

/** Updates a position's name/color. Superuser only; 404 if the position doesn't exist. */
export async function PATCH(request: Request, { params }: RouteContext<"/api/positions/[id]">) {
  try {
    await requireSuperuser();
    const { id } = await params;

    const existing = await withPrisma((prisma) => prisma.position.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => null)) as { name?: unknown; color?: unknown } | null;
    const name = typeof body?.name === "string" ? body.name.trim() || undefined : undefined;
    const color = typeof body?.color === "string" && HEX_COLOR_PATTERN.test(body.color) ? body.color : undefined;

    if (body && "name" in body && !name) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const position = await withPrisma((prisma) =>
      prisma.position.update({ where: { id }, data: { name, color } })
    );

    return NextResponse.json({ position });
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

// Deleting a position never deletes its shifts. Shift.positionId is
// onDelete: SetNull, so shifts simply lose their position.
export async function DELETE(request: Request, { params }: RouteContext<"/api/positions/[id]">) {
  try {
    await requireSuperuser();
    const { id } = await params;

    const existing = await withPrisma((prisma) => prisma.position.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    await withPrisma((prisma) => prisma.position.delete({ where: { id } }));

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
