import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireSuperuser, UnauthorizedError, ForbiddenError } from "@/lib/auth/requireSession";

/** Deletes a reference document. Superuser only; 404 if it doesn't exist under this topic. */
export async function DELETE(
  request: Request,
  { params }: RouteContext<"/api/posts/topics/[id]/documents/[documentId]">
) {
  try {
    await requireSuperuser();
    const { id, documentId } = await params;

    const existing = await withPrisma((prisma) => prisma.postDocument.findUnique({ where: { id: documentId } }));
    if (!existing || existing.topicId !== id) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    await withPrisma((prisma) => prisma.postDocument.delete({ where: { id: documentId } }));

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
