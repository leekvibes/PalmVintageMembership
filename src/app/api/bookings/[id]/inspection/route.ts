import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking || booking.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const inspections = await prisma.vehicleInspection.findMany({
    where: { bookingId: id },
    include: { photos: { orderBy: { createdAt: "asc" } }, vehicle: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(inspections);
}
