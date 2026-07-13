import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendBookingNotification } from "@/lib/email";

const BUFFER_HOURS = 1;

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

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

    if (vehicleRequest) {
      const vehicle = await prisma.vehicle.findFirst({
        where: { type: vehicleRequest },
      });

      if (vehicle) {
        const dayStart = new Date(date);
        dayStart.setUTCHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setUTCHours(23, 59, 59, 999);

        const dayBookings = await prisma.booking.findMany({
          where: {
            date: { gte: dayStart, lte: dayEnd },
            status: { in: ["pending", "confirmed"] },
            OR: [
              { vehicleAssigned: vehicleRequest },
              { vehicleId: vehicle.id },
              { vehicleRequest: vehicleRequest },
            ],
          },
        });

        const requestedStart = timeToMinutes(pickupTime);
        const requestedEnd = returnTime
          ? timeToMinutes(returnTime)
          : requestedStart + 120;

        const conflict = dayBookings.some((b) => {
          const bStart = timeToMinutes(b.pickupTime);
          const bEnd = b.returnTime
            ? timeToMinutes(b.returnTime) + BUFFER_HOURS * 60
            : bStart + 120 + BUFFER_HOURS * 60;

          return requestedStart < bEnd && requestedEnd + BUFFER_HOURS * 60 > bStart;
        });

        if (conflict) {
          const vehicleName = vehicleRequest === "rolls_royce" ? "Rolls-Royce" : "Escalade";
          return NextResponse.json(
            { error: `The ${vehicleName} is not available at that time. Please choose a different time or vehicle.` },
            { status: 409 }
          );
        }
      }
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
