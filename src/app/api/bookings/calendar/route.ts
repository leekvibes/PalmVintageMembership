import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // format: 2026-07

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "month param required (YYYY-MM)" }, { status: 400 });
  }

  const [year, mon] = month.split("-").map(Number);
  const startDate = new Date(Date.UTC(year, mon - 1, 1, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, mon, 0, 23, 59, 59, 999));

  const [bookings, vehicles] = await Promise.all([
    prisma.booking.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        status: { notIn: ["cancelled"] },
      },
      select: { date: true, vehicleRequest: true, vehicleAssigned: true, vehicleId: true },
    }),
    prisma.vehicle.findMany({ select: { id: true } }),
  ]);

  const totalVehicles = vehicles.length || 1;
  const daysInMonth = endDate.getUTCDate();

  const days: { date: string; status: "open" | "partial" | "full" }[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${month}-${String(d).padStart(2, "0")}`;
    const dayBookings = bookings.filter((b) => b.date.getUTCDate() === d);

    const bookedVehicleIds = new Set<string>();
    for (const b of dayBookings) {
      if (b.vehicleId) bookedVehicleIds.add(b.vehicleId);
      else if (b.vehicleAssigned) bookedVehicleIds.add(b.vehicleAssigned);
      else if (b.vehicleRequest) bookedVehicleIds.add(b.vehicleRequest);
    }

    const bookedCount = bookedVehicleIds.size;

    let status: "open" | "partial" | "full";
    if (bookedCount === 0) status = "open";
    else if (bookedCount >= totalVehicles) status = "full";
    else status = "partial";

    days.push({ date: dateStr, status });
  }

  return NextResponse.json({ month, totalVehicles, days });
}
