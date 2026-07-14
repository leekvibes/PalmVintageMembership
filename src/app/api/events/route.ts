import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const events = await prisma.event.findMany({
    where: { date: { gte: new Date() } },
    orderBy: { date: "asc" },
    include: {
      rsvps: {
        where: { userId: session.user.id },
        select: { status: true },
      },
      _count: { select: { rsvps: { where: { status: "attending" } } } },
    },
  });

  return NextResponse.json(events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    date: e.date.toISOString(),
    endDate: e.endDate?.toISOString() || null,
    location: e.location,
    capacity: e.capacity,
    rsvpCount: e._count.rsvps,
    myRsvp: e.rsvps[0]?.status || null,
  })));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId, status } = await request.json();

  if (!eventId) {
    return NextResponse.json({ error: "Event ID required" }, { status: 400 });
  }

  const rsvpStatus = status || "attending";

  const rsvp = await prisma.eventRsvp.upsert({
    where: { eventId_userId: { eventId, userId: session.user.id } },
    update: { status: rsvpStatus },
    create: { eventId, userId: session.user.id, status: rsvpStatus },
  });

  return NextResponse.json(rsvp);
}
