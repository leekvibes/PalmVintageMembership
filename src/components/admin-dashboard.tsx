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
    returnTime: string | null;
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
  vehicles: {
    id: string;
    name: string;
    type: string;
  }[];
  userRole: string;
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

interface Inspection {
  id: string;
  type: string;
  notes: string | null;
  createdAt: string;
  vehicle: { name: string; type: string };
  photos: { id: string; photoData: string; caption: string | null; createdAt: string }[];
}

export function AdminDashboard({ members, bookings, inquiries, vehicles, userRole }: AdminProps) {
  const isDriver = userRole === "driver";
  const [activeTab, setActiveTab] = useState<"bookings" | "members" | "inquiries" | "create">("bookings");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const newInquiries = inquiries.filter((i) => i.status === "new");

  const tabs = isDriver
    ? [{ key: "bookings" as const, label: "My Bookings" }]
    : [
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
              {isDriver ? "Driver" : "Admin"}
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
        {activeTab === "bookings" && <BookingsTab bookings={bookings} vehicles={vehicles} isDriver={isDriver} />}
        {activeTab === "members" && !isDriver && (
          selectedMemberId ? (
            <MemberProfile
              memberId={selectedMemberId}
              vehicles={vehicles}
              onBack={() => setSelectedMemberId(null)}
            />
          ) : (
            <MembersTab members={members} onSelect={setSelectedMemberId} />
          )
        )}
        {activeTab === "inquiries" && !isDriver && <InquiriesTab inquiries={inquiries} />}
        {activeTab === "create" && !isDriver && <CreateMemberForm />}
      </div>
    </div>
  );
}

