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

function isUniqueConstraintViolation(error: unknown): boolean {
  return Boolean(
    error && typeof error === "object" && "code" in error && (error as { code?: unknown }).code === "P2002"
  );
}

// The unique `key` is an internal slug, never shown or entered in the UI.
// Derived from the label at creation time, with a numeric suffix on
// collision (two workplaces sharing a label, or a duplicate slug).
function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "workplace"
  );
}

export async function GET() {
  try {
    await requireSuperuser();

    const workplaces = await withPrisma((prisma) =>
      prisma.workplace.findMany({ orderBy: { label: "asc" }, select: WORKPLACE_SELECT })
    );

    return NextResponse.json({ workplaces });
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

export async function POST(request: Request) {
  try {
    await requireSuperuser();

    const body = (await request.json().catch(() => null)) as {
      label?: unknown;
      description?: unknown;
      color?: unknown;
    } | null;

    const label = typeof body?.label === "string" ? body.label.trim() : "";
    const description = typeof body?.description === "string" ? body.description.trim() || null : null;
    const color = typeof body?.color === "string" && HEX_COLOR_PATTERN.test(body.color) ? body.color : "#0ea5e9";

    if (!label) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const baseKey = slugify(label);
    let workplace;
    for (let attempt = 0; ; attempt += 1) {
      const key = attempt === 0 ? baseKey : `${baseKey}-${attempt + 1}`;
      try {
        workplace = await withPrisma((prisma) =>
          prisma.workplace.create({
            data: { key, label, description, color },
            select: WORKPLACE_SELECT,
          })
        );
        break;
      } catch (error) {
        if (isUniqueConstraintViolation(error) && attempt < 5) continue;
        throw error;
      }
    }

    return NextResponse.json({ workplace }, { status: 201 });
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
