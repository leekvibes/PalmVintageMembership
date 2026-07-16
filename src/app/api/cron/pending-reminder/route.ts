import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendPendingReminder } from "@/lib/email";
import { BUSINESS } from "@/lib/config";

// A booking must sit in "pending" this long before it earns a reminder.
const STALE_AFTER_HOURS = 3;

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runReminder();
}

// Vercel Cron issues GET requests; accept both and authorize the same way.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runReminder();
}

async function runReminder() {
  const now = Date.now();
  const cutoff = new Date(now - STALE_AFTER_HOURS * 60 * 60 * 1000);

  // Pending long enough, and never reminded before (anti-spam: one nudge each).
  const stale = await prisma.booking.findMany({
    where: {
      status: "pending",
      createdAt: { lte: cutoff },
      adminReminderSentAt: null,
    },
    include: { user: { select: { name: true } } },
    orderBy: { date: "asc" },
  });

  if (stale.length === 0) {
    return NextResponse.json({ sent: false, reminded: 0 });
  }

  await sendPendingReminder(
    BUSINESS.inquiryEmail,
    stale.map((b) => ({
      userName: b.user.name,
      date: b.date.toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" }),
      pickupTime: b.pickupTime,
      returnTime: b.returnTime,
      vehicleRequest: b.vehicleRequest,
      hoursWaiting: Math.floor((now - b.createdAt.getTime()) / (60 * 60 * 1000)),
    }))
  );

  // Mark each so it never triggers a second reminder.
  await prisma.booking.updateMany({
    where: { id: { in: stale.map((b) => b.id) } },
    data: { adminReminderSentAt: new Date() },
  });

  return NextResponse.json({ sent: true, reminded: stale.length });
}
