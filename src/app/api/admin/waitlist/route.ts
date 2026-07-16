import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!admin || (admin.role !== "admin" && admin.role !== "driver")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const entries = await prisma.waitlistEntry.findMany({
    where: { status: { in: ["waiting", "notified"] } },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(
    entries.map((e) => ({
      id: e.id,
      userName: e.user.name,
      userEmail: e.user.email,
      date: e.date.toISOString(),
      pickupTime: e.pickupTime,
      returnTime: e.returnTime,
      vehicleRequest: e.vehicleRequest,
      passengers: e.passengers,
      status: e.status,
      notifiedAt: e.notifiedAt ? e.notifiedAt.toISOString() : null,
      createdAt: e.createdAt.toISOString(),
    }))
  );
}
