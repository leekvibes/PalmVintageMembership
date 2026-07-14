import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookingId, stars, comment } = await request.json();

  if (!bookingId || !stars || stars < 1 || stars > 5) {
    return NextResponse.json({ error: "Valid bookingId and stars (1-5) required" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.userId !== session.user.id) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.status !== "completed") {
    return NextResponse.json({ error: "Can only rate completed rides" }, { status: 400 });
  }

  const rating = await prisma.rating.upsert({
    where: { bookingId },
    update: { stars, comment: comment || null },
    create: { bookingId, userId: session.user.id, stars, comment: comment || null },
  });

  return NextResponse.json(rating);
}
