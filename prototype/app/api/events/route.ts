import { NextRequest, NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireEmployee, requireSuperuser, UnauthorizedError, ForbiddenError } from "@/lib/auth/requireSession";

export async function GET(request: NextRequest) {
  try {
    await requireEmployee();

    const { searchParams } = request.nextUrl;
    const startAtFrom = searchParams.get("startAtFrom");
    const startAtTo = searchParams.get("startAtTo");

    const events = await withPrisma((prisma) =>
      prisma.galleryEvent.findMany({
        where: {
          ...((startAtFrom || startAtTo) && {
            // An event only needs to overlap the requested window, so filter
            // on endAt/startAt from opposite ends rather than startAt alone.
            ...(startAtTo && { startAt: { lte: new Date(startAtTo) } }),
            ...(startAtFrom && { endAt: { gte: new Date(startAtFrom) } }),
          }),
        },
        orderBy: { startAt: "asc" },
        include: { workplace: { select: { label: true, color: true } } },
      })
    );

    return NextResponse.json({ events });
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
      description?: unknown;
      startAt?: unknown;
      endAt?: unknown;
      workplaceId?: unknown;
    } | null;

    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const description = typeof body?.description === "string" ? body.description.trim() || null : null;
    const startAt = typeof body?.startAt === "string" ? new Date(body.startAt) : null;
    const endAt = typeof body?.endAt === "string" ? new Date(body.endAt) : null;
    const workplaceId = typeof body?.workplaceId === "string" && body.workplaceId ? body.workplaceId : null;

    if (
      !title ||
      !startAt ||
      !endAt ||
      Number.isNaN(startAt.getTime()) ||
      Number.isNaN(endAt.getTime())
    ) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    if (endAt <= startAt) {
      return NextResponse.json({ error: "end_before_start" }, { status: 400 });
    }

    const event = await withPrisma((prisma) =>
      prisma.galleryEvent.create({
        data: { title, description, startAt, endAt, workplaceId },
        include: { workplace: { select: { label: true, color: true } } },
      })
    );

    return NextResponse.json({ event }, { status: 201 });
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
