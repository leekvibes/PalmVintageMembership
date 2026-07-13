import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { BUSINESS } from "@/lib/config";
import { DashboardClient } from "@/components/dashboard-client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      membership: { include: { guests: true } },
      bookings: { orderBy: { date: "desc" }, take: 20 },
    },
  });

  if (!user) redirect("/login");

  if (user.role === "admin" || user.role === "driver") redirect("/admin");

  const totalTrips = user.bookings.filter(
    (b) => b.status === "completed"
  ).length;

  return (
    <DashboardClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        photoUrl: user.photoUrl,
      }}
      membership={
        user.membership
          ? {
              program: user.membership.program,
              status: user.membership.status,
              startDate: user.membership.startDate.toISOString(),
              guestPassesUsed: user.membership.guestPassesUsed,
              guests: user.membership.guests.map((g) => ({
                id: g.id,
                name: g.name,
                phone: g.phone,
                email: g.email,
              })),
            }
          : null
      }
      bookings={user.bookings.map((b) => ({
        id: b.id,
        date: b.date.toISOString(),
        pickupTime: b.pickupTime,
        returnTime: b.returnTime,
        pickupAddress: b.pickupAddress,
        dropoffAddress: b.dropoffAddress,
        vehicleRequest: b.vehicleRequest,
        vehicleAssigned: b.vehicleAssigned,
        status: b.status,
        passengers: b.passengers,
      }))}
      totalTrips={totalTrips}
      businessHours={BUSINESS.hours}
    />
  );
}
