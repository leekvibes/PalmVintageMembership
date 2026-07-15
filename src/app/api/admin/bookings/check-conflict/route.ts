import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkVehicleConflict } from "@/lib/scheduling";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!admin || (admin.role !== "admin" && admin.role !== "driver")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { bookingId } = await request.json();

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const results: Record<string, Awaited<ReturnType<typeof checkVehicleConflict>>> = {};

  for (const vehicleType of ["rolls_royce", "escalade"]) {
    results[vehicleType] = await checkVehicleConflict(
      booking.date,
      booking.pickupTime,
      booking.returnTime,
      vehicleType,
      bookingId
    );
  }

  return NextResponse.json({
    vehicleAvailability: {
      rolls_royce: results.rolls_royce.vehicleAvailability.rolls_royce,
      escalade: results.escalade.vehicleAvailability.escalade,
    },
  });
}
