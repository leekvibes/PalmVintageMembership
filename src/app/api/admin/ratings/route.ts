import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ratings = await prisma.rating.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true, photoUrl: true } },
      booking: { select: { date: true, pickupTime: true, vehicleAssigned: true } },
    },
  });

  return NextResponse.json(ratings.map((r) => ({
    id: r.id,
    stars: r.stars,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
    memberName: r.user.name,
    memberEmail: r.user.email,
    memberPhoto: r.user.photoUrl,
    bookingDate: r.booking.date.toISOString(),
    bookingTime: r.booking.pickupTime,
    vehicle: r.booking.vehicleAssigned,
  })));
}
