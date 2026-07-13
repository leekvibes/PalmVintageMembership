import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AdminDashboard } from "@/components/admin-dashboard";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user || user.role !== "admin") redirect("/dashboard");

  const [members, bookings, inquiries] = await Promise.all([
    prisma.user.findMany({
      where: { role: "member" },
      include: { membership: true, bookings: { orderBy: { date: "desc" }, take: 5 } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.booking.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { date: "desc" },
      take: 50,
    }),
    prisma.inquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <AdminDashboard
      members={members.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        phone: m.phone,
        photoUrl: m.photoUrl,
        createdAt: m.createdAt.toISOString(),
        membership: m.membership
          ? { program: m.membership.program, status: m.membership.status }
          : null,
        tripCount: m.bookings.filter((b) => b.status === "completed").length,
      }))}
      bookings={bookings.map((b) => ({
        id: b.id,
        userName: b.user.name,
        userEmail: b.user.email,
        date: b.date.toISOString(),
        pickupTime: b.pickupTime,
        pickupAddress: b.pickupAddress,
        dropoffAddress: b.dropoffAddress,
        vehicleRequest: b.vehicleRequest,
        vehicleAssigned: b.vehicleAssigned,
        status: b.status,
        passengers: b.passengers,
      }))}
      inquiries={inquiries.map((i) => ({
        id: i.id,
        name: i.name,
        email: i.email,
        phone: i.phone,
        program: i.program,
        message: i.message,
        status: i.status,
        createdAt: i.createdAt.toISOString(),
      }))}
    />
  );
}
