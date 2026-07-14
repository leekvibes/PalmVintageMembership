"use client";

import { useState } from "react";

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

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export function BookingForm({ businessHours, prefill, savedAddresses: initialAddresses, ridePreference }: BookingFormProps) {
  const [status, setStatus] = useState<"idle" | "review" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [date, setDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [vehicleRequest, setVehicleRequest] = useState(prefill?.vehicleRequest || ridePreference?.vehicleRequest || "");
  const [passengers, setPassengers] = useState(prefill?.passengers || ridePreference?.passengers || 1);
  const [notes, setNotes] = useState(ridePreference?.notes || "");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState("weekly");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
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

  function handleReview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("review");
  }

  async function handleConfirmSubmit() {
    setStatus("submitting");
    setErrorMsg("");

    const data = {
      date,
      pickupTime,
      returnTime: returnTime || undefined,
      pickupAddress,
      dropoffAddress,
      vehicleRequest: vehicleRequest || undefined,
      passengers,
      notes: notes || undefined,
      isRecurring: isRecurring || undefined,
      recurrenceRule: isRecurring ? recurrenceRule : undefined,
      recurrenceEndDate: isRecurring ? recurrenceEndDate : undefined,
    };

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
        <p className="text-cream/60 mb-3">
          Your ride request has been submitted. You will receive a confirmation
          to the portal and via email within 6 hours.
        </p>
        <p className="text-cream/40 text-sm mb-6">
          If there is a scheduling conflict, we will notify you to pick a
          different time or you can email Palm directly for alternatives.
        </p>
        <button
          onClick={() => {
            setStatus("idle");
            setDate("");
            setPickupTime("");
            setReturnTime("");
            setVehicleRequest("");
            setPassengers(1);
            setNotes("");
            setIsRecurring(false);
            setRecurrenceRule("weekly");
            setRecurrenceEndDate("");
            setPickupAddress("");
            setDropoffAddress("");
          }}
          className="text-gold text-sm hover:text-gold-bright transition-colors"
        >
          Book another ride
        </button>
      </div>
    );
  }

  const vehicleLabel = vehicleRequest === "rolls_royce" ? "Rolls-Royce" : vehicleRequest === "escalade" ? "Cadillac Escalade" : "No preference";

  if (status === "review" || status === "submitting") {
    return (
      <div className="max-w-lg">
        <h2 className="text-lg font-light mb-2">Review Your Ride Request</h2>
        <p className="text-cream/40 text-sm mb-6">
          Please confirm the details below before submitting.
        </p>

        <div className="border border-cream/15 divide-y divide-cream/10">
          <ReviewRow label="Date" value={new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} />
          <ReviewRow label="Pickup Time" value={formatTime(pickupTime)} />
          {returnTime && <ReviewRow label="Return Time" value={formatTime(returnTime)} />}
          <ReviewRow label="Pickup Address" value={pickupAddress} />
          {dropoffAddress && <ReviewRow label="Drop-off Address" value={dropoffAddress} />}
          <ReviewRow label="Vehicle Preference" value={vehicleLabel} />
          <ReviewRow label="Passengers" value={String(passengers)} />
          {notes && <ReviewRow label="Notes" value={notes} />}
          {isRecurring && (
            <ReviewRow label="Recurring" value={`${recurrenceRule === "weekly" ? "Every week" : "Every 2 weeks"} until ${new Date(recurrenceEndDate + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`} />
          )}
        </div>

        <div className="bg-cream/5 border border-cream/15 p-4 mt-4 text-sm text-cream/60">
          After submitting, our team will confirm your ride within 6 hours.
          You will be notified via the portal and email once confirmed.
        </div>

        {errorMsg && <p className="text-red-400 text-sm mt-3">{errorMsg}</p>}

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleConfirmSubmit}
            disabled={status === "submitting"}
            className="flex-1 border border-gold/60 text-gold px-8 py-4 text-sm uppercase tracking-[0.14em] hover:bg-gold/10 active:bg-gold/20 transition-colors disabled:opacity-50"
          >
            {status === "submitting" ? "Submitting..." : "Confirm & Submit"}
          </button>
          <button
            onClick={() => { setStatus("idle"); setErrorMsg(""); }}
            disabled={status === "submitting"}
            className="border border-cream/20 text-cream/50 px-6 py-4 text-sm uppercase tracking-[0.14em] hover:bg-cream/10 transition-colors disabled:opacity-50"
          >
            Edit
          </button>
        </div>
      </div>
    );
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <div>
      <h2 className="text-lg font-light mb-2">Book a Ride</h2>
      <p className="text-cream/40 text-sm mb-6">
        Available daily from {businessHours.open} to {businessHours.close}. Our
        team will confirm your ride within 6 hours.
      </p>

      <DatePicker
        selectedDate={date}
        onSelectDate={(d) => setDate(d)}
      />

      <form onSubmit={handleReview} className="space-y-5 sm:space-y-6 max-w-lg mt-8">
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
              value={passengers}
              onChange={(e) => setPassengers(Number(e.target.value))}
              className="w-full bg-cream/5 border border-cream/15 px-4 py-3.5 sm:py-3 text-cream text-base sm:text-sm focus:outline-none focus:border-gold/50 transition-colors rounded-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-[0.12em] text-cream/50 mb-2">
            Notes
          </label>
          <textarea
            name="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special requests or instructions..."
            className="w-full bg-cream/5 border border-cream/15 px-4 py-3.5 sm:py-3 text-cream text-base sm:text-sm placeholder:text-cream/30 focus:outline-none focus:border-gold/50 transition-colors resize-none rounded-none"
          />
        </div>

        <div className="border border-cream/10 p-4">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="accent-gold"
            />
            <span className="text-sm text-cream/70">Make this a recurring ride</span>
          </label>

          {isRecurring && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-[0.12em] text-cream/50 mb-2">
                  Frequency
                </label>
                <select
                  value={recurrenceRule}
                  onChange={(e) => setRecurrenceRule(e.target.value)}
                  className="w-full bg-cream/5 border border-cream/15 px-4 py-3 text-cream text-sm focus:outline-none focus:border-gold/50 transition-colors appearance-none rounded-none"
                >
                  <option value="weekly" className="bg-navy-darkest">Weekly</option>
                  <option value="biweekly" className="bg-navy-darkest">Every 2 weeks</option>
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-[0.12em] text-cream/50 mb-2">
                  Until
                </label>
                <input
                  type="date"
                  required={isRecurring}
                  value={recurrenceEndDate}
                  onChange={(e) => setRecurrenceEndDate(e.target.value)}
                  className="w-full bg-cream/5 border border-cream/15 px-4 py-3 text-cream text-sm focus:outline-none focus:border-gold/50 transition-colors rounded-none"
                />
              </div>
            </div>
          )}
        </div>

        {status === "error" && (
          <p className="text-red-400 text-sm">{errorMsg}</p>
        )}

        <button
          type="submit"
          className="w-full border border-gold/60 text-gold px-8 py-4.5 sm:py-4 text-base sm:text-sm uppercase tracking-[0.14em] hover:bg-gold/10 active:bg-gold/20 transition-colors"
        >
          Review & Submit
        </button>
      </form>
    </div>
  );
}

/* ─── Review Row ─── */
function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start px-4 py-3">
      <span className="text-xs uppercase tracking-[0.12em] text-cream/50">{label}</span>
      <span className="text-sm text-cream/80 text-right max-w-[60%]">{value}</span>
    </div>
  );
}

/* ─── Date Picker Calendar ─── */
function DatePicker({
  selectedDate,
  onSelectDate,
}: {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const monthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;

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
          const isSelected = dateStr === selectedDate;

          return (
            <button
              key={day}
              type="button"
              disabled={isPast}
              onClick={() => onSelectDate(dateStr)}
              className={`flex items-center justify-center py-2.5 sm:py-3 transition-colors ${
                isPast
                  ? "text-cream/15 cursor-not-allowed"
                  : isSelected
                  ? "bg-gold/15 text-gold"
                  : "text-cream/70 hover:bg-cream/5"
              }`}
            >
              <span className="text-sm">{day}</span>
            </button>
          );
        })}
      </div>
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