/* ─── Inspection Upload Modal ─── */
function InspectionUpload({
  bookingId,
  vehicles,
  onClose,
  onUploaded,
}: {
  bookingId: string;
  vehicles: { id: string; name: string; type: string }[];
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [type, setType] = useState<"before" | "after">("before");
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id || "");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<{ photoData: string; caption: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotos((prev) => [...prev, { photoData: reader.result as string, caption: "" }]);
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleSubmit() {
    if (!photos.length || !vehicleId) return;
    setUploading(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/inspection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, vehicleId, notes: notes || undefined, photos }),
      });
      if (res.ok) {
        onUploaded();
        onClose();
      }
    } catch {
      // handle error
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-navy-darkest border border-cream/15 max-w-xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-light">Upload Vehicle Condition Photos</h3>
          <button onClick={onClose} className="text-cream/40 hover:text-cream/70 text-xl">&times;</button>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-[0.12em] text-cream/50 mb-2">Inspection Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setType("before")}
                  className={`flex-1 py-2.5 text-sm uppercase tracking-wider border transition-colors ${
                    type === "before" ? "border-gold text-gold bg-gold/10" : "border-cream/20 text-cream/50"
                  }`}
                >
                  Before
                </button>
                <button
                  type="button"
                  onClick={() => setType("after")}
                  className={`flex-1 py-2.5 text-sm uppercase tracking-wider border transition-colors ${
                    type === "after" ? "border-gold text-gold bg-gold/10" : "border-cream/20 text-cream/50"
                  }`}
                >
                  After
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-[0.12em] text-cream/50 mb-2">Vehicle</label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full bg-cream/5 border border-cream/15 px-4 py-3 text-cream focus:outline-none focus:border-gold/50 transition-colors appearance-none"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id} className="bg-navy-darkest">{v.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-[0.12em] text-cream/50 mb-2">
              Photos ({photos.length} selected)
            </label>
            <label className="block border-2 border-dashed border-cream/20 hover:border-gold/40 p-8 text-center cursor-pointer transition-colors">
              <div className="text-cream/40 text-sm">
                <span className="text-gold">Tap to take photos</span> or choose from gallery
              </div>
              <p className="text-cream/30 text-xs mt-1">Upload as many as needed</p>
              <input
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </label>
          </div>

          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p, i) => (
                <div key={i} className="relative group">
                  <img src={p.photoData} alt={`Photo ${i + 1}`} className="w-full aspect-square object-cover border border-cream/10" />
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    &times;
                  </button>
                  <input
                    type="text"
                    placeholder="Caption (optional)"
                    value={p.caption}
                    onChange={(e) => {
                      const updated = [...photos];
                      updated[i] = { ...updated[i], caption: e.target.value };
                      setPhotos(updated);
                    }}
                    className="w-full bg-cream/5 border border-cream/10 px-2 py-1 text-xs text-cream mt-1 focus:outline-none focus:border-gold/50"
                  />
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-[0.12em] text-cream/50 mb-2">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any visible damage, scratches, marks..."
              className="w-full bg-cream/5 border border-cream/15 px-4 py-3 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/50 transition-colors resize-none text-sm"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={uploading || !photos.length}
            className="w-full border border-gold/60 text-gold px-8 py-3.5 text-sm uppercase tracking-[0.14em] hover:bg-gold/10 transition-colors disabled:opacity-50"
          >
            {uploading ? "Uploading..." : `Upload ${type === "before" ? "Pre-Ride" : "Post-Ride"} Photos`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Inspection Viewer ─── */
function InspectionViewer({ inspections }: { inspections: Inspection[] }) {
  const [selectedPhoto, setSelectedPhoto] = useState<{ src: string; caption: string | null } | null>(null);

  const before = inspections.filter((i) => i.type === "before");
  const after = inspections.filter((i) => i.type === "after");

  if (inspections.length === 0) {
    return (
      <p className="text-cream/30 text-sm py-4">No inspection photos uploaded yet.</p>
    );
  }

  function renderInspection(group: Inspection[], label: string) {
    if (group.length === 0) return null;
    return (
      <div>
        <p className="text-xs uppercase tracking-[0.12em] text-cream/50 mb-3">{label} Inspection</p>
        {group.map((insp) => (
          <div key={insp.id} className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs text-cream/40">
                {insp.vehicle.name} &middot; {new Date(insp.createdAt).toLocaleString()}
              </span>
            </div>
            {insp.notes && <p className="text-sm text-cream/60 mb-2 italic">{insp.notes}</p>}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {insp.photos.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPhoto({ src: p.photoData, caption: p.caption })}
                  className="relative group cursor-pointer"
                >
                  <img src={p.photoData} alt={p.caption || "Inspection"} className="w-full aspect-square object-cover border border-cream/10 hover:border-gold/40 transition-colors" />
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
  }

  return (
    <div className="space-y-4">
      {renderInspection(before, "Pre-Ride")}
      {renderInspection(after, "Post-Ride")}

      {/* Lightbox */}
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

/* ─── Bookings Tab ─── */
function BookingsTab({ bookings, vehicles, isDriver }: { bookings: AdminProps["bookings"]; vehicles: AdminProps["vehicles"]; isDriver: boolean }) {
  const [inspectionBookingId, setInspectionBookingId] = useState<string | null>(null);
  const [viewingInspections, setViewingInspections] = useState<{ bookingId: string; inspections: Inspection[] } | null>(null);

  async function updateStatus(id: string, status: string, vehicleAssigned?: string) {
    await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, vehicleAssigned }),
    });
    window.location.reload();
  }

  async function viewInspections(bookingId: string) {
    const res = await fetch(`/api/admin/bookings/${bookingId}/inspection`);
    if (res.ok) {
      const data = await res.json();
      setViewingInspections({ bookingId, inspections: data });
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-light mb-4">{isDriver ? "Assigned Bookings" : "All Bookings"}</h2>
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
                  : b.status === "in_progress"
                  ? "bg-blue-400/10 text-blue-400"
                  : b.status === "completed"
                  ? "bg-cream/10 text-cream/40"
                  : "bg-red-400/10 text-red-400"
              }`}
            >
              {b.status === "in_progress" ? "In Progress" : b.status}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-cream/70 mb-4">
            <div>
              <span className="text-cream/40 text-xs block">Date</span>
              {new Date(b.date).toLocaleDateString()}
            </div>
            <div>
              <span className="text-cream/40 text-xs block">Time</span>
              {b.pickupTime}{b.returnTime ? ` – ${b.returnTime}` : ""}
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

          {/* Status workflow + condition actions */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-cream/10">
            {/* Pending → Confirm or Cancel */}
            {!isDriver && b.status === "pending" && (
              <>
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
              </>
            )}

            {/* Confirmed → In Progress or Cancel */}
            {b.status === "confirmed" && (
              <>
                <button
                  onClick={() => updateStatus(b.id, "in_progress")}
                  className="text-xs border border-blue-400/50 text-blue-400 px-3 py-1.5 hover:bg-blue-400/10 transition-colors"
                >
                  Start Ride
                </button>
                {!isDriver && (
                  <button
                    onClick={() => updateStatus(b.id, "cancelled")}
                    className="text-xs border border-red-400/50 text-red-400 px-3 py-1.5 hover:bg-red-400/10 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </>
            )}

            {/* In Progress → Completed */}
            {b.status === "in_progress" && (
              <button
                onClick={() => updateStatus(b.id, "completed")}
                className="text-xs border border-cream/30 text-cream/60 px-3 py-1.5 hover:bg-cream/10 transition-colors"
              >
                Complete Ride
              </button>
            )}

            {/* Condition photo actions for confirmed, in_progress, and completed */}
            {(b.status === "confirmed" || b.status === "in_progress" || b.status === "completed") && (
              <>
                <button
                  onClick={() => setInspectionBookingId(b.id)}
                  className="text-xs border border-gold/50 text-gold px-3 py-1.5 hover:bg-gold/10 transition-colors ml-auto"
                >
                  Upload Condition Photos
                </button>
                <button
                  onClick={() => viewInspections(b.id)}
                  className="text-xs border border-cream/20 text-cream/50 px-3 py-1.5 hover:bg-cream/10 transition-colors"
                >
                  View Photos
                </button>
              </>
            )}
          </div>

          {/* Inline inspection viewer */}
          {viewingInspections?.bookingId === b.id && (
            <div className="mt-4 pt-4 border-t border-cream/10">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm text-gold/70 uppercase tracking-[0.12em]">Vehicle Condition Report</h4>
                <button onClick={() => setViewingInspections(null)} className="text-xs text-cream/40 hover:text-cream/70">&times; Close</button>
              </div>
              <InspectionViewer inspections={viewingInspections.inspections} />
            </div>
          )}
        </div>
      ))}

      {/* Inspection upload modal */}
      {inspectionBookingId && (
        <InspectionUpload
          bookingId={inspectionBookingId}
          vehicles={vehicles}
          onClose={() => setInspectionBookingId(null)}
          onUploaded={() => window.location.reload()}
        />
      )}
    </div>
  );
}

/* ─── Members Tab ─── */
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

/* ─── Member Profile ─── */
function MemberProfile({ memberId, vehicles, onBack }: { memberId: string; vehicles: AdminProps["vehicles"]; onBack: () => void }) {
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [inspectionBookingId, setInspectionBookingId] = useState<string | null>(null);
  const [viewingInspections, setViewingInspections] = useState<{ bookingId: string; inspections: Inspection[] } | null>(null);

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

  async function viewInspections(bookingId: string) {
    const res = await fetch(`/api/admin/bookings/${bookingId}/inspection`);
    if (res.ok) {
      const data = await res.json();
      setViewingInspections({ bookingId, inspections: data });
    }
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
                  <label className={labelClass}>Profile Photo</label>
                  <label className="block w-full border border-dashed border-cream/30 hover:border-gold/50 px-4 py-3 text-center cursor-pointer transition-colors">
                    <span className="text-sm text-cream/50">Choose photo...</span>
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
                  {form.photoUrl && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, photoUrl: "" })}
                      className="text-xs text-red-400/70 hover:text-red-400 mt-1"
                    >
                      Remove photo
                    </button>
                  )}
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

              {/* Booking history with inspection access */}
              <div className="bg-cream/5 border border-cream/10 p-6">
                <h3 className="text-sm uppercase tracking-[0.12em] text-gold/70 mb-4">
                  Trip History ({member.bookings.length})
                </h3>
                {member.bookings.length === 0 ? (
                  <p className="text-cream/40 text-sm">No trips yet.</p>
                ) : (
                  <div className="space-y-3">
                    {member.bookings.map((b) => (
                      <div key={b.id} className="border-b border-cream/5 pb-3 last:border-0">
                        <div className="flex items-center justify-between text-sm">
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
                        {(b.status === "confirmed" || b.status === "completed") && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => setInspectionBookingId(b.id)}
                              className="text-[11px] border border-gold/40 text-gold px-2 py-1 hover:bg-gold/10 transition-colors"
                            >
                              Upload Photos
                            </button>
                            <button
                              onClick={() => viewInspections(b.id)}
                              className="text-[11px] border border-cream/20 text-cream/50 px-2 py-1 hover:bg-cream/10 transition-colors"
                            >
                              View Condition
                            </button>
                          </div>
                        )}
                        {viewingInspections?.bookingId === b.id && (
                          <div className="mt-3 pt-3 border-t border-cream/10">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-gold/70 uppercase tracking-[0.12em]">Vehicle Condition</span>
                              <button onClick={() => setViewingInspections(null)} className="text-xs text-cream/40 hover:text-cream/70">&times;</button>
                            </div>
                            <InspectionViewer inspections={viewingInspections.inspections} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Inspection upload modal */}
      {inspectionBookingId && (
        <InspectionUpload
          bookingId={inspectionBookingId}
          vehicles={vehicles}
          onClose={() => setInspectionBookingId(null)}
          onUploaded={() => {
            viewInspections(inspectionBookingId);
            setInspectionBookingId(null);
          }}
        />
      )}
    </div>
  );
}

/* ─── Inquiries Tab ─── */
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

/* ─── Create Member Form ─── */
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
