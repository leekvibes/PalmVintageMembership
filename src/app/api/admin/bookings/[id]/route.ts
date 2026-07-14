import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendBookingConfirmed, sendRideStarting, sendRatingRequest } from "@/lib/email";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!admin || (admin.role !== "admin" && admin.role !== "driver")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status, vehicleAssigned } = body;

  const data: Record<string, string> = {};
  if (status) data.status = status;
  if (vehicleAssigned) data.vehicleAssigned = vehicleAssigned;

  const booking = await prisma.booking.update({
    where: { id },
    data,
    include: { user: { select: { email: true, name: true } } },
  });

  if (status === "confirmed") {
    sendBookingConfirmed(booking.user.email, {
      userName: booking.user.name,
      date: booking.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
      pickupTime: booking.pickupTime,
      returnTime: booking.returnTime,
      pickupAddress: booking.pickupAddress,
      dropoffAddress: booking.dropoffAddress,
      vehicleAssigned: booking.vehicleAssigned,
    }).catch((err) => console.error("[email] Failed to send booking confirmed:", err));
  }

  if (status === "in_progress") {
    sendRideStarting(booking.user.email, {
      userName: booking.user.name,
      date: booking.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
      pickupTime: booking.pickupTime,
      vehicleAssigned: booking.vehicleAssigned,
    }).catch((err) => console.error("[email] Failed to send ride starting:", err));
  }

  if (status === "completed") {
    sendRatingRequest(booking.user.email, {
      userName: booking.user.name,
      bookingId: booking.id,
      date: booking.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
    }).catch((err) => console.error("[email] Failed to send rating request:", err));
  }

  return NextResponse.json({ success: true });
}
