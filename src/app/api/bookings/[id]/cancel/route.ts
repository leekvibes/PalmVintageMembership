import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (booking.status === "cancelled" || booking.status === "completed") {
    return NextResponse.json(
      { error: "Cannot cancel a booking that is already " + booking.status },
      { status: 400 }
    );
  }

  await prisma.booking.update({
    where: { id },
    data: { status: "cancelled" },
  });

  return NextResponse.json({ success: true });
}
