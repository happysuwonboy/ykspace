import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function ownerGuard(id: string, userId: string) {
  const log = await prisma.workLog.findUnique({ where: { id } });
  if (!log || log.userId !== userId) return null;
  return log;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const log = await ownerGuard(id, session.user.id);
  if (!log) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { content } = await req.json();
  const firstLine = content?.split("\n")[0] ?? "";
  const title = firstLine.length > 40 ? firstLine.slice(0, 40) + "…" : firstLine || "업무일지";

  const updated = await prisma.workLog.update({
    where: { id },
    data: { content, title },
    include: { user: { select: { id: true, name: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const log = await ownerGuard(id, session.user.id);
  if (!log) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.workLog.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
