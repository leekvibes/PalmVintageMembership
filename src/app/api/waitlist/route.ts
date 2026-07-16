import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { date, pickupTime, returnTime, vehicleRequest, pickupAddress, dropoffAddress, passengers, notes } = body;

    if (!date || !pickupTime) {
      return NextResponse.json({ error: "Date and pickup time are required" }, { status: 400 });
    }

    // Avoid duplicate waiting entries for the same slot + vehicle.
    const dayStart = new Date(date);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const existing = await prisma.waitlistEntry.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["waiting", "notified"] },
        date: { gte: dayStart, lte: dayEnd },
        pickupTime,
        vehicleRequest: vehicleRequest || null,
      },
    });

    if (existing) {
      return NextResponse.json({ success: true, id: existing.id, alreadyOnList: true });
    }

    const entry = await prisma.waitlistEntry.create({
      data: {
        userId: session.user.id,
        date: new Date(date),
        pickupTime,
        returnTime: returnTime || null,
        vehicleRequest: vehicleRequest || null,
        pickupAddress: pickupAddress || null,
        dropoffAddress: dropoffAddress || null,
        passengers: Number(passengers) || 1,
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true, id: entry.id });
  } catch (error) {
    console.error("Waitlist error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = await prisma.waitlistEntry.findMany({
    where: {
      userId: session.user.id,
      status: { in: ["waiting", "notified"] },
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(entries);
}
