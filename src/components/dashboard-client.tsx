"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { BookingForm } from "./booking-form";

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

interface DashboardProps {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    photoUrl: string | null;
    birthday: string | null;
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
    rating: { stars: number; comment: string | null } | null;
  }[];
  totalTrips: number;
  businessHours: { open: string; close: string };
  savedAddresses?: { id: string; label: string; address: string }[];
  ridePreference?: { vehicleRequest: string | null; passengers: number; notes: string | null } | null;
}

interface InspectionPhoto {
  id: string;
  photoData: string;
  caption: string | null;
  createdAt: string;
}

interface Inspection {
  id: string;
  type: string;
  notes: string | null;
  createdAt: string;
  vehicle: { name: string; type: string };
  photos: InspectionPhoto[];
}

export function DashboardClient({
  user,
  membership,
  bookings,
  totalTrips,
  businessHours,
  savedAddresses,
  ridePreference,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "book" | "trips" | "events" | "account">("overview");
  const [rescheduleBooking, setRescheduleBooking] = useState<DashboardProps["bookings"][0] | null>(null);

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
    { key: "events" as const, label: "Events" },
    { key: "account" as const, label: "Account" },
  ];

  return (
    <div className="min-h-screen bg-navy-darkest text-cream">
      {/* Header */}
      <header className="border-b border-cream/10 px-4 sm:px-6 py-4 sm:py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-5">
            {user.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={user.name}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-gold/40 shadow-lg shadow-gold/5"
              />
            ) : (
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-navy-deep border-2 border-gold/40 flex items-center justify-center text-gold text-lg sm:text-xl font-mono shadow-lg shadow-gold/5">
                {user.name.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-sm sm:text-base font-medium">{user.name}</p>
              <p className="text-[10px] sm:text-xs text-cream/40">{programLabel}</p>
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
      <nav className="border-b border-cream/10 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex gap-4 sm:gap-8 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-3 sm:py-4 text-xs sm:text-sm uppercase tracking-[0.12em] border-b-2 transition-colors whitespace-nowrap ${
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
            {/* Welcome banner */}
            <div className="flex items-center gap-6 bg-cream/5 border border-cream/10 p-6">
              {user.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt={user.name}
                  className="w-24 h-24 rounded-full object-cover border-2 border-gold/40 shadow-lg shadow-gold/5"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-navy-deep border-2 border-gold/40 flex items-center justify-center text-gold text-3xl font-mono shadow-lg shadow-gold/5">
                  {user.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-cream/40 mb-1">Welcome back</p>
                <h1 className="text-2xl font-light tracking-tight">{user.name}</h1>
                <p className="text-sm text-gold/70 mt-1">{programLabel}</p>
              </div>
            </div>

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

            {/* Monthly Usage Summary */}
            <MonthlyUsageSummary bookings={bookings} />

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
          <div>
            {rescheduleBooking && (
              <div className="bg-gold/10 border border-gold/30 p-4 mb-6 flex items-center justify-between">
                <p className="text-sm text-gold">
                  Rescheduling ride from{" "}
                  {new Date(rescheduleBooking.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  {" "}at {formatTime(rescheduleBooking.pickupTime)}. Choose a new date and time below.
                </p>
                <button onClick={() => setRescheduleBooking(null)} className="text-xs text-cream/40 hover:text-cream/70 ml-4">
                  &times;
                </button>
              </div>
            )}
            <BookingForm
              businessHours={businessHours}
              prefill={rescheduleBooking ? {
                pickupAddress: rescheduleBooking.pickupAddress,
                dropoffAddress: rescheduleBooking.dropoffAddress || "",
                vehicleRequest: rescheduleBooking.vehicleRequest || "",
                passengers: rescheduleBooking.passengers,
              } : undefined}
              savedAddresses={savedAddresses}
              ridePreference={ridePreference}
            />
          </div>
        )}

        {activeTab === "trips" && (
          <TripsTab
            bookings={bookings}
            onReschedule={async (booking) => {
              await fetch(`/api/bookings/${booking.id}/cancel`, { method: "POST" });
              setRescheduleBooking(booking);
              setActiveTab("book");
            }}
          />
        )}

        {activeTab === "events" && <EventsTab />}

        {activeTab === "account" && (
          <AccountTab user={user} membership={membership} programLabel={programLabel} ridePreference={ridePreference} />
        )}
      </div>
    </div>
  );
}

/* ─── Account Tab ─── */
function AccountTab({
  user,
  membership,
  programLabel,
  ridePreference,
}: {
  user: DashboardProps["user"];
  membership: DashboardProps["membership"];
  programLabel: string;
  ridePreference?: DashboardProps["ridePreference"];
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [form, setForm] = useState({ name: user.name, phone: user.phone || "", photoUrl: user.photoUrl || "", birthday: user.birthday?.slice(0, 10) || "" });

  const [changingPassword, setChangingPassword] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  async function handleSaveProfile() {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-profile", ...form }),
      });
      if (res.ok) {
        setSaveMsg("Profile updated.");
        setEditing(false);
        setTimeout(() => window.location.reload(), 800);
      } else {
        const data = await res.json();
        setSaveMsg(data.error || "Failed to update.");
      }
    } catch {
      setSaveMsg("Failed to update.");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    setPwMsg(null);
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (pwForm.newPassword.length < 8) {
      setPwMsg({ type: "error", text: "New password must be at least 8 characters." });
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change-password",
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        }),
      });
      if (res.ok) {
        setPwMsg({ type: "success", text: "Password changed." });
        setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setChangingPassword(false);
      } else {
        const data = await res.json();
        setPwMsg({ type: "error", text: data.error || "Failed to change password." });
      }
    } catch {
      setPwMsg({ type: "error", text: "Failed to change password." });
    } finally {
      setPwSaving(false);
    }
  }

  const inputClass = "w-full bg-cream/5 border border-cream/15 px-4 py-3 text-cream focus:outline-none focus:border-gold/50 transition-colors";
  const labelClass = "block text-xs uppercase tracking-[0.12em] text-cream/50 mb-2";

  return (
    <div className="max-w-lg space-y-8">
      {/* Profile header */}
      <div className="flex items-center gap-6">
        {editing ? (
          <>
            {form.photoUrl ? (
              <img src={form.photoUrl} alt={form.name} className="w-28 h-28 rounded-full object-cover border-2 border-gold/40 shadow-lg shadow-gold/5" />
            ) : (
              <div className="w-28 h-28 rounded-full bg-navy-deep border-2 border-gold/40 flex items-center justify-center text-gold text-3xl font-mono shadow-lg shadow-gold/5">
                {form.name.charAt(0)}
              </div>
            )}
            <div className="flex-1 space-y-3">
              <div>
                <label className={labelClass}>Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="(555) 000-0000" />
              </div>
              <div>
                <label className={labelClass}>Birthday</label>
                <input type="date" value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Profile Photo</label>
                <label className="block border border-dashed border-cream/30 hover:border-gold/50 px-3 py-2 text-center cursor-pointer transition-colors">
                  <span className="text-xs text-cream/50">Choose photo...</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => setForm({ ...form, photoUrl: reader.result as string });
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              </div>
            </div>
          </>
        ) : (
          <>
            {user.photoUrl ? (
              <img src={user.photoUrl} alt={user.name} className="w-28 h-28 rounded-full object-cover border-2 border-gold/40 shadow-lg shadow-gold/5" />
            ) : (
              <div className="w-28 h-28 rounded-full bg-navy-deep border-2 border-gold/40 flex items-center justify-center text-gold text-3xl font-mono shadow-lg shadow-gold/5">
                {user.name.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-xl font-light">{user.name}</h2>
              <p className="text-cream/50 text-sm">{user.email}</p>
              {user.phone && <p className="text-cream/50 text-sm">{user.phone}</p>}
            </div>
          </>
        )}
      </div>

      {/* Edit / Save buttons */}
      <div className="flex gap-3">
        {!editing ? (
          <>
            <button
              onClick={() => setEditing(true)}
              className="border border-gold/50 text-gold px-5 py-2.5 text-sm uppercase tracking-[0.12em] hover:bg-gold/10 transition-colors"
            >
              Edit Profile
            </button>
            <button
              onClick={() => setChangingPassword(!changingPassword)}
              className="border border-cream/20 text-cream/50 px-5 py-2.5 text-sm uppercase tracking-[0.12em] hover:bg-cream/10 transition-colors"
            >
              Change Password
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="border border-green-400/50 text-green-400 px-5 py-2.5 text-sm uppercase tracking-[0.12em] hover:bg-green-400/10 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={() => { setEditing(false); setForm({ name: user.name, phone: user.phone || "", photoUrl: user.photoUrl || "", birthday: user.birthday?.slice(0, 10) || "" }); }}
              className="border border-cream/20 text-cream/50 px-5 py-2.5 text-sm uppercase tracking-[0.12em] hover:bg-cream/10 transition-colors"
            >
              Cancel
            </button>
          </>
        )}
      </div>

      {saveMsg && (
        <p className="text-sm text-green-400">{saveMsg}</p>
      )}

      {/* Change Password Form */}
      {changingPassword && (
        <div className="bg-cream/5 border border-cream/10 p-6 space-y-4">
          <h3 className="text-sm uppercase tracking-[0.12em] text-gold/70 mb-2">Change Password</h3>
          <div>
            <label className={labelClass}>Current Password</label>
            <input
              type="password"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>New Password</label>
            <input
              type="password"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              className={inputClass}
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label className={labelClass}>Confirm New Password</label>
            <input
              type="password"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              className={inputClass}
            />
          </div>
          {pwMsg && (
            <p className={`text-sm ${pwMsg.type === "success" ? "text-green-400" : "text-red-400"}`}>
              {pwMsg.text}
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleChangePassword}
              disabled={pwSaving}
              className="border border-gold/50 text-gold px-5 py-2.5 text-sm uppercase tracking-[0.12em] hover:bg-gold/10 transition-colors disabled:opacity-50"
            >
              {pwSaving ? "Updating..." : "Update Password"}
            </button>
            <button
              onClick={() => { setChangingPassword(false); setPwMsg(null); }}
              className="border border-cream/20 text-cream/50 px-5 py-2.5 text-sm uppercase tracking-[0.12em] hover:bg-cream/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Membership Details */}
      {membership && (
        <div className="bg-cream/5 border border-cream/10 p-6 space-y-3">
          <h3 className="text-sm uppercase tracking-[0.12em] text-gold/70 mb-3">
            Membership Details
          </h3>
          <Row label="Program" value={programLabel} />
          <Row label="Status" value={membership.status} />
          <Row label="Start Date" value={new Date(membership.startDate).toLocaleDateString()} />
          <Row label="Guest Passes Used" value={`${membership.guestPassesUsed} this term`} />
          <Row label="Members on Account" value={String(membership.guests.length + 1)} />
        </div>
      )}

      {/* Guest Management */}
      {membership && (
        <GuestManager guests={membership.guests} />
      )}

      {/* Ride Preferences */}
      <RidePreferencesForm
        initial={ridePreference}
      />

      {/* Payment Methods */}
      <PaymentMethodsSection />

      {/* Digital Membership Card */}
      {membership && (
        <div>
          <h3 className="text-sm uppercase tracking-[0.12em] text-cream/50 mb-3">Digital Membership Card</h3>
          <div
            id="membership-card"
            className="relative w-full max-w-sm overflow-hidden"
            style={{ aspectRatio: "1.586" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e1a] via-[#111827] to-[#0a0e1a] border border-gold/30 rounded-lg" />
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(212,160,23,0.3) 20px, rgba(212,160,23,0.3) 21px)" }} />

            {/* Card content */}
            <div className="relative h-full flex flex-col justify-between p-5">
              {/* Top row */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gold text-[10px] uppercase tracking-[0.2em] font-mono">Palm Vintage</p>
                  <p className="text-[9px] text-cream/30 uppercase tracking-[0.16em] font-mono mt-0.5">Philadelphia</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-cream/30 uppercase tracking-[0.14em]">Member Since</p>
                  <p className="text-xs text-cream/60 font-mono">
                    {new Date(membership.startDate).toLocaleDateString("en-US", { month: "2-digit", year: "numeric" })}
                  </p>
                </div>
              </div>

              {/* Center — name + photo */}
              <div className="flex items-center gap-4">
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt={user.name} className="w-14 h-14 rounded-full object-cover border border-gold/40" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-cream/5 border border-gold/40 flex items-center justify-center text-gold text-xl font-mono">
                    {user.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-cream text-base font-light tracking-wide">{user.name}</p>
                  <p className="text-gold/60 text-[10px] uppercase tracking-[0.14em] font-mono">{programLabel}</p>
                </div>
              </div>

              {/* Bottom row */}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[9px] text-cream/30 uppercase tracking-[0.12em]">ID</p>
                  <p className="text-xs text-cream/50 font-mono">{user.id.slice(0, 12).toUpperCase()}</p>
                </div>
                {/* QR-style pattern */}
                <div className="grid grid-cols-5 gap-[2px]">
                  {Array.from({ length: 25 }, (_, i) => {
                    const hash = (user.id.charCodeAt(i % user.id.length) * 7 + i * 13) % 3;
                    return (
                      <div
                        key={i}
                        className={`w-[5px] h-[5px] ${hash === 0 ? "bg-gold/60" : hash === 1 ? "bg-cream/20" : "bg-transparent"}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              const card = document.getElementById("membership-card");
              if (!card) return;
              const range = document.createRange();
              range.selectNode(card);
              window.getSelection()?.removeAllRanges();
              window.getSelection()?.addRange(range);
              alert("Card selected — use your device screenshot tool to save it. On iPhone: press the side + volume up buttons.");
            }}
            className="mt-3 text-xs border border-cream/20 text-cream/50 px-4 py-2 hover:bg-cream/10 transition-colors"
          >
            Screenshot Card
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Trips Tab with Vehicle Condition + Cancel/Reschedule ─── */
function TripsTab({ bookings, onReschedule }: { bookings: DashboardProps["bookings"]; onReschedule?: (booking: DashboardProps["bookings"][0]) => void }) {
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [inspections, setInspections] = useState<Record<string, Inspection[]>>({});
  const [loadingInspection, setLoadingInspection] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<{ src: string; caption: string | null } | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);
  const [ratingBookingId, setRatingBookingId] = useState<string | null>(null);
  const [ratingStars, setRatingStars] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratedBookings, setRatedBookings] = useState<Record<string, { stars: number; comment: string | null }>>(() => {
    const map: Record<string, { stars: number; comment: string | null }> = {};
    bookings.forEach((b) => { if (b.rating) map[b.id] = b.rating; });
    return map;
  });

  async function handleSubmitRating(bookingId: string) {
    setSubmittingRating(true);
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, stars: ratingStars, comment: ratingComment || null }),
      });
      if (res.ok) {
        setRatedBookings((prev) => ({ ...prev, [bookingId]: { stars: ratingStars, comment: ratingComment || null } }));
        setRatingBookingId(null);
        setRatingStars(0);
        setRatingComment("");
      }
    } catch {
      // silent
    } finally {
      setSubmittingRating(false);
    }
  }

  async function toggleCondition(bookingId: string) {
    if (expandedBooking === bookingId) {
      setExpandedBooking(null);
      return;
    }

    setExpandedBooking(bookingId);

    if (!inspections[bookingId]) {
      setLoadingInspection(bookingId);
      try {
        const res = await fetch(`/api/bookings/${bookingId}/inspection`);
        if (res.ok) {
          const data = await res.json();
          setInspections((prev) => ({ ...prev, [bookingId]: data }));
        }
      } catch {
        // silent
      } finally {
        setLoadingInspection(null);
      }
    }
  }

  async function handleCancel(bookingId: string) {
    setCancellingId(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: "POST" });
      if (res.ok) {
        window.location.reload();
      }
    } catch {
      // silent
    } finally {
      setCancellingId(null);
      setCancelConfirm(null);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-light mb-6">All Trips</h2>
      {bookings.length === 0 ? (
        <p className="text-cream/40 text-sm">No trips yet.</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="bg-cream/5 border border-cream/10">
              <div className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    {new Date(b.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    at {formatTime(b.pickupTime)}
                    {b.returnTime && ` – ${formatTime(b.returnTime)}`}
                  </p>
                  <p className="text-xs text-cream/40 truncate">
                    {b.pickupAddress}
                  </p>
                  {b.vehicleRequest && (
                    <p className="text-xs text-cream/30 mt-0.5">
                      Requested: {b.vehicleRequest === "rolls_royce" ? "Rolls-Royce" : "Escalade"}
                    </p>
                  )}
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <p className={`text-xs uppercase tracking-wider ${
                      b.status === "pending" ? "text-yellow-400" :
                      b.status === "confirmed" ? "text-green-400" :
                      b.status === "in_progress" ? "text-blue-400" :
                      b.status === "completed" ? "text-cream/40" :
                      "text-red-400"
                    }`}>
                      {b.status === "in_progress" ? "In Progress" : b.status}
                    </p>
                    {b.vehicleAssigned && (
                      <p className="text-xs text-cream/30 mt-0.5">
                        {b.vehicleAssigned === "rolls_royce" ? "Rolls-Royce" : "Escalade"}
                      </p>
                    )}
                  </div>
                  {(b.status === "confirmed" || b.status === "completed" || b.status === "in_progress") && (
                    <button
                      onClick={() => toggleCondition(b.id)}
                      className={`text-[11px] border px-2.5 py-1.5 transition-colors ${
                        expandedBooking === b.id
                          ? "border-gold text-gold bg-gold/10"
                          : "border-cream/20 text-cream/50 hover:border-gold/40 hover:text-gold"
                      }`}
                    >
                      Vehicle Condition
                    </button>
                  )}
                </div>
              </div>

              {/* Cancel / Reschedule actions */}
              {(b.status === "pending" || b.status === "confirmed") && (
                <div className="px-4 pb-3 flex gap-2">
                  {cancelConfirm === b.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-cream/50">Cancel this ride?</span>
                      <button
                        onClick={() => handleCancel(b.id)}
                        disabled={cancellingId === b.id}
                        className="text-[11px] border border-red-400/50 text-red-400 px-2.5 py-1 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                      >
                        {cancellingId === b.id ? "Cancelling..." : "Yes, Cancel"}
                      </button>
                      <button
                        onClick={() => setCancelConfirm(null)}
                        className="text-[11px] border border-cream/20 text-cream/50 px-2.5 py-1 hover:bg-cream/10 transition-colors"
                      >
                        No, Keep
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => setCancelConfirm(b.id)}
                        className="text-[11px] border border-red-400/30 text-red-400/70 px-2.5 py-1 hover:bg-red-400/10 hover:text-red-400 transition-colors"
                      >
                        Cancel Ride
                      </button>
                      {onReschedule && (
                        <button
                          onClick={() => onReschedule(b)}
                          className="text-[11px] border border-cream/20 text-cream/50 px-2.5 py-1 hover:bg-cream/10 hover:text-cream/70 transition-colors"
                        >
                          Reschedule
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Receipt + Rating for completed rides */}
              {b.status === "completed" && (
                <div className="px-4 pb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <a
                      href={`/api/bookings/${b.id}/receipt`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] border border-cream/20 text-cream/50 px-3 py-1.5 hover:bg-cream/10 hover:text-cream/70 transition-colors inline-block"
                    >
                      View Receipt
                    </a>
                  </div>
                  {ratedBookings[b.id] ? (
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span key={s} className={`text-sm ${s <= ratedBookings[b.id].stars ? "text-gold" : "text-cream/20"}`}>&#9733;</span>
                        ))}
                      </div>
                      {ratedBookings[b.id].comment && (
                        <span className="text-xs text-cream/40 italic">&ldquo;{ratedBookings[b.id].comment}&rdquo;</span>
                      )}
                    </div>
                  ) : ratingBookingId === b.id ? (
                    <div className="space-y-2 border-t border-cream/10 pt-3">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setRatingStars(s)}
                            className={`text-xl transition-colors ${s <= ratingStars ? "text-gold" : "text-cream/20 hover:text-cream/40"}`}
                          >
                            &#9733;
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={ratingComment}
                        onChange={(e) => setRatingComment(e.target.value)}
                        placeholder="How was your ride? (optional)"
                        className="w-full bg-cream/5 border border-cream/15 px-3 py-2 text-cream text-xs placeholder:text-cream/30 focus:outline-none focus:border-gold/50 transition-colors"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSubmitRating(b.id)}
                          disabled={submittingRating || ratingStars === 0}
                          className="text-[11px] border border-gold/50 text-gold px-3 py-1.5 hover:bg-gold/10 transition-colors disabled:opacity-50"
                        >
                          {submittingRating ? "..." : "Submit Rating"}
                        </button>
                        <button
                          onClick={() => { setRatingBookingId(null); setRatingStars(0); setRatingComment(""); }}
                          className="text-[11px] border border-cream/20 text-cream/50 px-3 py-1.5 hover:bg-cream/10 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRatingBookingId(b.id)}
                      className="text-[11px] border border-gold/30 text-gold/70 px-3 py-1.5 hover:bg-gold/10 hover:text-gold transition-colors"
                    >
                      Rate This Ride
                    </button>
                  )}
                </div>
              )}

              {/* Expanded vehicle condition */}
              {expandedBooking === b.id && (
                <div className="border-t border-cream/10 p-4">
                  {loadingInspection === b.id ? (
                    <p className="text-cream/40 text-sm">Loading inspection photos...</p>
                  ) : inspections[b.id]?.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-cream/40 text-sm">No vehicle condition photos uploaded yet.</p>
                      <p className="text-cream/30 text-xs mt-1">Photos will appear here once the driver uploads them before and after your ride.</p>
                    </div>
                  ) : inspections[b.id] ? (
                    <div className="space-y-5">
                      {["before", "after"].map((type) => {
                        const group = inspections[b.id].filter((i) => i.type === type);
                        if (group.length === 0) return null;
                        return (
                          <div key={type}>
                            <p className="text-xs uppercase tracking-[0.12em] text-gold/70 mb-3">
                              {type === "before" ? "Pre-Ride" : "Post-Ride"} Condition
                            </p>
                            {group.map((insp) => (
                              <div key={insp.id} className="mb-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs text-cream/50">{insp.vehicle.name}</span>
                                  <span className="text-cream/20">&middot;</span>
                                  <span className="text-xs text-cream/40">
                                    {new Date(insp.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                {insp.notes && (
                                  <p className="text-sm text-cream/60 italic mb-2">{insp.notes}</p>
                                )}
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                  {insp.photos.map((p) => (
                                    <button
                                      key={p.id}
                                      onClick={() => setSelectedPhoto({ src: p.photoData, caption: p.caption })}
                                      className="relative group cursor-pointer"
                                    >
                                      <img
                                        src={p.photoData}
                                        alt={p.caption || "Inspection photo"}
                                        className="w-full aspect-square object-cover border border-cream/10 hover:border-gold/40 transition-colors"
                                      />
                                      {p.caption && (
                                        <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-cream text-[10px] px-1 py-0.5 truncate">
                                          {p.caption}
                                        </span>
                                      )}
                                      <span className="absolute top-1 right-1 text-[9px] text-cream/50 bg-black/50 px-1">
                                        {new Date(p.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Photo lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="max-w-3xl max-h-[90vh] relative">
            <img src={selectedPhoto.src} alt={selectedPhoto.caption || "Photo"} className="max-w-full max-h-[85vh] object-contain" />
            {selectedPhoto.caption && (
              <p className="text-center text-cream/70 text-sm mt-3">{selectedPhoto.caption}</p>
            )}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-cream/70 hover:text-cream flex items-center justify-center text-xl"
            >
              &times;
            </button>
          </div>
        </div>
      )}
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
          at {formatTime(booking.pickupTime)}
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

/* ─── Events Tab (Member) ─── */
interface EventItem {
  id: string;
  title: string;
  description: string | null;
  date: string;
  endDate: string | null;
  location: string | null;
  capacity: number | null;
  rsvpCount: number;
  myRsvp: string | null;
}

function EventsTab() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvpingId, setRsvpingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((data) => { setEvents(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleRsvp(eventId: string, status: string) {
    setRsvpingId(eventId);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, status }),
      });
      if (res.ok) {
        setEvents((prev) => prev.map((e) => {
          if (e.id !== eventId) return e;
          const wasAttending = e.myRsvp === "attending";
          const nowAttending = status === "attending";
          return {
            ...e,
            myRsvp: status,
            rsvpCount: e.rsvpCount + (nowAttending ? 1 : 0) - (wasAttending ? 1 : 0),
          };
        }));
      }
    } catch {
      // silent
    } finally {
      setRsvpingId(null);
    }
  }

  if (loading) return <p className="text-cream/40 text-sm">Loading events...</p>;

  return (
    <div>
      <h2 className="text-lg font-light mb-6">Upcoming Events</h2>
      {events.length === 0 ? (
        <p className="text-cream/40 text-sm">No upcoming events. Check back soon.</p>
      ) : (
        <div className="space-y-4">
          {events.map((e) => (
            <div key={e.id} className="bg-cream/5 border border-cream/10 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-base font-light mb-1">{e.title}</h3>
                  <p className="text-xs text-gold/70 font-mono uppercase tracking-wider">
                    {new Date(e.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    {" at "}
                    {new Date(e.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </p>
                  {e.location && <p className="text-xs text-cream/40 mt-1">{e.location}</p>}
                  {e.description && <p className="text-sm text-cream/60 mt-3">{e.description}</p>}
                </div>
                <div className="text-right">
                  <p className="text-xs text-cream/40">
                    {e.rsvpCount} attending{e.capacity ? ` / ${e.capacity}` : ""}
                  </p>
                  {e.capacity && e.rsvpCount >= e.capacity && e.myRsvp !== "attending" ? (
                    <p className="text-xs text-red-400/70 mt-1">Full</p>
                  ) : e.myRsvp === "attending" ? (
                    <button
                      onClick={() => handleRsvp(e.id, "cancelled")}
                      disabled={rsvpingId === e.id}
                      className="mt-2 text-[11px] border border-green-400/40 text-green-400 px-3 py-1.5 hover:bg-red-400/10 hover:text-red-400 hover:border-red-400/40 transition-colors disabled:opacity-50"
                    >
                      {rsvpingId === e.id ? "..." : "Attending ✓"}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRsvp(e.id, "attending")}
                      disabled={rsvpingId === e.id}
                      className="mt-2 text-[11px] border border-gold/40 text-gold px-3 py-1.5 hover:bg-gold/10 transition-colors disabled:opacity-50"
                    >
                      {rsvpingId === e.id ? "..." : "RSVP"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Monthly Usage Summary ─── */
function MonthlyUsageSummary({ bookings }: { bookings: DashboardProps["bookings"] }) {
  const now = new Date();
  const thisMonth = bookings.filter((b) => {
    const d = new Date(b.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && b.status !== "cancelled";
  });

  const completed = thisMonth.filter((b) => b.status === "completed");
  const upcoming = thisMonth.filter((b) => b.status === "pending" || b.status === "confirmed" || b.status === "in_progress");

  const vehiclesUsed = new Set(completed.map((b) => b.vehicleAssigned).filter(Boolean));

  const totalHours = completed.reduce((sum, b) => {
    if (!b.pickupTime || !b.returnTime) return sum;
    const [ph, pm] = b.pickupTime.split(":").map(Number);
    const [rh, rm] = b.returnTime.split(":").map(Number);
    return sum + ((rh * 60 + rm) - (ph * 60 + pm)) / 60;
  }, 0);

  const monthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="bg-cream/5 border border-cream/10 p-6">
      <h3 className="text-xs uppercase tracking-[0.12em] text-cream/40 mb-4">{monthLabel} Summary</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-2xl font-light">{completed.length}</p>
          <p className="text-xs text-cream/40">Completed</p>
        </div>
        <div>
          <p className="text-2xl font-light">{upcoming.length}</p>
          <p className="text-xs text-cream/40">Upcoming</p>
        </div>
        <div>
          <p className="text-2xl font-light">{totalHours > 0 ? `${totalHours.toFixed(1)}h` : "—"}</p>
          <p className="text-xs text-cream/40">Total Hours</p>
        </div>
        <div>
          <p className="text-2xl font-light">{vehiclesUsed.size || "—"}</p>
          <p className="text-xs text-cream/40">Vehicles Used</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Guest Manager ─── */
function GuestManager({
  guests: initialGuests,
}: {
  guests: { id: string; name: string; phone: string | null; email: string | null }[];
}) {
  const [guests, setGuests] = useState(initialGuests);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleAdd() {
    if (!form.name) return;
    setSaving(true);
    try {
      const res = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const guest = await res.json();
        setGuests((prev) => [...prev, guest]);
        setForm({ name: "", phone: "", email: "" });
        setAdding(false);
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    try {
      const res = await fetch("/api/guests", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setGuests((prev) => prev.filter((g) => g.id !== id));
      }
    } catch {
      // silent
    } finally {
      setRemovingId(null);
    }
  }

  const inputClass = "w-full bg-cream/5 border border-cream/15 px-4 py-3 text-cream text-sm focus:outline-none focus:border-gold/50 transition-colors";
  const labelClass = "block text-xs uppercase tracking-[0.12em] text-cream/50 mb-2";

  return (
    <div className="bg-cream/5 border border-cream/10 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm uppercase tracking-[0.12em] text-gold/70">Guest Passes</h3>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-[11px] border border-gold/40 text-gold px-3 py-1.5 hover:bg-gold/10 transition-colors"
          >
            + Add Guest
          </button>
        )}
      </div>

      {adding && (
        <div className="space-y-3 border-t border-cream/10 pt-4">
          <div>
            <label className={labelClass}>Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              placeholder="Guest's full name"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputClass}
                placeholder="(555) 000-0000"
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass}
                placeholder="guest@email.com"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAdd}
              disabled={saving || !form.name}
              className="border border-gold/50 text-gold px-5 py-2 text-xs uppercase tracking-[0.12em] hover:bg-gold/10 transition-colors disabled:opacity-50"
            >
              {saving ? "Adding..." : "Add Guest"}
            </button>
            <button
              onClick={() => { setAdding(false); setForm({ name: "", phone: "", email: "" }); }}
              className="border border-cream/20 text-cream/50 px-5 py-2 text-xs uppercase tracking-[0.12em] hover:bg-cream/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {guests.length === 0 ? (
        <p className="text-xs text-cream/40">No guests added yet. Add guests who can ride under your membership.</p>
      ) : (
        <div className="space-y-2">
          {guests.map((g) => (
            <div key={g.id} className="flex items-center justify-between py-2 border-b border-cream/5 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-navy-deep border border-cream/10 flex items-center justify-center text-cream/50 text-xs font-mono">
                  {g.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm">{g.name}</p>
                  <p className="text-xs text-cream/40">{g.email || g.phone || ""}</p>
                </div>
              </div>
              <button
                onClick={() => handleRemove(g.id)}
                disabled={removingId === g.id}
                className="text-[11px] text-red-400/60 hover:text-red-400 transition-colors disabled:opacity-50"
              >
                {removingId === g.id ? "..." : "Remove"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Ride Preferences Form ─── */
function RidePreferencesForm({
  initial,
}: {
  initial?: { vehicleRequest: string | null; passengers: number; notes: string | null } | null;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    vehicleRequest: initial?.vehicleRequest || "",
    passengers: initial?.passengers || 1,
    notes: initial?.notes || "",
  });

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSaved(true);
        setEditing(false);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full bg-cream/5 border border-cream/15 px-4 py-3 text-cream text-sm focus:outline-none focus:border-gold/50 transition-colors";
  const labelClass = "block text-xs uppercase tracking-[0.12em] text-cream/50 mb-2";

  return (
    <div className="bg-cream/5 border border-cream/10 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm uppercase tracking-[0.12em] text-gold/70">Ride Preferences</h3>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-[11px] border border-cream/20 text-cream/50 px-3 py-1.5 hover:bg-cream/10 transition-colors"
          >
            Edit
          </button>
        )}
      </div>
      <p className="text-xs text-cream/40">These defaults auto-fill your booking form.</p>

      {editing ? (
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Preferred Vehicle</label>
            <select
              value={form.vehicleRequest}
              onChange={(e) => setForm({ ...form, vehicleRequest: e.target.value })}
              className={`${inputClass} appearance-none`}
            >
              <option value="" className="bg-navy-darkest">No preference</option>
              <option value="rolls_royce" className="bg-navy-darkest">Rolls-Royce</option>
              <option value="escalade" className="bg-navy-darkest">Cadillac Escalade</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Default Passengers</label>
            <input
              type="number"
              min="1"
              max="6"
              value={form.passengers}
              onChange={(e) => setForm({ ...form, passengers: parseInt(e.target.value) || 1 })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Standing Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="E.g. child seat needed, wheelchair accessible, etc."
              className={`${inputClass} resize-none`}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="border border-gold/50 text-gold px-5 py-2 text-xs uppercase tracking-[0.12em] hover:bg-gold/10 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Preferences"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="border border-cream/20 text-cream/50 px-5 py-2 text-xs uppercase tracking-[0.12em] hover:bg-cream/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Row label="Vehicle" value={form.vehicleRequest === "rolls_royce" ? "Rolls-Royce" : form.vehicleRequest === "escalade" ? "Cadillac Escalade" : "No preference"} />
          <Row label="Passengers" value={String(form.passengers)} />
          <Row label="Notes" value={form.notes || "—"} />
        </div>
      )}
      {saved && <p className="text-xs text-green-400">Preferences saved.</p>}
    </div>
  );
}

function PaymentMethodsSection() {
  const [methods, setMethods] = useState<{ id: string; type: string; last4: string; brand: string | null; expMonth: number | null; expYear: number | null; isDefault: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ type: "card", last4: "", brand: "", expMonth: "", expYear: "", isDefault: false });

  useEffect(() => {
    fetch("/api/payment-methods")
      .then((r) => r.json())
      .then((data) => { setMethods(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleAdd() {
    if (!form.last4 || form.last4.length !== 4) return;
    const res = await fetch("/api/payment-methods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: form.type,
        last4: form.last4,
        brand: form.brand || null,
        expMonth: form.expMonth ? Number(form.expMonth) : null,
        expYear: form.expYear ? Number(form.expYear) : null,
        isDefault: form.isDefault,
      }),
    });
    if (res.ok) {
      const method = await res.json();
      if (form.isDefault) {
        setMethods((prev) => prev.map((m) => ({ ...m, isDefault: false })).concat(method));
      } else {
        setMethods((prev) => [...prev, method]);
      }
      setAdding(false);
      setForm({ type: "card", last4: "", brand: "", expMonth: "", expYear: "", isDefault: false });
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/payment-methods?id=${id}`, { method: "DELETE" });
    setMethods((prev) => prev.filter((m) => m.id !== id));
  }

  const inputClass = "w-full bg-cream/5 border border-cream/15 px-3 py-2 text-cream text-sm focus:outline-none focus:border-gold/50 transition-colors";
  const labelClass = "block text-xs uppercase tracking-[0.12em] text-cream/50 mb-1.5";

  return (
    <div className="bg-cream/5 border border-cream/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm uppercase tracking-[0.12em] text-gold/70">Payment Methods</h3>
        {!adding && (
          <button onClick={() => setAdding(true)} className="text-xs text-gold hover:text-gold-bright transition-colors">
            + Add
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-cream/30 text-xs">Loading...</p>
      ) : methods.length === 0 && !adding ? (
        <p className="text-cream/40 text-sm">No payment methods on file.</p>
      ) : (
        <div className="space-y-3">
          {methods.map((m) => (
            <div key={m.id} className="flex items-center justify-between bg-cream/5 border border-cream/10 px-4 py-3">
              <div>
                <span className="text-sm text-cream/80">
                  {m.brand || m.type} ending in {m.last4}
                </span>
                {m.expMonth && m.expYear && (
                  <span className="text-cream/40 text-xs ml-2">
                    Exp {String(m.expMonth).padStart(2, "0")}/{m.expYear}
                  </span>
                )}
                {m.isDefault && (
                  <span className="ml-2 text-[10px] uppercase tracking-wider text-gold bg-gold/10 px-1.5 py-0.5">Default</span>
                )}
              </div>
              <button onClick={() => handleDelete(m.id)} className="text-xs text-red-400/60 hover:text-red-400 transition-colors">
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div className="mt-4 space-y-3 border-t border-cream/10 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputClass + " appearance-none"}>
                <option value="card" className="bg-navy-darkest">Credit/Debit Card</option>
                <option value="bank" className="bg-navy-darkest">Bank Account</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Last 4 Digits</label>
              <input type="text" maxLength={4} pattern="[0-9]{4}" value={form.last4} onChange={(e) => setForm({ ...form, last4: e.target.value.replace(/\D/g, "") })} className={inputClass} placeholder="1234" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Brand</label>
              <input type="text" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className={inputClass} placeholder="Visa" />
            </div>
            <div>
              <label className={labelClass}>Exp Month</label>
              <input type="number" min="1" max="12" value={form.expMonth} onChange={(e) => setForm({ ...form, expMonth: e.target.value })} className={inputClass} placeholder="01" />
            </div>
            <div>
              <label className={labelClass}>Exp Year</label>
              <input type="number" min="2024" max="2040" value={form.expYear} onChange={(e) => setForm({ ...form, expYear: e.target.value })} className={inputClass} placeholder="2028" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="accent-gold" />
            <span className="text-xs text-cream/50">Set as default</span>
          </label>
          <div className="flex gap-3">
            <button onClick={handleAdd} className="border border-gold/50 text-gold px-4 py-2 text-xs uppercase tracking-[0.12em] hover:bg-gold/10 transition-colors">
              Save
            </button>
            <button onClick={() => setAdding(false)} className="border border-cream/20 text-cream/50 px-4 py-2 text-xs uppercase tracking-[0.12em] hover:bg-cream/10 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
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
