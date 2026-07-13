"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { BookingForm } from "./booking-form";

interface DashboardProps {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    photoUrl: string | null;
  };
  membership: {
    program: string;
    status: string;
    startDate: string;
    guestPassesUsed: number;
    guests: { id: string; name: string; phone: string | null; email: string | null }[];
  } | null;
  bookings: {
    id: string;
    date: string;
    pickupTime: string;
    returnTime: string | null;
    pickupAddress: string;
    dropoffAddress: string | null;
    vehicleRequest: string | null;
    vehicleAssigned: string | null;
    status: string;
    passengers: number;
  }[];
  totalTrips: number;
  businessHours: { open: string; close: string };
}

export function DashboardClient({
  user,
  membership,
  bookings,
  totalTrips,
  businessHours,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "book" | "trips" | "account">("overview");

  const programLabel =
    membership?.program === "chauffeur"
      ? "Chauffeur Membership"
      : "Special Event Experience";

  const upcomingBookings = bookings.filter(
    (b) => b.status !== "cancelled" && b.status !== "completed"
  );

  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "book" as const, label: "Book a Ride" },
    { key: "trips" as const, label: "My Trips" },
    { key: "account" as const, label: "Account" },
  ];

  return (
    <div className="min-h-screen bg-navy-darkest text-cream">
      {/* Header */}
      <header className="border-b border-cream/10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {user.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover border border-gold/30"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-navy-deep border border-gold/30 flex items-center justify-center text-gold text-sm font-mono">
                {user.name.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-cream/40">{programLabel}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-xs text-cream/40 hover:text-cream/70 transition-colors uppercase tracking-wider"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="border-b border-cream/10 px-6">
        <div className="max-w-5xl mx-auto flex gap-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-4 text-sm uppercase tracking-[0.12em] border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "border-gold text-gold"
                  : "border-transparent text-cream/40 hover:text-cream/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        {activeTab === "overview" && (
          <div className="space-y-10">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Trips" value={String(totalTrips)} />
              <StatCard label="Status" value={membership?.status || "—"} />
              <StatCard
                label="Member Since"
                value={
                  membership
                    ? new Date(membership.startDate).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })
                    : "—"
                }
              />
              <StatCard
                label="Upcoming"
                value={String(upcomingBookings.length)}
              />
            </div>

            {/* Upcoming bookings */}
            <div>
              <h2 className="text-lg font-light mb-4">Upcoming Rides</h2>
              {upcomingBookings.length === 0 ? (
                <p className="text-cream/40 text-sm">
                  No upcoming rides.{" "}
                  <button
                    onClick={() => setActiveTab("book")}
                    className="text-gold hover:text-gold-bright"
                  >
                    Book one now.
                  </button>
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingBookings.slice(0, 5).map((b) => (
                    <BookingCard key={b.id} booking={b} />
                  ))}
                </div>
              )}
            </div>

            {/* Guests */}
            {membership && membership.guests.length > 0 && (
              <div>
                <h2 className="text-lg font-light mb-4">Your Guests</h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {membership.guests.map((g) => (
                    <div
                      key={g.id}
                      className="bg-cream/5 border border-cream/10 p-4 flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-navy-deep border border-cream/10 flex items-center justify-center text-cream/50 text-xs font-mono">
                        {g.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm">{g.name}</p>
                        <p className="text-xs text-cream/40">{g.email || g.phone || ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "book" && (
          <BookingForm businessHours={businessHours} />
        )}

        {activeTab === "trips" && (
          <div>
            <h2 className="text-lg font-light mb-6">All Trips</h2>
            {bookings.length === 0 ? (
              <p className="text-cream/40 text-sm">No trips yet.</p>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => (
                  <BookingCard key={b.id} booking={b} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "account" && (
          <div className="max-w-lg space-y-8">
            <div className="flex items-center gap-6">
              {user.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt={user.name}
                  className="w-20 h-20 rounded-full object-cover border border-gold/30"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-navy-deep border border-gold/30 flex items-center justify-center text-gold text-2xl font-mono">
                  {user.name.charAt(0)}
                </div>
              )}
              <div>
                <h2 className="text-xl font-light">{user.name}</h2>
                <p className="text-cream/50 text-sm">{user.email}</p>
                {user.phone && (
                  <p className="text-cream/50 text-sm">{user.phone}</p>
                )}
              </div>
            </div>

            {membership && (
              <div className="bg-cream/5 border border-cream/10 p-6 space-y-3">
                <h3 className="text-sm uppercase tracking-[0.12em] text-gold/70 mb-3">
                  Membership Details
                </h3>
                <Row label="Program" value={programLabel} />
                <Row label="Status" value={membership.status} />
                <Row
                  label="Start Date"
                  value={new Date(membership.startDate).toLocaleDateString()}
                />
                <Row
                  label="Guest Passes Used"
                  value={`${membership.guestPassesUsed} this term`}
                />
                <Row
                  label="Members on Account"
                  value={String(membership.guests.length + 1)}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-cream/5 border border-cream/10 p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-cream/40 mb-1">
        {label}
      </p>
      <p className="text-xl font-light capitalize">{value}</p>
    </div>
  );
}

function BookingCard({
  booking,
}: {
  booking: {
    id: string;
    date: string;
    pickupTime: string;
    pickupAddress: string;
    vehicleAssigned: string | null;
    status: string;
  };
}) {
  const statusColors: Record<string, string> = {
    pending: "text-yellow-400",
    confirmed: "text-green-400",
    completed: "text-cream/40",
    cancelled: "text-red-400",
  };

  return (
    <div className="bg-cream/5 border border-cream/10 p-4 flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          {new Date(booking.date).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}{" "}
          at {booking.pickupTime}
        </p>
        <p className="text-xs text-cream/40 truncate">
          {booking.pickupAddress}
        </p>
      </div>
      <div className="text-right">
        <p className={`text-xs uppercase tracking-wider ${statusColors[booking.status] || "text-cream/40"}`}>
          {booking.status}
        </p>
        {booking.vehicleAssigned && (
          <p className="text-xs text-cream/30 mt-0.5">
            {booking.vehicleAssigned === "rolls_royce" ? "Rolls-Royce" : "Escalade"}
          </p>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-cream/50">{label}</span>
      <span className="capitalize">{value}</span>
    </div>
  );
}
