import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendBookingNotification, sendBookingReceived } from "@/lib/email";
import { checkVehicleConflict } from "@/lib/scheduling";

const vehicleName = (v: string) =>
  v === "rolls_royce" ? "Rolls-Royce" : v === "escalade" ? "Cadillac Escalade" : v;

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

    // If the member picked a specific vehicle, block the request when that
    // vehicle is already spoken for at this time (pending or confirmed). Uses
    // the shared engine so buffer + cross-midnight handling stays consistent
    // with the admin-side hard block.
    if (vehicleRequest) {
      const result = await checkVehicleConflict(
        new Date(date),
        pickupTime,
        returnTime || null,
        vehicleRequest,
        undefined,
        { includePending: true }
      );

      if (result.hasConflict) {
        return NextResponse.json(
          {
            error: `The ${vehicleName(vehicleRequest)} is not available at that time. Join the waitlist and we'll notify you if it opens up, or pick a different time.`,
            conflict: true,
            vehicleRequest,
            availableVehicles: result.availableVehicles,
          },
          { status: 409 }
        );
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
