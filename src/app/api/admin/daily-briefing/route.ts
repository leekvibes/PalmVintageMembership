import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendDailyBriefing } from "@/lib/email";
import { BUSINESS } from "@/lib/config";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const dayStart = new Date(today);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(today);
  dayEnd.setUTCHours(23, 59, 59, 999);

  const bookings = await prisma.booking.findMany({
    where: {
      date: { gte: dayStart, lte: dayEnd },
      status: { in: ["pending", "confirmed", "in_progress"] },
    },
    include: { user: { select: { name: true } } },
    orderBy: { pickupTime: "asc" },
  });

  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  await sendDailyBriefing(BUSINESS.inquiryEmail, {
    date: dateStr,
    bookings: bookings.map((b) => ({
      userName: b.user.name,
      pickupTime: b.pickupTime,
      returnTime: b.returnTime,
      pickupAddress: b.pickupAddress,
      dropoffAddress: b.dropoffAddress,
      vehicleAssigned: b.vehicleAssigned,
      status: b.status,
      passengers: b.passengers,
      notes: b.notes,
    })),
  });

  return NextResponse.json({ sent: true, bookings: bookings.length });
}
