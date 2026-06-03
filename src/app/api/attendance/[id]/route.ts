import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const record = await prisma.attendance.findUnique({ where: { id } });

  if (!record || record.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (record.clockOut) {
    return NextResponse.json({ error: "ALREADY_CLOCKED_OUT", record }, { status: 409 });
  }

  const updated = await prisma.attendance.update({
    where: { id },
    data: { clockOut: new Date() },
    include: { user: { select: { id: true, name: true } } },
  });

  return NextResponse.json(updated);
}
