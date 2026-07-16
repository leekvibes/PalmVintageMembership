import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notifyWaitlistForFreedSlot } from "@/lib/waitlist";

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

  const wasReserved = booking.status === "confirmed" || booking.status === "in_progress";

  await prisma.booking.update({
    where: { id },
    data: { status: "cancelled" },
  });

  // Cancelling a reserved slot may open it up for waitlisted members.
  if (wasReserved) {
    notifyWaitlistForFreedSlot({
      date: booking.date,
      pickupTime: booking.pickupTime,
      returnTime: booking.returnTime,
      vehicle: booking.vehicleAssigned || booking.vehicleRequest,
    }).catch((err) => console.error("[waitlist] notify failed:", err));
  }

  return NextResponse.json({ success: true });
}
