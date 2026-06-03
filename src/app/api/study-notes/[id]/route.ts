import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function ownerGuard(id: string, userId: string) {
  const note = await prisma.studyNote.findUnique({ where: { id } });
  if (!note || note.userId !== userId) return null;
  return note;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const note = await prisma.studyNote.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true } } },
  });

  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(note);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const note = await ownerGuard(id, session.user.id);
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { title, content } = await req.json();

  const updated = await prisma.studyNote.update({
    where: { id },
    data: {
      title: title ?? note.title,
      content: content ?? note.content,
    },
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
  const note = await ownerGuard(id, session.user.id);
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.studyNote.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
