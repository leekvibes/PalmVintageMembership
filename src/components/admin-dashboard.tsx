"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

interface AdminProps {
  members: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    photoUrl: string | null;
    createdAt: string;
    membership: { program: string; status: string } | null;
    tripCount: number;
  }[];
  bookings: {
    id: string;
    userName: string;
    userEmail: string;
    date: string;
    pickupTime: string;
    pickupAddress: string;
    dropoffAddress: string | null;
    vehicleRequest: string | null;
    vehicleAssigned: string | null;
    status: string;
    passengers: number;
  }[];
  inquiries: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    program: string;
    message: string | null;
    status: string;
    createdAt: string;
  }[];
}

interface MemberDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  photoUrl: string | null;
  role: string;
  createdAt: string;
  membership: {
    id: string;
    program: string;
    status: string;
    startDate: string;
    endDate: string | null;
    guestPassesUsed: number;
    notes: string | null;
    guests: { id: string; name: string; phone: string | null; email: string | null }[];
  } | null;
  bookings: {
    id: string;
    date: string;
    pickupTime: string;
    pickupAddress: string;
    dropoffAddress: string | null;
    vehicleAssigned: string | null;
    status: string;
    passengers: number;
  }[];
}

export function AdminDashboard({ members, bookings, inquiries }: AdminProps) {
  const [activeTab, setActiveTab] = useState<"bookings" | "members" | "inquiries" | "create">("bookings");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const newInquiries = inquiries.filter((i) => i.status === "new");

  const tabs = [
    { key: "bookings" as const, label: `Bookings (${pendingBookings.length} pending)` },
    { key: "members" as const, label: `Members (${members.length})` },
    { key: "inquiries" as const, label: `Inquiries (${newInquiries.length} new)` },
    { key: "create" as const, label: "Create Member" },
  ];

  return (
    <div className="min-h-screen bg-navy-darkest text-cream">
      <header className="border-b border-cream/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-gold uppercase tracking-[0.16em] text-xs font-mono">
              Admin
            </p>
            <p className="text-lg font-light">Palm Vintage Membership</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-xs text-cream/40 hover:text-cream/70 transition-colors uppercase tracking-wider"
          >
            Sign Out
          </button>
        </div>
      </header>

      <nav className="border-b border-cream/10 px-6">
        <div className="max-w-6xl mx-auto flex gap-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSelectedMemberId(null); }}
              className={`py-4 text-sm tracking-wide border-b-2 transition-colors whitespace-nowrap ${
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

      <div className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === "bookings" && <BookingsTab bookings={bookings} />}
        {activeTab === "members" && (
          selectedMemberId ? (
            <MemberProfile
              memberId={selectedMemberId}
              onBack={() => setSelectedMemberId(null)}
            />
          ) : (
            <MembersTab members={members} onSelect={setSelectedMemberId} />
          )
        )}
        {activeTab === "inquiries" && <InquiriesTab inquiries={inquiries} />}
        {activeTab === "create" && <CreateMemberForm />}
      </div>
    </div>
  );
}

function BookingsTab({ bookings }: { bookings: AdminProps["bookings"] }) {
  async function updateStatus(id: string, status: string, vehicleAssigned?: string) {
    await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, vehicleAssigned }),
    });
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-light mb-4">All Bookings</h2>
      {bookings.map((b) => (
        <div key={b.id} className="bg-cream/5 border border-cream/10 p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="font-medium">{b.userName}</p>
              <p className="text-xs text-cream/40">{b.userEmail}</p>
            </div>
            <span
              className={`text-xs uppercase tracking-wider px-2 py-1 ${
                b.status === "pending"
                  ? "bg-yellow-400/10 text-yellow-400"
                  : b.status === "confirmed"
                  ? "bg-green-400/10 text-green-400"
                  : b.status === "completed"
                  ? "bg-cream/10 text-cream/40"
                  : "bg-red-400/10 text-red-400"
              }`}
            >
              {b.status}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-cream/70 mb-4">
            <div>
              <span className="text-cream/40 text-xs block">Date</span>
              {new Date(b.date).toLocaleDateString()}
            </div>
            <div>
              <span className="text-cream/40 text-xs block">Time</span>
              {b.pickupTime}
            </div>
            <div>
              <span className="text-cream/40 text-xs block">Pickup</span>
              {b.pickupAddress}
            </div>
            <div>
              <span className="text-cream/40 text-xs block">Drop-off</span>
              {b.dropoffAddress || "—"}
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-cream/40">
              Vehicle: {b.vehicleRequest === "rolls_royce" ? "Rolls-Royce" : b.vehicleRequest === "escalade" ? "Escalade" : "No pref"}{" "}
              {b.vehicleAssigned && `→ Assigned: ${b.vehicleAssigned === "rolls_royce" ? "Rolls-Royce" : "Escalade"}`}
            </span>
            <span className="text-cream/40">|</span>
            <span className="text-cream/40">{b.passengers} pax</span>
          </div>
          {b.status === "pending" && (
            <div className="flex gap-3 mt-4 pt-4 border-t border-cream/10">
              <button
                onClick={() => updateStatus(b.id, "confirmed", b.vehicleRequest || "rolls_royce")}
                className="text-xs border border-green-400/50 text-green-400 px-3 py-1.5 hover:bg-green-400/10 transition-colors"
              >
                Confirm (Rolls-Royce)
              </button>
              <button
                onClick={() => updateStatus(b.id, "confirmed", "escalade")}
                className="text-xs border border-green-400/50 text-green-400 px-3 py-1.5 hover:bg-green-400/10 transition-colors"
              >
                Confirm (Escalade)
              </button>
              <button
                onClick={() => updateStatus(b.id, "cancelled")}
                className="text-xs border border-red-400/50 text-red-400 px-3 py-1.5 hover:bg-red-400/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
          {b.status === "confirmed" && (
            <div className="flex gap-3 mt-4 pt-4 border-t border-cream/10">
              <button
                onClick={() => updateStatus(b.id, "completed")}
                className="text-xs border border-cream/30 text-cream/60 px-3 py-1.5 hover:bg-cream/10 transition-colors"
              >
                Mark Completed
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function MembersTab({ members, onSelect }: { members: AdminProps["members"]; onSelect: (id: string) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-light mb-4">All Members</h2>
      {members.map((m) => (
        <button
          key={m.id}
          onClick={() => onSelect(m.id)}
          className="w-full text-left bg-cream/5 border border-cream/10 p-5 flex items-center gap-4 hover:bg-cream/8 hover:border-gold/20 transition-colors cursor-pointer"
        >
          {m.photoUrl ? (
            <img src={m.photoUrl} alt={m.name} className="w-12 h-12 rounded-full object-cover border border-gold/30" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-navy-deep border border-gold/30 flex items-center justify-center text-gold font-mono">
              {m.name.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium">{m.name}</p>
            <p className="text-xs text-cream/40">{m.email} {m.phone && `· ${m.phone}`}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-cream/50 capitalize">
              {m.membership?.program === "chauffeur" ? "Chauffeur" : "Special Event"} · {m.membership?.status || "—"}
            </p>
            <p className="text-xs text-cream/30">{m.tripCount} trips</p>
          </div>
          <span className="text-cream/20 text-lg ml-2">›</span>
        </button>
      ))}
    </div>
  );
}

function MemberProfile({ memberId, onBack }: { memberId: string; onBack: () => void }) {
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    photoUrl: "",
    program: "",
    membershipStatus: "",
  });

  useState(() => {
    fetch(`/api/admin/members/${memberId}`)
      .then((r) => r.json())
      .then((data) => {
        setMember(data);
        setForm({
          name: data.name,
          email: data.email,
          phone: data.phone || "",
          photoUrl: data.photoUrl || "",
          program: data.membership?.program || "",
          membershipStatus: data.membership?.status || "",
        });
        setLoading(false);
      });
  });

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/admin/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const res = await fetch(`/api/admin/members/${memberId}`);
    const data = await res.json();
    setMember(data);
    setSaving(false);
    setEditing(false);
  }

  async function handleResetPassword() {
    const newPass = prompt("Enter new password for this member (min 8 chars):");
    if (!newPass || newPass.length < 8) return;
    await fetch(`/api/admin/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPass }),
    });
    setResetMsg(newPass);
  }

  if (loading) {
    return <p className="text-cream/40">Loading member...</p>;
  }

  if (!member) {
    return <p className="text-red-400">Member not found.</p>;
  }

  const inputClass = "w-full bg-cream/5 border border-cream/15 px-4 py-3 text-cream focus:outline-none focus:border-gold/50 transition-colors";
  const labelClass = "block text-xs uppercase tracking-[0.12em] text-cream/50 mb-2";

  return (
    <div>
      <button
        onClick={onBack}
        className="text-sm text-cream/40 hover:text-cream/70 mb-6 flex items-center gap-2"
      >
        ‹ Back to Members
      </button>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Profile column */}
        <div className="md:col-span-1 space-y-6">
          <div className="text-center">
            {editing ? (
              <div className="space-y-3">
                {form.photoUrl ? (
                  <img src={form.photoUrl} alt={form.name} className="w-28 h-28 rounded-full object-cover border-2 border-gold/40 mx-auto" />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-navy-deep border-2 border-gold/40 flex items-center justify-center text-gold text-3xl font-mono mx-auto">
                    {form.name.charAt(0)}
                  </div>
                )}
                <div>
                  <label className={labelClass}>Photo URL</label>
                  <input
                    type="url"
                    value={form.photoUrl}
                    onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                    className={inputClass}
                    placeholder="https://..."
                  />
                </div>
              </div>
            ) : (
              <>
                {member.photoUrl ? (
                  <img src={member.photoUrl} alt={member.name} className="w-28 h-28 rounded-full object-cover border-2 border-gold/40 mx-auto" />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-navy-deep border-2 border-gold/40 flex items-center justify-center text-gold text-3xl font-mono mx-auto">
                    {member.name.charAt(0)}
                  </div>
                )}
                <h2 className="text-xl font-light mt-4">{member.name}</h2>
                <p className="text-sm text-cream/50">{member.email}</p>
                {member.phone && <p className="text-sm text-cream/40">{member.phone}</p>}
              </>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="w-full border border-gold/50 text-gold px-4 py-2.5 text-sm uppercase tracking-[0.12em] hover:bg-gold/10 transition-colors"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 border border-green-400/50 text-green-400 px-4 py-2.5 text-sm uppercase tracking-[0.12em] hover:bg-green-400/10 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 border border-cream/20 text-cream/50 px-4 py-2.5 text-sm uppercase tracking-[0.12em] hover:bg-cream/10 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
            <button
              onClick={handleResetPassword}
              className="w-full border border-cream/20 text-cream/50 px-4 py-2.5 text-sm uppercase tracking-[0.12em] hover:bg-cream/10 transition-colors"
            >
              Reset Password
            </button>
          </div>

          {resetMsg && (
            <div className="bg-green-400/10 border border-green-400/30 p-4">
              <p className="text-xs text-green-400 mb-1">Password reset. Share with member:</p>
              <p className="font-mono text-sm text-cream">{resetMsg}</p>
            </div>
          )}

          <div className="text-xs text-cream/30">
            <p>Member since {new Date(member.createdAt).toLocaleDateString()}</p>
            <p>ID: {member.id}</p>
          </div>
        </div>

        {/* Details column */}
        <div className="md:col-span-2 space-y-6">
          {editing ? (
            <div className="bg-cream/5 border border-cream/10 p-6 space-y-4">
              <h3 className="text-sm uppercase tracking-[0.12em] text-gold/70 mb-2">Edit Details</h3>
              <div>
                <label className={labelClass}>Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Program</label>
                  <select
                    value={form.program}
                    onChange={(e) => setForm({ ...form, program: e.target.value })}
                    className={`${inputClass} appearance-none`}
                  >
                    <option value="chauffeur" className="bg-navy-darkest">Chauffeur</option>
                    <option value="special_event" className="bg-navy-darkest">Special Event</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select
                    value={form.membershipStatus}
                    onChange={(e) => setForm({ ...form, membershipStatus: e.target.value })}
                    className={`${inputClass} appearance-none`}
                  >
                    <option value="active" className="bg-navy-darkest">Active</option>
                    <option value="paused" className="bg-navy-darkest">Paused</option>
                    <option value="cancelled" className="bg-navy-darkest">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Membership info */}
              {member.membership && (
                <div className="bg-cream/5 border border-cream/10 p-6">
                  <h3 className="text-sm uppercase tracking-[0.12em] text-gold/70 mb-4">Membership</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-cream/40 text-xs block">Program</span>
                      <span className="capitalize">{member.membership.program === "chauffeur" ? "Chauffeur" : "Special Event"}</span>
                    </div>
                    <div>
                      <span className="text-cream/40 text-xs block">Status</span>
                      <span className={`capitalize ${member.membership.status === "active" ? "text-green-400" : "text-cream/50"}`}>
                        {member.membership.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-cream/40 text-xs block">Start Date</span>
                      {new Date(member.membership.startDate).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="text-cream/40 text-xs block">Guest Passes Used</span>
                      {member.membership.guestPassesUsed}
                    </div>
                  </div>
                  {member.membership.guests.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-cream/10">
                      <span className="text-cream/40 text-xs block mb-2">Guests on Account</span>
                      {member.membership.guests.map((g) => (
                        <p key={g.id} className="text-sm text-cream/70">
                          {g.name} {g.email && `· ${g.email}`} {g.phone && `· ${g.phone}`}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Booking history */}
              <div className="bg-cream/5 border border-cream/10 p-6">
                <h3 className="text-sm uppercase tracking-[0.12em] text-gold/70 mb-4">
                  Trip History ({member.bookings.length})
                </h3>
                {member.bookings.length === 0 ? (
                  <p className="text-cream/40 text-sm">No trips yet.</p>
                ) : (
                  <div className="space-y-3">
                    {member.bookings.map((b) => (
                      <div key={b.id} className="flex items-center justify-between text-sm border-b border-cream/5 pb-3 last:border-0">
                        <div>
                          <p>{new Date(b.date).toLocaleDateString()} at {b.pickupTime}</p>
                          <p className="text-xs text-cream/40">{b.pickupAddress}</p>
                        </div>
                        <span className={`text-xs uppercase tracking-wider ${
                          b.status === "completed" ? "text-cream/40" :
                          b.status === "confirmed" ? "text-green-400" :
                          b.status === "pending" ? "text-yellow-400" :
                          "text-red-400"
                        }`}>
                          {b.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InquiriesTab({ inquiries }: { inquiries: AdminProps["inquiries"] }) {
  async function updateInquiryStatus(id: string, status: string) {
    await fetch(`/api/admin/inquiries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    window.location.reload();
  }

  const programLabels: Record<string, string> = {
    chauffeur: "Chauffeur",
    special_event: "Special Event",
    not_sure: "Not Sure",
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-light mb-4">Inquiries</h2>
      {inquiries.map((i) => (
        <div key={i.id} className="bg-cream/5 border border-cream/10 p-5">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <p className="font-medium">{i.name}</p>
              <p className="text-xs text-cream/40">
                {i.email} {i.phone && `· ${i.phone}`}
              </p>
            </div>
            <span
              className={`text-xs uppercase tracking-wider px-2 py-1 ${
                i.status === "new"
                  ? "bg-gold/10 text-gold"
                  : i.status === "contacted"
                  ? "bg-blue-400/10 text-blue-400"
                  : "bg-green-400/10 text-green-400"
              }`}
            >
              {i.status}
            </span>
          </div>
          <p className="text-sm text-cream/50 mb-1">
            Interested in: {programLabels[i.program] || i.program}
          </p>
          {i.message && (
            <p className="text-sm text-cream/60 italic mb-3">&ldquo;{i.message}&rdquo;</p>
          )}
          <p className="text-xs text-cream/30 mb-3">
            {new Date(i.createdAt).toLocaleDateString()} at{" "}
            {new Date(i.createdAt).toLocaleTimeString()}
          </p>
          {i.status === "new" && (
            <div className="flex gap-3">
              <button
                onClick={() => updateInquiryStatus(i.id, "contacted")}
                className="text-xs border border-blue-400/50 text-blue-400 px-3 py-1.5 hover:bg-blue-400/10 transition-colors"
              >
                Mark Contacted
              </button>
              <button
                onClick={() => updateInquiryStatus(i.id, "converted")}
                className="text-xs border border-green-400/50 text-green-400 px-3 py-1.5 hover:bg-green-400/10 transition-colors"
              >
                Mark Converted
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CreateMemberForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [result, setResult] = useState<{ email: string; tempPassword: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }

      const json = await res.json();
      setResult({ email: data.email as string, tempPassword: json.tempPassword });
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "success" && result) {
    return (
      <div className="max-w-lg space-y-6">
        <div className="bg-green-400/10 border border-green-400/30 p-6">
          <h3 className="text-green-400 font-medium mb-3">Member Created</h3>
          <p className="text-sm text-cream/70 mb-4">
            Share these credentials with the member:
          </p>
          <div className="bg-navy-darkest/50 p-4 font-mono text-sm space-y-1">
            <p>Email: {result.email}</p>
            <p>Password: {result.tempPassword}</p>
          </div>
          <p className="text-xs text-cream/40 mt-3">
            The member should change their password after first login.
          </p>
        </div>
        <button
          onClick={() => { setStatus("idle"); setResult(null); }}
          className="text-gold text-sm hover:text-gold-bright"
        >
          Create another member
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-lg font-light mb-6">Create New Member</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs uppercase tracking-[0.12em] text-cream/50 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            name="name"
            required
            className="w-full bg-cream/5 border border-cream/15 px-4 py-3 text-cream focus:outline-none focus:border-gold/50 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-[0.12em] text-cream/50 mb-2">
            Email *
          </label>
          <input
            type="email"
            name="email"
            required
            className="w-full bg-cream/5 border border-cream/15 px-4 py-3 text-cream focus:outline-none focus:border-gold/50 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-[0.12em] text-cream/50 mb-2">
            Phone
          </label>
          <input
            type="tel"
            name="phone"
            className="w-full bg-cream/5 border border-cream/15 px-4 py-3 text-cream focus:outline-none focus:border-gold/50 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-[0.12em] text-cream/50 mb-2">
            Program *
          </label>
          <select
            name="program"
            required
            className="w-full bg-cream/5 border border-cream/15 px-4 py-3 text-cream focus:outline-none focus:border-gold/50 transition-colors appearance-none"
          >
            <option value="chauffeur" className="bg-navy-darkest">
              Chauffeur Membership
            </option>
            <option value="special_event" className="bg-navy-darkest">
              Special Event Experience
            </option>
          </select>
        </div>

        {status === "error" && (
          <p className="text-red-400 text-sm">Failed to create member. Email may already exist.</p>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full border border-gold/60 text-gold px-8 py-4 text-sm uppercase tracking-[0.14em] hover:bg-gold/10 transition-colors disabled:opacity-50"
        >
          {status === "submitting" ? "Creating..." : "Create Member"}
        </button>
      </form>
    </div>
  );
}
