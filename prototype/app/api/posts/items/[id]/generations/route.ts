import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireEmployee, UnauthorizedError } from "@/lib/auth/requireSession";

/** Lists an item's saved generation history (newest first). Any authenticated employee can read it. */
export async function GET(request: Request, { params }: RouteContext<"/api/posts/items/[id]/generations">) {
  try {
    await requireEmployee();
    const { id } = await params;

    const generations = await withPrisma((prisma) =>
      prisma.postGeneration.findMany({
        where: { itemId: id },
        orderBy: { createdAt: "desc" },
        include: { createdByEmployee: { select: { id: true, firstName: true, lastName: true } } },
      })
    );

    return NextResponse.json({ generations });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    throw error;
  }
}

/**
 * Saves a post text to the item's history: the final, possibly hand-edited
 * version of a draft the employee generated via
 * POST /api/posts/items/[id]/generate and approved. Doesn't call the LLM;
 * saving is what makes a text count as "already posted" for future
 * anti-repetition context, so a discarded draft never reaches here. Open to
 * any employee.
 */
export async function POST(request: Request, { params }: RouteContext<"/api/posts/items/[id]/generations">) {
  try {
    const session = await requireEmployee();
    const { id } = await params;

    const item = await withPrisma((prisma) => prisma.postItem.findUnique({ where: { id } }));
    if (!item) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => null)) as { content?: unknown } | null;
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    if (!content) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const generation = await withPrisma((prisma) =>
      prisma.postGeneration.create({
        data: { itemId: id, content, createdByEmployeeId: session.employeeId },
        include: { createdByEmployee: { select: { id: true, firstName: true, lastName: true } } },
      })
    );

    return NextResponse.json({ generation }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    throw error;
  }
}
