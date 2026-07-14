"use client";

import { useState, useEffect, useCallback } from "react";

interface BookingFormProps {
  businessHours: { open: string; close: string };
  prefill?: {
    pickupAddress: string;
    dropoffAddress: string;
    vehicleRequest: string;
    passengers: number;
  };
  savedAddresses?: { id: string; label: string; address: string }[];
  ridePreference?: { vehicleRequest: string | null; passengers: number; notes: string | null } | null;
}

interface VehicleAvailability {
  vehicleId: string;
  vehicleType: string;
  vehicleName: string;
  available: boolean;
}

export function BookingForm({ businessHours, prefill, savedAddresses: initialAddresses, ridePreference }: BookingFormProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [date, setDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [vehicleRequest, setVehicleRequest] = useState(prefill?.vehicleRequest || ridePreference?.vehicleRequest || "");
  const [availability, setAvailability] = useState<VehicleAvailability[] | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState(initialAddresses || []);
  const [pickupAddress, setPickupAddress] = useState(prefill?.pickupAddress || "");
  const [dropoffAddress, setDropoffAddress] = useState(prefill?.dropoffAddress || "");

  async function handleSaveAddress(address: string, label: string) {
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, address }),
      });
      if (res.ok) {
        const saved = await res.json();
        setSavedAddresses((prev) => {
          const exists = prev.find((a) => a.id === saved.id);
          if (exists) return prev.map((a) => a.id === saved.id ? saved : a);
          return [saved, ...prev];
        });
      }
    } catch {
      // silent
    }
  }

  const checkAvailability = useCallback(async () => {
    if (!date || !pickupTime) {
      setAvailability(null);
      return;
    }

    setCheckingAvailability(true);
    try {
      const params = new URLSearchParams({ date, pickupTime });
      if (returnTime) params.set("returnTime", returnTime);
      if (vehicleRequest) params.set("vehicleType", vehicleRequest);

      const res = await fetch(`/api/bookings/availability?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAvailability(data.availability);
      }
    } catch {
      // silent — don't block booking
    } finally {
      setCheckingAvailability(false);
    }
  }, [date, pickupTime, returnTime, vehicleRequest]);

  useEffect(() => {
    const timer = setTimeout(checkAvailability, 400);
    return () => clearTimeout(timer);
  }, [checkAvailability]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to book");
      }

      setStatus("success");
      form.reset();
      setDate("");
      setPickupTime("");
      setReturnTime("");
      setVehicleRequest("");
      setAvailability(null);
      setPickupAddress("");
      setDropoffAddress("");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full border border-gold/40 flex items-center justify-center mx-auto mb-6">
          <span className="text-gold text-2xl">&#10003;</span>
        </div>
        <h3 className="text-2xl font-light mb-3">Ride Requested</h3>
        <p className="text-cream/60 mb-6">
          Our team will confirm your booking shortly.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="text-gold text-sm hover:text-gold-bright transition-colors"
        >
          Book another ride
        </button>
      </div>
    );
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const selectedVehicleAvail = vehicleRequest && availability
    ? availability.find((a) => a.vehicleType === vehicleRequest)
    : null;

  const anyUnavailable = availability?.some((a) => !a.available);

  return (
    <div>
      <h2 className="text-lg font-light mb-2">Book a Ride</h2>
      <p className="text-cream/40 text-sm mb-6">
        Available daily from {businessHours.open} to {businessHours.close}. Our
        team will confirm availability and vehicle assignment.
      </p>

      <AvailabilityCalendar
        selectedDate={date}
        onSelectDate={(d) => setDate(d)}
      />

      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 max-w-lg mt-8">
        <div>
          <label className="block text-xs uppercase tracking-[0.12em] text-cream/50 mb-2">
            Date *
          </label>
          <input
            type="date"
            name="date"
            required
            min={minDate}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-cream/5 border border-cream/15 px-4 py-3.5 sm:py-3 text-cream text-base sm:text-sm focus:outline-none focus:border-gold/50 transition-colors rounded-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs uppercase tracking-[0.12em] text-cream/50 mb-2">
              Pickup Time *
            </label>
            <input
              type="time"
              name="pickupTime"
              required
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className="w-full bg-cream/5 border border-cream/15 px-4 py-3.5 sm:py-3 text-cream text-base sm:text-sm focus:outline-none focus:border-gold/50 transition-colors rounded-none"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-[0.12em] text-cream/50 mb-2">
              Return Time
            </label>
            <input
              type="time"
              name="returnTime"
              value={returnTime}
              onChange={(e) => setReturnTime(e.target.value)}
              className="w-full bg-cream/5 border border-cream/15 px-4 py-3.5 sm:py-3 text-cream text-base sm:text-sm focus:outline-none focus:border-gold/50 transition-colors rounded-none"
            />
          </div>
        </div>

        <AddressField
          label="Pickup Address *"
          name="pickupAddress"
          value={pickupAddress}
          onChange={setPickupAddress}
          savedAddresses={savedAddresses}
          onSave={handleSaveAddress}
          placeholder="Full street address"
        />

        <AddressField
          label="Drop-off Address *"
          name="dropoffAddress"
          value={dropoffAddress}
          onChange={setDropoffAddress}
          savedAddresses={savedAddresses}
          onSave={handleSaveAddress}
          placeholder="Full street address for return trip"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs uppercase tracking-[0.12em] text-cream/50 mb-2">
              Vehicle Preference
            </label>
            <select
              name="vehicleRequest"
              value={vehicleRequest}
              onChange={(e) => setVehicleRequest(e.target.value)}
              className="w-full bg-cream/5 border border-cream/15 px-4 py-3.5 sm:py-3 text-cream text-base sm:text-sm focus:outline-none focus:border-gold/50 transition-colors appearance-none rounded-none"
            >
              <option value="" className="bg-navy-darkest">
                No preference
              </option>
              <option value="rolls_royce" className="bg-navy-darkest">
                Rolls-Royce
              </option>
              <option value="escalade" className="bg-navy-darkest">
                Cadillac Escalade
              </option>
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-[0.12em] text-cream/50 mb-2">
              Passengers
            </label>
            <input
              type="number"
              name="passengers"
              min="1"
              max="6"
              defaultValue={prefill?.passengers || ridePreference?.passengers || 1}
              className="w-full bg-cream/5 border border-cream/15 px-4 py-3.5 sm:py-3 text-cream text-base sm:text-sm focus:outline-none focus:border-gold/50 transition-colors rounded-none"
            />
          </div>
        </div>

        {/* Availability indicator */}
        {date && pickupTime && availability && (
          <div className={`border p-4 text-sm ${
            selectedVehicleAvail && !selectedVehicleAvail.available
              ? "border-red-400/30 bg-red-400/5"
              : anyUnavailable
              ? "border-yellow-400/30 bg-yellow-400/5"
              : "border-green-400/30 bg-green-400/5"
          }`}>
            {checkingAvailability ? (
              <p className="text-cream/50">Checking availability...</p>
            ) : (
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.12em] text-cream/50 mb-2">Vehicle Availability</p>
                {availability.map((a) => (
                  <div key={a.vehicleId} className="flex items-center justify-between">
                    <span className="text-cream/70">{a.vehicleName}</span>
                    {a.available ? (
                      <span className="text-green-400 text-xs uppercase tracking-wider">Available</span>
                    ) : (
                      <span className="text-red-400 text-xs uppercase tracking-wider">Booked</span>
                    )}
                  </div>
                ))}
                {selectedVehicleAvail && !selectedVehicleAvail.available && (
                  <p className="text-red-400 text-xs mt-2">
                    This vehicle is not available at your selected time. Please choose a different time or vehicle.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs uppercase tracking-[0.12em] text-cream/50 mb-2">
            Notes
          </label>
          <textarea
            name="notes"
            rows={3}
            defaultValue={ridePreference?.notes || ""}
            placeholder="Any special requests or instructions..."
            className="w-full bg-cream/5 border border-cream/15 px-4 py-3.5 sm:py-3 text-cream text-base sm:text-sm placeholder:text-cream/30 focus:outline-none focus:border-gold/50 transition-colors resize-none rounded-none"
          />
        </div>

        {status === "error" && (
          <p className="text-red-400 text-sm">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={status === "submitting" || (!!selectedVehicleAvail && !selectedVehicleAvail.available)}
          className="w-full border border-gold/60 text-gold px-8 py-4.5 sm:py-4 text-base sm:text-sm uppercase tracking-[0.14em] hover:bg-gold/10 active:bg-gold/20 transition-colors disabled:opacity-50"
        >
          {status === "submitting" ? "Submitting..." : "Request Ride"}
        </button>
      </form>
    </div>
  );
}

/* ─── Availability Calendar ─── */
interface CalendarDay {
  date: string;
  status: "open" | "partial" | "full";
}

function AvailabilityCalendar({
  selectedDate,
  onSelectDate,
}: {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(false);

  const monthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/bookings/calendar?month=${monthKey}`)
      .then((r) => r.json())
      .then((data) => { setDays(data.days || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [monthKey]);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const isPastMonth = viewYear < today.getFullYear() || (viewYear === today.getFullYear() && viewMonth < today.getMonth());

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="max-w-lg mb-2">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={prevMonth}
          disabled={isPastMonth}
          className="text-cream/40 hover:text-cream/70 transition-colors disabled:opacity-30 px-2 py-1"
        >
          &#8592;
        </button>
        <p className="text-sm font-light tracking-wide">{monthLabel}</p>
        <button
          type="button"
          onClick={nextMonth}
          className="text-cream/40 hover:text-cream/70 transition-colors px-2 py-1"
        >
          &#8594;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-center text-[10px] uppercase tracking-wider text-cream/30 py-1.5">{d}</div>
        ))}

        {Array.from({ length: firstDayOfMonth }, (_, i) => (
          <div key={`pad-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateStr = `${monthKey}-${String(day).padStart(2, "0")}`;
          const isPast = dateStr <= todayStr;
          const dayData = days.find((d) => d.date === dateStr);
          const status = dayData?.status || "open";
          const isSelected = dateStr === selectedDate;

          const dotColor =
            status === "open" ? "bg-green-400" :
            status === "partial" ? "bg-gold" :
            "bg-red-400/70";

          return (
            <button
              key={day}
              type="button"
              disabled={isPast}
              onClick={() => onSelectDate(dateStr)}
              className={`relative flex flex-col items-center py-2 sm:py-2.5 transition-colors ${
                isPast
                  ? "text-cream/15 cursor-not-allowed"
                  : isSelected
                  ? "bg-gold/15 text-gold"
                  : status === "full"
                  ? "text-cream/30 hover:bg-cream/5"
                  : "text-cream/70 hover:bg-cream/5"
              }`}
            >
              <span className="text-sm">{day}</span>
              {!isPast && !loading && (
                <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${dotColor}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 justify-center">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-[10px] text-cream/40">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-gold" />
          <span className="text-[10px] text-cream/40">Partial</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400/70" />
          <span className="text-[10px] text-cream/40">Fully Booked</span>
        </div>
      </div>

      {loading && (
        <p className="text-center text-xs text-cream/30 mt-2">Loading availability...</p>
      )}
    </div>
  );
}

/* ─── Address Field with Saved Addresses ─── */
function AddressField({
  label,
  name,
  value,
  onChange,
  savedAddresses,
  onSave,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  savedAddresses: { id: string; label: string; address: string }[];
  onSave: (address: string, label: string) => void;
  placeholder: string;
}) {
  const [showSave, setShowSave] = useState(false);
  const [saveLabel, setSaveLabel] = useState("");

  const isSaved = savedAddresses.some((a) => a.address === value);

  return (
    <div>
      <label className="block text-xs uppercase tracking-[0.12em] text-cream/50 mb-2">
        {label}
      </label>
      {savedAddresses.length > 0 && (
        <select
          onChange={(e) => { if (e.target.value) onChange(e.target.value); }}
          value=""
          className="w-full bg-cream/5 border border-cream/15 px-4 py-2 text-cream text-xs focus:outline-none focus:border-gold/50 transition-colors appearance-none rounded-none mb-1.5"
        >
          <option value="" className="bg-navy-darkest">Select saved address...</option>
          {savedAddresses.map((a) => (
            <option key={a.id} value={a.address} className="bg-navy-darkest">
              {a.label} — {a.address.slice(0, 40)}{a.address.length > 40 ? "..." : ""}
            </option>
          ))}
        </select>
      )}
      <div className="flex gap-1.5">
        <input
          type="text"
          name={name}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-cream/5 border border-cream/15 px-4 py-3.5 sm:py-3 text-cream text-base sm:text-sm placeholder:text-cream/30 focus:outline-none focus:border-gold/50 transition-colors rounded-none"
        />
        {value && !isSaved && (
          <button
            type="button"
            onClick={() => setShowSave(!showSave)}
            className="border border-cream/15 px-2.5 text-cream/40 hover:text-gold hover:border-gold/40 transition-colors text-xs"
            title="Save this address"
          >
            +
          </button>
        )}
      </div>
      {showSave && (
        <div className="flex gap-1.5 mt-1.5">
          <input
            type="text"
            value={saveLabel}
            onChange={(e) => setSaveLabel(e.target.value)}
            placeholder="Label (e.g. Home, Office)"
            className="flex-1 bg-cream/5 border border-cream/15 px-3 py-2 text-cream text-xs placeholder:text-cream/30 focus:outline-none focus:border-gold/50 transition-colors rounded-none"
          />
          <button
            type="button"
            onClick={() => {
              if (saveLabel && value) {
                onSave(value, saveLabel);
                setShowSave(false);
                setSaveLabel("");
              }
            }}
            className="border border-gold/40 text-gold px-3 py-2 text-xs hover:bg-gold/10 transition-colors"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}
