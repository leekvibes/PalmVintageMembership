import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const inspections = await prisma.vehicleInspection.findMany({
    where: { bookingId: id },
    include: { photos: { orderBy: { createdAt: "asc" } }, vehicle: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(inspections);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || (user.role !== "admin" && user.role !== "driver")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { type, vehicleId, notes, photos } = body;

  if (!type || !vehicleId || !photos?.length) {
    return NextResponse.json(
      { error: "type, vehicleId, and at least one photo are required" },
      { status: 400 }
    );
  }

  if (type !== "before" && type !== "after") {
    return NextResponse.json(
      { error: "type must be 'before' or 'after'" },
      { status: 400 }
    );
  }

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const inspection = await prisma.vehicleInspection.create({
    data: {
      bookingId: id,
      vehicleId,
      type,
      notes: notes || null,
      photos: {
        create: photos.map((p: { photoData: string; caption?: string }) => ({
          photoData: p.photoData,
          caption: p.caption || null,
        })),
      },
    },
    include: { photos: true },
  });

  return NextResponse.json(inspection);
}
