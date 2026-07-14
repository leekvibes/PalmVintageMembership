import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pref = await prisma.ridePreference.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json(pref);
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { vehicleRequest, passengers, notes } = await request.json();

  const pref = await prisma.ridePreference.upsert({
    where: { userId: session.user.id },
    update: { vehicleRequest: vehicleRequest || null, passengers: passengers || 1, notes: notes || null },
    create: { userId: session.user.id, vehicleRequest: vehicleRequest || null, passengers: passengers || 1, notes: notes || null },
  });

  return NextResponse.json(pref);
}
