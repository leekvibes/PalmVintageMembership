import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendBookingNotification, sendBookingReceived } from "@/lib/email";

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
    const { date, pickupTime, returnTime, pickupAddress, dropoffAddress, vehicleRequest, passengers, notes, isRecurring, recurrenceRule, recurrenceEndDate } = body;

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

    const bookingData = {
      userId: session.user.id,
      date: new Date(date),
      pickupTime,
      returnTime: returnTime || null,
      pickupAddress,
      dropoffAddress,
      vehicleRequest: vehicleRequest || null,
      passengers: Number(passengers) || 1,
      notes: notes || null,
      isRecurring: !!isRecurring,
      recurrenceRule: recurrenceRule || null,
      recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : null,
    };

    const booking = await prisma.booking.create({ data: bookingData });

    if (isRecurring && recurrenceRule && recurrenceEndDate) {
      const childBookings = [];
      const startDate = new Date(date);
      const endDate = new Date(recurrenceEndDate);
      let cursor = new Date(startDate);

      const increment = recurrenceRule === "weekly" ? 7 : recurrenceRule === "biweekly" ? 14 : 0;

      if (increment > 0) {
        cursor.setDate(cursor.getDate() + increment);
        while (cursor <= endDate) {
          childBookings.push({
            userId: session.user.id,
            date: new Date(cursor),
            pickupTime,
            returnTime: returnTime || null,
            pickupAddress,
            dropoffAddress,
            vehicleRequest: vehicleRequest || null,
            passengers: Number(passengers) || 1,
            notes: notes || null,
            parentBookingId: booking.id,
          });
          cursor.setDate(cursor.getDate() + increment);
        }
      }

      if (childBookings.length > 0) {
        await prisma.booking.createMany({ data: childBookings });
      }
    }

    const emailData = {
      userName: session.user.name || "Member",
      date,
      pickupTime,
      returnTime: returnTime || null,
      pickupAddress,
      dropoffAddress,
      vehicleRequest,
      passengers: Number(passengers) || 1,
      notes: notes || null,
    };

    await Promise.all([
      sendBookingNotification(emailData).catch(console.error),
      sendBookingReceived(session.user.email!, emailData).catch(console.error),
    ]);

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
