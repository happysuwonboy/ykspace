import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const logs = await prisma.workLog.findMany({
    orderBy: { date: "desc" },
    include: { user: { select: { id: true, name: true } }, reactions: true },
  });

  return NextResponse.json(logs);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content } = await req.json();

  // 오늘 이미 작성한 업무일지가 있는지 확인
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const existing = await prisma.workLog.findFirst({
    where: {
      userId: session.user.id,
      createdAt: { gte: todayStart, lte: todayEnd },
    },
  });

  if (existing) {
    return NextResponse.json({ error: "TODAY_EXISTS", id: existing.id }, { status: 409 });
  }

  const firstLine = content?.split("\n")[0] ?? "";
  const title = firstLine.length > 40 ? firstLine.slice(0, 40) + "…" : firstLine || "업무일지";

  const log = await prisma.workLog.create({
    data: { title, content, userId: session.user.id },
    include: { user: { select: { id: true, name: true } } },
  });

  return NextResponse.json(log, { status: 201 });
}
