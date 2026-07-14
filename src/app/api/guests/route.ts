import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await prisma.membership.findUnique({
    where: { userId: session.user.id },
    include: { guests: true },
  });

  if (!membership) {
    return NextResponse.json({ error: "No active membership" }, { status: 400 });
  }

  const { name, phone, email } = await request.json();

  if (!name) {
    return NextResponse.json({ error: "Guest name is required" }, { status: 400 });
  }

  const guest = await prisma.membershipGuest.create({
    data: {
      membershipId: membership.id,
      name,
      phone: phone || null,
      email: email || null,
    },
  });

  return NextResponse.json(guest);
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await prisma.membership.findUnique({
    where: { userId: session.user.id },
  });

  if (!membership) {
    return NextResponse.json({ error: "No active membership" }, { status: 400 });
  }

  const { id } = await request.json();

  await prisma.membershipGuest.deleteMany({
    where: { id, membershipId: membership.id },
  });

  return NextResponse.json({ success: true });
}
