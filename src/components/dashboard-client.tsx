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
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "book" | "trips" | "account">("overview");
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
    { key: "account" as const, label: "Account" },
  ];

  return (
    <div className="min-h-screen bg-navy-darkest text-cream">
      {/* Header */}
      <header className="border-b border-cream/10 px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-5">
            {user.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-gold/40 shadow-lg shadow-gold/5"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-navy-deep border-2 border-gold/40 flex items-center justify-center text-gold text-xl font-mono shadow-lg shadow-gold/5">
                {user.name.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-base font-medium">{user.name}</p>
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
                  {" "}at {rescheduleBooking.pickupTime}. Choose a new date and time below.
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

        {activeTab === "account" && (
          <AccountTab user={user} membership={membership} programLabel={programLabel} />
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
}: {
  user: DashboardProps["user"];
  membership: DashboardProps["membership"];
  programLabel: string;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [form, setForm] = useState({ name: user.name, phone: user.phone || "", photoUrl: user.photoUrl || "" });

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
              onClick={() => { setEditing(false); setForm({ name: user.name, phone: user.phone || "", photoUrl: user.photoUrl || "" }); }}
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
                    at {b.pickupTime}
                    {b.returnTime && ` – ${b.returnTime}`}
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
