import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // "yyyy-MM"

  const where = month
    ? { dateKey: { startsWith: month } }
    : {};

  const records = await prisma.attendance.findMany({
    where,
    include: { user: { select: { id: true, name: true } } },
    orderBy: { dateKey: "asc" },
  });

  return NextResponse.json(records);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dateKey = format(new Date(), "yyyy-MM-dd");

  const existing = await prisma.attendance.findUnique({
    where: { userId_dateKey: { userId: session.user.id, dateKey } },
  });

  if (existing) {
    return NextResponse.json({ error: "ALREADY_CLOCKED_IN", record: existing }, { status: 409 });
  }

  const record = await prisma.attendance.create({
    data: { userId: session.user.id, dateKey, clockIn: new Date() },
    include: { user: { select: { id: true, name: true } } },
  });

  return NextResponse.json(record, { status: 201 });
}
