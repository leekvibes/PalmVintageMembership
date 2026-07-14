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

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      vehicle: { select: { name: true, type: true, color: true } },
      rating: true,
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (booking.userId !== session.user.id && user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const dateStr = booking.date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const vehicleName = booking.vehicle?.name || booking.vehicleAssigned
    ? (booking.vehicleAssigned === "rolls_royce" ? "Rolls-Royce" : "Cadillac Escalade")
    : "Unassigned";

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Trip Receipt — Palm Vintage</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, system-ui, sans-serif; background: #0a0e1a; color: #f5f0e8; padding: 40px 20px; }
    .receipt { max-width: 480px; margin: 0 auto; border: 1px solid rgba(245,240,232,0.1); }
    .header { padding: 32px 24px; border-bottom: 1px solid rgba(245,240,232,0.1); text-align: center; }
    .brand { color: #D4A017; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; font-family: monospace; }
    .title { font-size: 20px; font-weight: 300; margin-top: 8px; letter-spacing: -0.02em; }
    .body { padding: 24px; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(245,240,232,0.05); }
    .row:last-child { border-bottom: none; }
    .label { color: rgba(245,240,232,0.4); font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; }
    .value { font-size: 14px; text-align: right; }
    .status { display: inline-block; padding: 2px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; border: 1px solid; border-radius: 2px; }
    .status-completed { border-color: rgba(245,240,232,0.3); color: rgba(245,240,232,0.5); }
    .status-confirmed { border-color: rgba(74,222,128,0.5); color: rgb(74,222,128); }
    .status-pending { border-color: rgba(250,204,21,0.5); color: rgb(250,204,21); }
    .status-cancelled { border-color: rgba(248,113,113,0.5); color: rgb(248,113,113); }
    .footer { padding: 20px 24px; border-top: 1px solid rgba(245,240,232,0.1); text-align: center; }
    .footer p { color: rgba(245,240,232,0.3); font-size: 11px; }
    .stars { color: #D4A017; }
    .print-btn { display: block; margin: 24px auto 0; background: none; border: 1px solid rgba(212,160,23,0.5); color: #D4A017; padding: 10px 24px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.14em; cursor: pointer; }
    .print-btn:hover { background: rgba(212,160,23,0.1); }
    @media print { .print-btn { display: none; } body { background: white; color: #111; } .receipt { border-color: #ddd; } .row { border-color: #eee; } .label { color: #888; } .header { border-color: #ddd; } .footer { border-color: #ddd; } .footer p { color: #999; } .brand { color: #8B7D3C; } }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <p class="brand">Palm Vintage</p>
      <p class="title">Trip Receipt</p>
    </div>
    <div class="body">
      <div class="row"><span class="label">Member</span><span class="value">${booking.user.name}</span></div>
      <div class="row"><span class="label">Date</span><span class="value">${dateStr}</span></div>
      <div class="row"><span class="label">Pickup</span><span class="value">${booking.pickupTime}</span></div>
      ${booking.returnTime ? `<div class="row"><span class="label">Return</span><span class="value">${booking.returnTime}</span></div>` : ""}
      <div class="row"><span class="label">Pickup Address</span><span class="value" style="max-width:60%;text-align:right">${booking.pickupAddress}</span></div>
      ${booking.dropoffAddress ? `<div class="row"><span class="label">Drop-off</span><span class="value" style="max-width:60%;text-align:right">${booking.dropoffAddress}</span></div>` : ""}
      <div class="row"><span class="label">Vehicle</span><span class="value">${vehicleName}</span></div>
      <div class="row"><span class="label">Passengers</span><span class="value">${booking.passengers}</span></div>
      <div class="row"><span class="label">Status</span><span class="value"><span class="status status-${booking.status}">${booking.status}</span></span></div>
      ${booking.rating ? `<div class="row"><span class="label">Rating</span><span class="value stars">${"★".repeat(booking.rating.stars)}${"☆".repeat(5 - booking.rating.stars)}</span></div>` : ""}
      ${booking.rating?.comment ? `<div class="row"><span class="label">Comment</span><span class="value" style="max-width:60%;text-align:right;font-style:italic">"${booking.rating.comment}"</span></div>` : ""}
      <div class="row"><span class="label">Booking ID</span><span class="value" style="font-family:monospace;font-size:11px">${booking.id.slice(0, 12).toUpperCase()}</span></div>
      <div class="row"><span class="label">Booked On</span><span class="value">${booking.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></div>
    </div>
    <div class="footer">
      <p>Palm Vintage &middot; Philadelphia, PA</p>
    </div>
  </div>
  <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
