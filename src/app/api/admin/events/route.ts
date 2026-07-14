import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const events = await prisma.event.findMany({
    orderBy: { date: "desc" },
    include: { rsvps: { include: { user: { select: { name: true, email: true } } } } },
  });

  return NextResponse.json(events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    date: e.date.toISOString(),
    endDate: e.endDate?.toISOString() || null,
    location: e.location,
    capacity: e.capacity,
    rsvpCount: e.rsvps.filter((r) => r.status === "attending").length,
    rsvps: e.rsvps.map((r) => ({
      id: r.id,
      userName: r.user.name,
      userEmail: r.user.email,
      status: r.status,
    })),
  })));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, description, date, endDate, location, capacity } = await request.json();

  if (!title || !date) {
    return NextResponse.json({ error: "Title and date are required" }, { status: 400 });
  }

  const event = await prisma.event.create({
    data: {
      title,
      description: description || null,
      date: new Date(date),
      endDate: endDate ? new Date(endDate) : null,
      location: location || null,
      capacity: capacity ? parseInt(capacity) : null,
    },
  });

  return NextResponse.json(event);
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, title, description, date, endDate, location, capacity } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description || null;
  if (date !== undefined) data.date = new Date(date);
  if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
  if (location !== undefined) data.location = location || null;
  if (capacity !== undefined) data.capacity = capacity ? parseInt(capacity) : null;

  const event = await prisma.event.update({ where: { id }, data });

  return NextResponse.json(event);
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await request.json();
  await prisma.event.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
