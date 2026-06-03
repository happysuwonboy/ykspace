import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const meetings = await prisma.meeting.findMany({
    orderBy: { date: "desc" },
    include: {
      participants: { include: { user: { select: { id: true, name: true } } } },
      actionItems: true,
    },
  });

  return NextResponse.json(meetings);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, date, agenda, notes, actionItems, participantIds } = await req.json();

  const allUserIds: string[] = participantIds ?? [];
  if (!allUserIds.includes(session.user.id)) allUserIds.push(session.user.id);

  const meeting = await prisma.meeting.create({
    data: {
      title,
      date: new Date(date),
      agenda,
      notes,
      participants: { create: allUserIds.map((uid: string) => ({ userId: uid })) },
      actionItems: {
        create: (actionItems ?? []).map((content: string) => ({ content })),
      },
    },
    include: {
      participants: { include: { user: { select: { id: true, name: true } } } },
      actionItems: true,
    },
  });

  return NextResponse.json(meeting, { status: 201 });
}
