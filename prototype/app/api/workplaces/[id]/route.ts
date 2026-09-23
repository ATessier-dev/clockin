import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireSuperuser, UnauthorizedError, ForbiddenError } from "@/lib/auth/requireSession";

const WORKPLACE_SELECT = {
  id: true,
  label: true,
  description: true,
  color: true,
} as const;

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export async function PATCH(request: Request, { params }: RouteContext<"/api/workplaces/[id]">) {
  try {
    await requireSuperuser();
    const { id } = await params;

    const existing = await withPrisma((prisma) => prisma.workplace.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => null)) as {
      label?: unknown;
      description?: unknown;
      color?: unknown;
    } | null;

    const label = typeof body?.label === "string" ? body.label.trim() || undefined : undefined;
    const description =
      typeof body?.description === "string" ? body.description.trim() || null : undefined;
    const color = typeof body?.color === "string" && HEX_COLOR_PATTERN.test(body.color) ? body.color : undefined;

    const workplace = await withPrisma((prisma) =>
      prisma.workplace.update({
        where: { id },
        data: { label, description, color },
        select: WORKPLACE_SELECT,
      })
    );

    return NextResponse.json({ workplace });
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
