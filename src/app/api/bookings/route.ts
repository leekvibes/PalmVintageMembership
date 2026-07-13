import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendBookingNotification } from "@/lib/email";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { date, pickupTime, returnTime, pickupAddress, dropoffAddress, vehicleRequest, passengers, notes } = body;

    if (!date || !pickupTime || !pickupAddress || !dropoffAddress) {
      return NextResponse.json(
        { error: "Date, pickup time, pickup address, and drop-off address are required" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.create({
      data: {
        userId: session.user.id,
        date: new Date(date),
        pickupTime,
        returnTime: returnTime || null,
        pickupAddress,
        dropoffAddress,
        vehicleRequest: vehicleRequest || null,
        passengers: Number(passengers) || 1,
        notes: notes || null,
      },
    });

    await sendBookingNotification({
      userName: session.user.name || "Member",
      date,
      pickupTime,
      pickupAddress,
      dropoffAddress,
      vehicleRequest,
    }).catch(console.error);

    return NextResponse.json({ success: true, id: booking.id });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(bookings);
}
