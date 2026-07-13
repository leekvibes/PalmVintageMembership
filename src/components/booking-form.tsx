"use client";

import { useState, useEffect, useCallback } from "react";

interface BookingFormProps {
  businessHours: { open: string; close: string };
}

interface VehicleAvailability {
  vehicleId: string;
  vehicleType: string;
  vehicleName: string;
  available: boolean;
}

export function BookingForm({ businessHours }: BookingFormProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [date, setDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [vehicleRequest, setVehicleRequest] = useState("");
  const [availability, setAvailability] = useState<VehicleAvailability[] | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

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
      <p className="text-cream/40 text-sm mb-8">
        Available daily from {businessHours.open} to {businessHours.close}. Our
        team will confirm availability and vehicle assignment.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
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
            className="w-full bg-cream/5 border border-cream/15 px-4 py-3 text-cream focus:outline-none focus:border-gold/50 transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
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
              className="w-full bg-cream/5 border border-cream/15 px-4 py-3 text-cream focus:outline-none focus:border-gold/50 transition-colors"
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
              className="w-full bg-cream/5 border border-cream/15 px-4 py-3 text-cream focus:outline-none focus:border-gold/50 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-[0.12em] text-cream/50 mb-2">
            Pickup Address *
          </label>
          <input
            type="text"
            name="pickupAddress"
            required
            placeholder="Full street address"
            className="w-full bg-cream/5 border border-cream/15 px-4 py-3 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/50 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-[0.12em] text-cream/50 mb-2">
            Drop-off Address *
          </label>
          <input
            type="text"
            name="dropoffAddress"
            required
            placeholder="Full street address for return trip"
            className="w-full bg-cream/5 border border-cream/15 px-4 py-3 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/50 transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-[0.12em] text-cream/50 mb-2">
              Vehicle Preference
            </label>
            <select
              name="vehicleRequest"
              value={vehicleRequest}
              onChange={(e) => setVehicleRequest(e.target.value)}
              className="w-full bg-cream/5 border border-cream/15 px-4 py-3 text-cream focus:outline-none focus:border-gold/50 transition-colors appearance-none"
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
              defaultValue="1"
              className="w-full bg-cream/5 border border-cream/15 px-4 py-3 text-cream focus:outline-none focus:border-gold/50 transition-colors"
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
            placeholder="Any special requests or instructions..."
            className="w-full bg-cream/5 border border-cream/15 px-4 py-3 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/50 transition-colors resize-none"
          />
        </div>

        {status === "error" && (
          <p className="text-red-400 text-sm">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={status === "submitting" || (!!selectedVehicleAvail && !selectedVehicleAvail.available)}
          className="w-full border border-gold/60 text-gold px-8 py-4 text-sm uppercase tracking-[0.14em] hover:bg-gold/10 transition-colors disabled:opacity-50"
        >
          {status === "submitting" ? "Submitting..." : "Request Ride"}
        </button>
      </form>
    </div>
  );
}
