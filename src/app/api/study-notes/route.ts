import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notes = await prisma.studyNote.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true } }, reactions: true },
  });

  return NextResponse.json(notes);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, content } = await req.json();

  const note = await prisma.studyNote.create({
    data: { title, content, userId: session.user.id },
    include: { user: { select: { id: true, name: true } } },
  });

  return NextResponse.json(note, { status: 201 });
}
