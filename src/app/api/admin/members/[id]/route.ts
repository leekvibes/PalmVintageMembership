import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      membership: { include: { guests: true } },
      bookings: { orderBy: { date: "desc" } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    photoUrl: user.photoUrl,
    role: user.role,
    passwordHash: user.passwordHash,
    createdAt: user.createdAt.toISOString(),
    membership: user.membership
      ? {
          id: user.membership.id,
          program: user.membership.program,
          status: user.membership.status,
          startDate: user.membership.startDate.toISOString(),
          endDate: user.membership.endDate?.toISOString() || null,
          guestPassesUsed: user.membership.guestPassesUsed,
          notes: user.membership.notes,
          guests: user.membership.guests,
        }
      : null,
    bookings: user.bookings.map((b) => ({
      id: b.id,
      date: b.date.toISOString(),
      pickupTime: b.pickupTime,
      pickupAddress: b.pickupAddress,
      dropoffAddress: b.dropoffAddress,
      vehicleAssigned: b.vehicleAssigned,
      status: b.status,
      passengers: b.passengers,
    })),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name, email, phone, photoUrl, password, program, membershipStatus } = body;

  const userData: Record<string, unknown> = {};
  if (name !== undefined) userData.name = name;
  if (email !== undefined) userData.email = email;
  if (phone !== undefined) userData.phone = phone || null;
  if (photoUrl !== undefined) userData.photoUrl = photoUrl || null;
  if (password) userData.passwordHash = await hash(password, 12);

  if (Object.keys(userData).length > 0) {
    await prisma.user.update({ where: { id }, data: userData });
  }

  if (program || membershipStatus) {
    const membershipData: Record<string, unknown> = {};
    if (program) membershipData.program = program;
    if (membershipStatus) membershipData.status = membershipStatus;

    await prisma.membership.updateMany({
      where: { userId: id },
      data: membershipData,
    });
  }

  return NextResponse.json({ success: true });
}
