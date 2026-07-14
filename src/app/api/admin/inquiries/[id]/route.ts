import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status, convertedUserId } = body;

  const data: Record<string, unknown> = {};
  if (status) data.status = status;
  if (convertedUserId) {
    data.convertedUserId = convertedUserId;
    data.convertedAt = new Date();
    data.status = "converted";
  }

  await prisma.inquiry.update({ where: { id }, data });

  return NextResponse.json({ success: true });
}
