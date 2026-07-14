"use client";

import { useState, useEffect } from "react";
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
    isBirthday?: boolean;
  }[];
  inquiries: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    program: string;
    message: string | null;
    status: string;
    source: string | null;
    convertedUserId: string | null;
    convertedAt: string | null;
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
  const [activeTab, setActiveTab] = useState<"dashboard" | "bookings" | "schedule" | "members" | "inquiries" | "ratings" | "events" | "create">("dashboard");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const newInquiries = inquiries.filter((i) => i.status === "new");

  const tabs = isDriver
    ? [{ key: "bookings" as const, label: "My Bookings" }]
    : [
        { key: "dashboard" as const, label: "Dashboard" },
        { key: "bookings" as const, label: `Bookings (${pendingBookings.length} pending)` },
        { key: "schedule" as const, label: "Schedule" },
        { key: "members" as const, label: `Members (${members.length})` },
        { key: "inquiries" as const, label: `Inquiries (${newInquiries.length} new)` },
        { key: "ratings" as const, label: "Ratings" },
        { key: "events" as const, label: "Events" },
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
        {activeTab === "dashboard" && !isDriver && <DashboardStatsTab bookings={bookings} members={members} inquiries={inquiries} />}
        {activeTab === "bookings" && <BookingsTab bookings={bookings} vehicles={vehicles} isDriver={isDriver} />}
        {activeTab === "schedule" && !isDriver && <ScheduleTab bookings={bookings} vehicles={vehicles} />}
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
        {activeTab === "ratings" && !isDriver && <RatingsTab />}
        {activeTab === "events" && !isDriver && <AdminEventsTab />}
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

/* ─── Schedule Tab (Vehicle Assignment Board + Calendar) ─── */
function ScheduleTab({ bookings: initialBookings, vehicles }: { bookings: AdminProps["bookings"]; vehicles: AdminProps["vehicles"] }) {
  const [localBookings, setLocalBookings] = useState(initialBookings);
  const bookings = localBookings;
  const [view, setView] = useState<"day" | "month">("day");
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [dragId, setDragId] = useState<string | null>(null);

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-400/20 border-yellow-400/50 text-yellow-400",
    confirmed: "bg-green-400/20 border-green-400/50 text-green-400",
    in_progress: "bg-blue-400/20 border-blue-400/50 text-blue-400",
    completed: "bg-cream/10 border-cream/20 text-cream/40",
    cancelled: "bg-red-400/10 border-red-400/30 text-red-400/60",
  };

  const hours = Array.from({ length: 18 }, (_, i) => i + 6);

  function timeToHour(t: string): number {
    const [h, m] = t.split(":").map(Number);
    return h + m / 60;
  }

  const dayBookings = bookings.filter((b) => {
    const bd = new Date(b.date).toISOString().split("T")[0];
    return bd === selectedDate && b.status !== "cancelled";
  });

  function shiftDate(days: number) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split("T")[0]);
  }

  function shiftMonth(dir: number) {
    setCalMonth((prev) => {
      let m = prev.month + dir;
      let y = prev.year;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }
      return { year: y, month: m };
    });
  }

  async function handleDrop(bookingId: string, newVehicleType: string) {
    setLocalBookings((prev) =>
      prev.map((b) => b.id === bookingId ? { ...b, vehicleAssigned: newVehicleType } : b)
    );
    await fetch(`/api/admin/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicleAssigned: newVehicleType }),
    });
  }

  const calDays = (() => {
    const first = new Date(calMonth.year, calMonth.month, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(calMonth.year, calMonth.month + 1, 0).getDate();
    const cells: (number | null)[] = Array(startDay).fill(null);
    for (let i = 1; i <= daysInMonth; i++) cells.push(i);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  })();

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-light">Schedule</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setView("day")}
            className={`text-xs px-3 py-1.5 border transition-colors ${view === "day" ? "border-gold text-gold bg-gold/10" : "border-cream/20 text-cream/50 hover:bg-cream/10"}`}
          >
            Day View
          </button>
          <button
            onClick={() => setView("month")}
            className={`text-xs px-3 py-1.5 border transition-colors ${view === "month" ? "border-gold text-gold bg-gold/10" : "border-cream/20 text-cream/50 hover:bg-cream/10"}`}
          >
            Month View
          </button>
        </div>
      </div>

      {view === "day" && (
        <div>
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => shiftDate(-1)} className="text-cream/40 hover:text-cream/70 text-lg px-2">&lsaquo;</button>
            <div className="text-center">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-none text-cream text-center focus:outline-none cursor-pointer"
              />
              <p className="text-xs text-cream/40">
                {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
            <button onClick={() => shiftDate(1)} className="text-cream/40 hover:text-cream/70 text-lg px-2">&rsaquo;</button>
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
              className="text-xs border border-cream/20 text-cream/50 px-2 py-1 hover:bg-cream/10 transition-colors ml-2"
            >
              Today
            </button>
          </div>

          <div className="border border-cream/10 overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Header row */}
              <div className="grid border-b border-cream/10" style={{ gridTemplateColumns: "80px " + vehicles.map(() => "1fr").join(" ") }}>
                <div className="p-2 text-xs text-cream/30 border-r border-cream/10">Time</div>
                {vehicles.map((v) => (
                  <div key={v.id} className="p-2 text-xs text-cream/50 text-center border-r border-cream/10 last:border-r-0">
                    {v.name}
                  </div>
                ))}
              </div>

              {/* Time rows */}
              {hours.map((hour) => (
                <div key={hour} className="grid border-b border-cream/5" style={{ gridTemplateColumns: "80px " + vehicles.map(() => "1fr").join(" ") }}>
                  <div className="p-2 text-xs text-cream/30 border-r border-cream/10">
                    {hour % 12 === 0 ? 12 : hour % 12}:00 {hour < 12 ? "AM" : "PM"}
                  </div>
                  {vehicles.map((v) => {
                    const cellBookings = dayBookings.filter((b) => {
                      const vehicle = b.vehicleAssigned || b.vehicleRequest;
                      if (vehicle !== v.type) return false;
                      const start = timeToHour(b.pickupTime);
                      const end = b.returnTime ? timeToHour(b.returnTime) : start + 2;
                      return start <= hour && end > hour;
                    });
                    const isStart = cellBookings.some((b) => {
                      const start = timeToHour(b.pickupTime);
                      return Math.floor(start) === hour;
                    });
                    return (
                      <div
                        key={v.id}
                        className={`p-1 border-r border-cream/5 last:border-r-0 min-h-[40px] relative transition-colors ${dragId ? "hover:bg-cream/5" : ""}`}
                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const bid = e.dataTransfer.getData("text/plain");
                          if (bid) handleDrop(bid, v.type);
                          setDragId(null);
                        }}
                      >
                        {cellBookings.map((b) => (
                          isStart || Math.floor(timeToHour(b.pickupTime)) === hour ? (
                            <div
                              key={b.id}
                              draggable
                              onDragStart={(e) => { e.dataTransfer.setData("text/plain", b.id); setDragId(b.id); }}
                              onDragEnd={() => setDragId(null)}
                              className={`text-[10px] px-1.5 py-1 border rounded-sm cursor-grab active:cursor-grabbing ${statusColor[b.status] || "bg-cream/10 border-cream/20 text-cream/50"} ${dragId === b.id ? "opacity-50" : ""}`}
                            >
                              <span className="font-medium">{b.userName.split(" ")[0]}</span>
                              <span className="ml-1 opacity-70">{b.pickupTime}{b.returnTime ? `–${b.returnTime}` : ""}</span>
                            </div>
                          ) : null
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {dayBookings.length === 0 && (
            <p className="text-cream/30 text-sm text-center py-8">No bookings scheduled for this day.</p>
          )}
        </div>
      )}

      {view === "month" && (
        <div>
          <div className="flex items-center justify-center gap-6 mb-6">
            <button onClick={() => shiftMonth(-1)} className="text-cream/40 hover:text-cream/70 text-lg px-2">&lsaquo;</button>
            <h3 className="text-lg font-light min-w-[200px] text-center">
              {monthNames[calMonth.month]} {calMonth.year}
            </h3>
            <button onClick={() => shiftMonth(1)} className="text-cream/40 hover:text-cream/70 text-lg px-2">&rsaquo;</button>
          </div>

          <div className="border border-cream/10">
            <div className="grid grid-cols-7 border-b border-cream/10">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="p-2 text-xs text-cream/40 text-center">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {calDays.map((day, i) => {
                if (day === null) return <div key={`e-${i}`} className="p-2 border-b border-r border-cream/5 min-h-[80px]" />;
                const dateStr = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayBks = bookings.filter((b) => {
                  const bd = new Date(b.date).toISOString().split("T")[0];
                  return bd === dateStr && b.status !== "cancelled";
                });
                const isToday = dateStr === new Date().toISOString().split("T")[0];
                return (
                  <button
                    key={`d-${day}`}
                    onClick={() => { setSelectedDate(dateStr); setView("day"); }}
                    className={`p-2 border-b border-r border-cream/5 min-h-[80px] text-left hover:bg-cream/5 transition-colors ${isToday ? "bg-gold/5" : ""}`}
                  >
                    <span className={`text-xs ${isToday ? "text-gold font-medium" : "text-cream/50"}`}>{day}</span>
                    <div className="mt-1 space-y-0.5">
                      {dayBks.slice(0, 3).map((b) => {
                        const vehicle = b.vehicleAssigned || b.vehicleRequest;
                        const color = vehicle === "rolls_royce" ? "bg-gold/30" : "bg-blue-400/30";
                        return (
                          <div key={b.id} className={`${color} rounded-sm px-1 py-0.5 text-[9px] text-cream/70 truncate`}>
                            {b.pickupTime} {b.userName.split(" ")[0]}
                          </div>
                        );
                      })}
                      {dayBks.length > 3 && (
                        <p className="text-[9px] text-cream/30">+{dayBks.length - 3} more</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-4 mt-4 text-xs text-cream/40">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-gold/30" /> Rolls-Royce</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-400/30" /> Escalade</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Dashboard Stats Tab ─── */
function DashboardStatsTab({ bookings, members, inquiries }: { bookings: AdminProps["bookings"]; members: AdminProps["members"]; inquiries: AdminProps["inquiries"] }) {
  const pending = bookings.filter((b) => b.status === "pending").length;
  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  const completed = bookings.filter((b) => b.status === "completed").length;
  const cancelled = bookings.filter((b) => b.status === "cancelled").length;
  const totalMembers = members.length;
  const activeMembers = members.filter((m) => m.membership?.status === "active").length;
  const newInquiries = inquiries.filter((i) => i.status === "new").length;
  const convertedInquiries = inquiries.filter((i) => i.status === "converted").length;

  function exportCSV(type: "bookings" | "members") {
    let csv = "";
    if (type === "bookings") {
      csv = "ID,Member,Email,Date,Pickup Time,Pickup Address,Vehicle Requested,Vehicle Assigned,Status,Passengers\n";
      csv += bookings.map((b) =>
        [b.id, b.userName, b.userEmail, b.date.split("T")[0], b.pickupTime, `"${b.pickupAddress}"`, b.vehicleRequest || "", b.vehicleAssigned || "", b.status, b.passengers].join(",")
      ).join("\n");
    } else {
      csv = "ID,Name,Email,Phone,Program,Status,Trip Count,Joined\n";
      csv += members.map((m) =>
        [m.id, m.name, m.email, m.phone || "", m.membership?.program || "", m.membership?.status || "", m.tripCount, m.createdAt.split("T")[0]].join(",")
      ).join("\n");
    }

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `palm-vintage-${type}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <h2 className="text-lg font-light mb-6">Dashboard</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-cream/5 border border-cream/10 p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-cream/40 mb-1">Total Members</p>
          <p className="text-2xl font-light">{totalMembers}</p>
          <p className="text-xs text-green-400 mt-1">{activeMembers} active</p>
        </div>
        <div className="bg-cream/5 border border-cream/10 p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-cream/40 mb-1">Pending Bookings</p>
          <p className="text-2xl font-light text-yellow-400">{pending}</p>
          <p className="text-xs text-cream/40 mt-1">{confirmed} confirmed</p>
        </div>
        <div className="bg-cream/5 border border-cream/10 p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-cream/40 mb-1">Completed Rides</p>
          <p className="text-2xl font-light">{completed}</p>
          <p className="text-xs text-cream/40 mt-1">{cancelled} cancelled</p>
        </div>
        <div className="bg-cream/5 border border-cream/10 p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-cream/40 mb-1">Inquiries</p>
          <p className="text-2xl font-light">{inquiries.length}</p>
          <p className="text-xs text-cream/40 mt-1">{newInquiries} new / {convertedInquiries} converted</p>
        </div>
      </div>

      <div className="bg-cream/5 border border-cream/10 p-5">
        <h3 className="text-sm uppercase tracking-[0.12em] text-gold/70 mb-4">Export Data</h3>
        <div className="flex gap-3">
          <button
            onClick={() => exportCSV("bookings")}
            className="border border-cream/20 text-cream/60 px-5 py-2.5 text-xs uppercase tracking-[0.12em] hover:bg-cream/10 transition-colors"
          >
            Export Bookings CSV
          </button>
          <button
            onClick={() => exportCSV("members")}
            className="border border-cream/20 text-cream/60 px-5 py-2.5 text-xs uppercase tracking-[0.12em] hover:bg-cream/10 transition-colors"
          >
            Export Members CSV
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Bookings Tab ─── */
function BookingsTab({ bookings, vehicles, isDriver }: { bookings: AdminProps["bookings"]; vehicles: AdminProps["vehicles"]; isDriver: boolean }) {
  const [inspectionBookingId, setInspectionBookingId] = useState<string | null>(null);
  const [viewingInspections, setViewingInspections] = useState<{ bookingId: string; inspections: Inspection[] } | null>(null);

  const conflictMap = new Map<string, string[]>();
  const activeBookings = bookings.filter((b) => b.status !== "cancelled" && b.status !== "completed");
  for (const b of activeBookings) {
    const dateKey = b.date.split("T")[0];
    const existing = conflictMap.get(dateKey) || [];
    existing.push(b.id);
    conflictMap.set(dateKey, existing);
  }

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
              <div className="flex items-center gap-2">
                <p className="font-medium">{b.userName}</p>
                {b.isBirthday && (
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-pink-400/15 text-pink-400 border border-pink-400/30">
                    Birthday Priority
                  </span>
                )}
              </div>
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

          {/* Conflict warning */}
          {b.status === "pending" && (conflictMap.get(b.date.split("T")[0])?.length ?? 0) > 1 && (
            <div className="mt-3 border border-yellow-400/30 bg-yellow-400/5 px-3 py-2 text-xs text-yellow-400">
              Conflict: {(conflictMap.get(b.date.split("T")[0])?.length ?? 0) - 1} other booking(s) on this date. Review times before confirming.
            </div>
          )}

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

              {/* Activity Timeline */}
              <div className="bg-cream/5 border border-cream/10 p-6">
                <h3 className="text-sm uppercase tracking-[0.12em] text-gold/70 mb-4">Activity Timeline</h3>
                <div className="relative pl-6">
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-cream/10" />
                  {(() => {
                    const events: { date: string; type: string; label: string; detail: string; color: string }[] = [];
                    events.push({
                      date: member.createdAt,
                      type: "joined",
                      label: "Joined Palm Vintage",
                      detail: member.membership ? (member.membership.program === "chauffeur" ? "Chauffeur Membership" : "Special Event") : "Member",
                      color: "bg-gold",
                    });
                    if (member.membership) {
                      events.push({
                        date: member.membership.startDate,
                        type: "membership",
                        label: "Membership activated",
                        detail: `${member.membership.program === "chauffeur" ? "Chauffeur" : "Special Event"} · ${member.membership.status}`,
                        color: "bg-green-400",
                      });
                    }
                    member.bookings.forEach((b) => {
                      const statusLabel = b.status === "completed" ? "Completed ride" : b.status === "confirmed" ? "Ride confirmed" : b.status === "cancelled" ? "Ride cancelled" : "Ride requested";
                      events.push({
                        date: b.date,
                        type: "booking",
                        label: statusLabel,
                        detail: `${b.pickupAddress}${b.vehicleAssigned ? ` · ${b.vehicleAssigned === "rolls_royce" ? "Rolls-Royce" : "Escalade"}` : ""}`,
                        color: b.status === "completed" ? "bg-cream/40" : b.status === "confirmed" ? "bg-green-400" : b.status === "cancelled" ? "bg-red-400" : "bg-yellow-400",
                      });
                    });
                    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    return events.slice(0, 15).map((ev, i) => (
                      <div key={i} className="relative mb-4 last:mb-0">
                        <div className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-navy-darkest ${ev.color}`} />
                        <p className="text-xs text-cream/30 mb-0.5">
                          {new Date(ev.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                        <p className="text-sm text-cream/80">{ev.label}</p>
                        <p className="text-xs text-cream/40">{ev.detail}</p>
                      </div>
                    ));
                  })()}
                </div>
              </div>

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

  const total = inquiries.length;
  const converted = inquiries.filter((i) => i.status === "converted").length;
  const contacted = inquiries.filter((i) => i.status === "contacted").length;
  const newCount = inquiries.filter((i) => i.status === "new").length;
  const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(0) : "0";

  const sources = inquiries.reduce<Record<string, number>>((acc, i) => {
    const src = i.source || "direct";
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {});

  const statusColor: Record<string, string> = {
    new: "bg-gold/10 text-gold",
    contacted: "bg-blue-400/10 text-blue-400",
    converted: "bg-green-400/10 text-green-400",
    closed: "bg-cream/10 text-cream/40",
  };

  return (
    <div>
      {/* Conversion Analytics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-cream/5 border border-cream/10 p-4">
          <p className="text-2xl font-light">{total}</p>
          <p className="text-xs text-cream/40">Total Inquiries</p>
        </div>
        <div className="bg-cream/5 border border-cream/10 p-4">
          <p className="text-2xl font-light text-gold">{newCount}</p>
          <p className="text-xs text-cream/40">New</p>
        </div>
        <div className="bg-cream/5 border border-cream/10 p-4">
          <p className="text-2xl font-light text-green-400">{converted}</p>
          <p className="text-xs text-cream/40">Converted</p>
        </div>
        <div className="bg-cream/5 border border-cream/10 p-4">
          <p className="text-2xl font-light">{conversionRate}%</p>
          <p className="text-xs text-cream/40">Conversion Rate</p>
        </div>
      </div>

      {/* Source Breakdown */}
      {Object.keys(sources).length > 1 && (
        <div className="bg-cream/5 border border-cream/10 p-4 mb-6">
          <p className="text-xs uppercase tracking-[0.12em] text-cream/40 mb-3">By Source</p>
          <div className="flex gap-4 flex-wrap">
            {Object.entries(sources).sort((a, b) => b[1] - a[1]).map(([src, count]) => (
              <div key={src} className="flex items-center gap-2">
                <span className="text-sm capitalize">{src}</span>
                <span className="text-xs text-cream/40">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-lg font-light mb-4">Inquiries</h2>
      <div className="space-y-3">
        {inquiries.map((i) => (
          <div key={i.id} className="bg-cream/5 border border-cream/10 p-5">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <p className="font-medium">{i.name}</p>
                <p className="text-xs text-cream/40">
                  {i.email} {i.phone && `· ${i.phone}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {i.source && (
                  <span className="text-[10px] uppercase tracking-wider text-cream/30 border border-cream/10 px-2 py-0.5">
                    {i.source}
                  </span>
                )}
                <span className={`text-xs uppercase tracking-wider px-2 py-1 ${statusColor[i.status] || statusColor.new}`}>
                  {i.status}
                </span>
              </div>
            </div>
            <p className="text-sm text-cream/50 mb-1">
              Interested in: {programLabels[i.program] || i.program}
            </p>
            {i.message && (
              <p className="text-sm text-cream/60 italic mb-3">&ldquo;{i.message}&rdquo;</p>
            )}
            <div className="flex items-center justify-between">
              <p className="text-xs text-cream/30">
                {new Date(i.createdAt).toLocaleDateString()} at{" "}
                {new Date(i.createdAt).toLocaleTimeString()}
                {i.convertedAt && (
                  <span className="text-green-400/50 ml-2">
                    Converted {new Date(i.convertedAt).toLocaleDateString()}
                  </span>
                )}
              </p>
              {i.status !== "converted" && (
                <div className="flex gap-2">
                  {i.status !== "contacted" && (
                    <button
                      onClick={() => updateInquiryStatus(i.id, "contacted")}
                      className="text-[11px] border border-blue-400/40 text-blue-400 px-2.5 py-1 hover:bg-blue-400/10 transition-colors"
                    >
                      Contacted
                    </button>
                  )}
                  <button
                    onClick={() => updateInquiryStatus(i.id, "converted")}
                    className="text-[11px] border border-green-400/40 text-green-400 px-2.5 py-1 hover:bg-green-400/10 transition-colors"
                  >
                    Converted
                  </button>
                  {i.status !== "closed" && (
                    <button
                      onClick={() => updateInquiryStatus(i.id, "closed")}
                      className="text-[11px] border border-cream/15 text-cream/40 px-2.5 py-1 hover:bg-cream/10 transition-colors"
                    >
                      Close
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
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

/* ─── Ratings Tab ─── */
interface RatingItem {
  id: string;
  stars: number;
  comment: string | null;
  createdAt: string;
  memberName: string;
  memberEmail: string;
  memberPhoto: string | null;
  bookingDate: string;
  bookingTime: string;
  vehicle: string | null;
}

function RatingsTab() {
  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/ratings")
      .then((r) => r.json())
      .then((data) => { setRatings(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-cream/40 text-sm">Loading ratings...</p>;

  const avgStars = ratings.length > 0 ? (ratings.reduce((s, r) => s + r.stars, 0) / ratings.length).toFixed(1) : "—";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-light">Member Ratings</h2>
        <div className="flex items-center gap-3">
          <span className="text-cream/40 text-sm">{ratings.length} total</span>
          <span className="text-gold text-lg font-mono">{avgStars} <span className="text-sm">&#9733;</span></span>
        </div>
      </div>

      {ratings.length === 0 ? (
        <p className="text-cream/40 text-sm">No ratings yet.</p>
      ) : (
        <div className="space-y-3">
          {ratings.map((r) => (
            <div key={r.id} className="bg-cream/5 border border-cream/10 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {r.memberPhoto ? (
                    <img src={r.memberPhoto} alt={r.memberName} className="w-10 h-10 rounded-full object-cover border border-cream/10" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-navy-deep border border-cream/10 flex items-center justify-center text-cream/50 text-sm font-mono">
                      {r.memberName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm">{r.memberName}</p>
                    <p className="text-xs text-cream/40">{r.memberEmail}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className={`text-sm ${s <= r.stars ? "text-gold" : "text-cream/20"}`}>&#9733;</span>
                    ))}
                  </div>
                  <p className="text-xs text-cream/40 mt-0.5">
                    {new Date(r.bookingDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} at {r.bookingTime}
                  </p>
                  {r.vehicle && (
                    <p className="text-xs text-cream/30">{r.vehicle === "rolls_royce" ? "Rolls-Royce" : "Escalade"}</p>
                  )}
                </div>
              </div>
              {r.comment && (
                <p className="text-sm text-cream/60 mt-3 italic">&ldquo;{r.comment}&rdquo;</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Admin Events Tab ─── */
interface AdminEvent {
  id: string;
  title: string;
  description: string | null;
  date: string;
  endDate: string | null;
  location: string | null;
  capacity: number | null;
  rsvpCount: number;
  rsvps: { id: string; userName: string; userEmail: string; status: string }[];
}

function AdminEventsTab() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", date: "", endDate: "", location: "", capacity: "" });
  const [form, setForm] = useState({ title: "", description: "", date: "", endDate: "", location: "", capacity: "" });

  useEffect(() => {
    fetch("/api/admin/events")
      .then((r) => r.json())
      .then((data) => { setEvents(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!form.title || !form.date) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const event = await res.json();
        setEvents((prev) => [{ ...event, date: event.date, rsvpCount: 0, rsvps: [] }, ...prev]);
        setForm({ title: "", description: "", date: "", endDate: "", location: "", capacity: "" });
        setCreating(false);
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch("/api/admin/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
      }
    } catch {
      // silent
    }
  }

  function startEditing(e: AdminEvent) {
    setEditingId(e.id);
    setEditForm({
      title: e.title,
      description: e.description || "",
      date: e.date.slice(0, 16),
      endDate: e.endDate?.slice(0, 16) || "",
      location: e.location || "",
      capacity: e.capacity ? String(e.capacity) : "",
    });
    setExpandedId(e.id);
  }

  async function handleUpdate() {
    if (!editingId || !editForm.title || !editForm.date) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...editForm }),
      });
      if (res.ok) {
        const updated = await res.json();
        setEvents((prev) => prev.map((e) =>
          e.id === editingId
            ? { ...e, title: updated.title, description: updated.description, date: updated.date, endDate: updated.endDate, location: updated.location, capacity: updated.capacity }
            : e
        ));
        setEditingId(null);
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full bg-cream/5 border border-cream/15 px-4 py-3 text-cream text-sm focus:outline-none focus:border-gold/50 transition-colors";
  const labelClass = "block text-xs uppercase tracking-[0.12em] text-cream/50 mb-2";

  if (loading) return <p className="text-cream/40 text-sm">Loading events...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-light">Events</h2>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="text-xs border border-gold/40 text-gold px-4 py-2 hover:bg-gold/10 transition-colors"
          >
            + New Event
          </button>
        )}
      </div>

      {creating && (
        <div className="bg-cream/5 border border-cream/10 p-6 mb-6 space-y-4">
          <h3 className="text-sm uppercase tracking-[0.12em] text-gold/70">Create Event</h3>
          <div>
            <label className={labelClass}>Title *</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={`${inputClass} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Date & Time *</label>
              <input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>End Time</label>
              <input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Location</label>
              <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputClass} placeholder="Venue or address" />
            </div>
            <div>
              <label className={labelClass}>Capacity</label>
              <input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className={inputClass} placeholder="Leave empty for unlimited" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreate} disabled={saving || !form.title || !form.date} className="border border-gold/50 text-gold px-5 py-2 text-xs uppercase tracking-[0.12em] hover:bg-gold/10 transition-colors disabled:opacity-50">
              {saving ? "Creating..." : "Create Event"}
            </button>
            <button onClick={() => setCreating(false)} className="border border-cream/20 text-cream/50 px-5 py-2 text-xs uppercase tracking-[0.12em] hover:bg-cream/10 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {events.length === 0 ? (
        <p className="text-cream/40 text-sm">No events created yet.</p>
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <div key={e.id} className="bg-cream/5 border border-cream/10">
              <div className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-sm font-medium">{e.title}</h3>
                  <p className="text-xs text-gold/70 font-mono mt-0.5">
                    {new Date(e.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    {" at "}
                    {new Date(e.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </p>
                  {e.location && <p className="text-xs text-cream/40 mt-0.5">{e.location}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-cream/40">{e.rsvpCount} RSVPs</span>
                  <button
                    onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}
                    className="text-[11px] border border-cream/20 text-cream/50 px-2.5 py-1 hover:bg-cream/10 transition-colors"
                  >
                    {expandedId === e.id ? "Hide" : "Details"}
                  </button>
                  <button
                    onClick={() => startEditing(e)}
                    className="text-[11px] border border-gold/30 text-gold/70 px-2.5 py-1 hover:bg-gold/10 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(e.id)}
                    className="text-[11px] text-red-400/50 hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {expandedId === e.id && (
                <div className="border-t border-cream/10 p-4">
                  {editingId === e.id ? (
                    <div className="space-y-3 mb-4">
                      <div>
                        <label className={labelClass}>Title *</label>
                        <input type="text" value={editForm.title} onChange={(ev) => setEditForm({ ...editForm, title: ev.target.value })} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Description</label>
                        <textarea value={editForm.description} onChange={(ev) => setEditForm({ ...editForm, description: ev.target.value })} rows={2} className={`${inputClass} resize-none`} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>Date & Time *</label>
                          <input type="datetime-local" value={editForm.date} onChange={(ev) => setEditForm({ ...editForm, date: ev.target.value })} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>End Time</label>
                          <input type="datetime-local" value={editForm.endDate} onChange={(ev) => setEditForm({ ...editForm, endDate: ev.target.value })} className={inputClass} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>Location</label>
                          <input type="text" value={editForm.location} onChange={(ev) => setEditForm({ ...editForm, location: ev.target.value })} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Capacity</label>
                          <input type="number" value={editForm.capacity} onChange={(ev) => setEditForm({ ...editForm, capacity: ev.target.value })} className={inputClass} />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={handleUpdate} disabled={saving} className="border border-gold/50 text-gold px-4 py-2 text-xs uppercase tracking-[0.12em] hover:bg-gold/10 transition-colors disabled:opacity-50">
                          {saving ? "Saving..." : "Save Changes"}
                        </button>
                        <button onClick={() => setEditingId(null)} className="border border-cream/20 text-cream/50 px-4 py-2 text-xs uppercase tracking-[0.12em] hover:bg-cream/10 transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    e.description && <p className="text-sm text-cream/60 mb-3">{e.description}</p>
                  )}
                  <p className="text-xs uppercase tracking-[0.12em] text-cream/40 mb-2">RSVPs ({e.rsvps.length})</p>
                  {e.rsvps.length === 0 ? (
                    <p className="text-xs text-cream/30">No RSVPs yet.</p>
                  ) : (
                    <div className="space-y-1">
                      {e.rsvps.map((r) => (
                        <div key={r.id} className="flex items-center justify-between text-sm">
                          <span>{r.userName} <span className="text-cream/30 text-xs">({r.userEmail})</span></span>
                          <span className={`text-xs uppercase ${r.status === "attending" ? "text-green-400" : "text-cream/40"}`}>{r.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
