import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireSuperuser, UnauthorizedError, ForbiddenError } from "@/lib/auth/requireSession";

const WORKPLACE_SELECT = {
  id: true,
  key: true,
  label: true,
  allowedCidr: true,
  color: true,
} as const;

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

function isUniqueConstraintViolation(error: unknown): boolean {
  return Boolean(
    error && typeof error === "object" && "code" in error && (error as { code?: unknown }).code === "P2002"
  );
}

export async function PATCH(request: Request, { params }: RouteContext<"/api/workplaces/[id]">) {
  try {
    await requireSuperuser();
    const { id } = await params;

    const existing = await withPrisma((prisma) => prisma.workplace.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => null)) as {
      key?: unknown;
      label?: unknown;
      allowedCidr?: unknown;
      color?: unknown;
    } | null;

    const key = typeof body?.key === "string" ? body.key.trim() || undefined : undefined;
    const label = typeof body?.label === "string" ? body.label.trim() || undefined : undefined;
    const allowedCidr = typeof body?.allowedCidr === "string" ? body.allowedCidr.trim() || undefined : undefined;
    const color = typeof body?.color === "string" && HEX_COLOR_PATTERN.test(body.color) ? body.color : undefined;

    const workplace = await withPrisma((prisma) =>
      prisma.workplace.update({
        where: { id },
        data: { key, label, allowedCidr, color },
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
    if (isUniqueConstraintViolation(error)) {
      return NextResponse.json({ error: "key_taken" }, { status: 409 });
    }
    throw error;
  }
}
