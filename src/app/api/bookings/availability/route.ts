import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const BUFFER_HOURS = 1;

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const pickupTime = searchParams.get("pickupTime");
  const returnTime = searchParams.get("returnTime");
  const vehicleType = searchParams.get("vehicleType");

  if (!date || !pickupTime) {
    return NextResponse.json(
      { error: "date and pickupTime are required" },
      { status: 400 }
    );
  }

  const vehicles = await prisma.vehicle.findMany({
    where: vehicleType ? { type: vehicleType } : undefined,
  });

  const dayStart = new Date(date);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setUTCHours(23, 59, 59, 999);

  const dayBookings = await prisma.booking.findMany({
    where: {
      date: { gte: dayStart, lte: dayEnd },
      status: { in: ["pending", "confirmed"] },
    },
  });

  function timeToMinutes(t: string): number {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }

  const requestedStart = timeToMinutes(pickupTime);
  const requestedEnd = returnTime
    ? timeToMinutes(returnTime)
    : requestedStart + 120;

  const availability = vehicles.map((v) => {
    const vehicleBookings = dayBookings.filter(
      (b) =>
        b.vehicleAssigned === v.type ||
        b.vehicleId === v.id ||
        b.vehicleRequest === v.type
    );

    const conflict = vehicleBookings.some((b) => {
      const bStart = timeToMinutes(b.pickupTime);
      const bEnd = b.returnTime
        ? timeToMinutes(b.returnTime) + BUFFER_HOURS * 60
        : bStart + 120 + BUFFER_HOURS * 60;

      return requestedStart < bEnd && requestedEnd + BUFFER_HOURS * 60 > bStart;
    });

    return {
      vehicleId: v.id,
      vehicleType: v.type,
      vehicleName: v.name,
      available: !conflict,
    };
  });

  return NextResponse.json({ availability });
}
