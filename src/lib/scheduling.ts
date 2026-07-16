import { prisma } from "./db";

export const BUFFER_MINUTES = 45;
const DEFAULT_RIDE_DURATION = 120;
const MINUTES_PER_DAY = 24 * 60;

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  // Normalize into a single day for display (handles values past midnight).
  const normalized = ((mins % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

/** Midnight (UTC) of a given date, in ms. */
function dayEpoch(date: Date): number {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

interface BookingWindow {
  id: string;
  date: Date;
  pickupTime: string;
  returnTime: string | null;
  vehicleAssigned: string | null;
  vehicleRequest: string | null;
  status: string;
  user: { name: string };
}

export interface ConflictResult {
  hasConflict: boolean;
  conflictingBooking?: {
    id: string;
    userName: string;
    pickupTime: string;
    returnTime: string | null;
  };
  availableVehicles: string[];
  vehicleAvailability: Record<string, { available: boolean; reason?: string }>;
}

/**
 * Absolute occupied interval for a ride, in minutes measured from `originEpoch`
 * (midnight of the reference day). Rides whose return time is earlier than their
 * pickup time are treated as crossing midnight (+24h). The buffer is applied to
 * the tail so back-to-back rides are blocked.
 */
function absoluteRange(
  date: Date,
  pickupTime: string,
  returnTime: string | null,
  originEpoch: number
): { start: number; end: number } {
  const dayOffsetMin = (dayEpoch(date) - originEpoch) / 60000;
  const start = dayOffsetMin + timeToMinutes(pickupTime);

  let durationEnd: number;
  if (returnTime) {
    let ret = timeToMinutes(returnTime);
    // Return earlier than pickup ⇒ ride crosses midnight into the next day.
    if (ret <= timeToMinutes(pickupTime)) ret += MINUTES_PER_DAY;
    durationEnd = dayOffsetMin + ret;
  } else {
    durationEnd = start + DEFAULT_RIDE_DURATION;
  }

  return { start, end: durationEnd + BUFFER_MINUTES };
}

export async function checkVehicleConflict(
  date: Date,
  pickupTime: string,
  returnTime: string | null,
  vehicleType: string,
  excludeBookingId?: string,
  options?: { includePending?: boolean }
): Promise<ConflictResult> {
  const originEpoch = dayEpoch(date);

  // A ride the day before can bleed past midnight into this day, and a ride we
  // are placing can bleed into the next day. Fetch a ±1 day window so no
  // cross-midnight overlap is missed.
  const windowStart = new Date(originEpoch - MINUTES_PER_DAY * 60000);
  const windowEnd = new Date(originEpoch + 2 * MINUTES_PER_DAY * 60000 - 1);

  const statuses = options?.includePending
    ? ["pending", "confirmed", "in_progress"]
    : ["confirmed", "in_progress"];

  const dayBookings = (await prisma.booking.findMany({
    where: {
      date: { gte: windowStart, lte: windowEnd },
      status: { in: statuses },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
    include: { user: { select: { name: true } } },
  })) as unknown as BookingWindow[];

  const request = absoluteRange(date, pickupTime, returnTime, originEpoch);

  const vehicleTypes = ["rolls_royce", "escalade"];
  const vehicleAvailability: Record<string, { available: boolean; reason?: string }> = {};
  const conflictByVehicle: Record<string, BookingWindow | undefined> = {};

  for (const vType of vehicleTypes) {
    const vehicleBookings = dayBookings.filter(
      (b) => (b.vehicleAssigned || b.vehicleRequest) === vType
    );

    const conflict = vehicleBookings.find((b) => {
      const r = absoluteRange(b.date, b.pickupTime, b.returnTime, originEpoch);
      return request.start < r.end && request.end > r.start;
    });

    conflictByVehicle[vType] = conflict;

    if (conflict) {
      const r = absoluteRange(conflict.date, conflict.pickupTime, conflict.returnTime, originEpoch);
      vehicleAvailability[vType] = {
        available: false,
        reason: `Booked ${minutesToTime(r.start)}–${minutesToTime(r.end - BUFFER_MINUTES)} (${conflict.user.name})`,
      };
    } else {
      vehicleAvailability[vType] = { available: true };
    }
  }

  const targetConflict = !vehicleAvailability[vehicleType]?.available;
  const conflictBooking = targetConflict ? conflictByVehicle[vehicleType] : undefined;

  return {
    hasConflict: targetConflict,
    conflictingBooking: conflictBooking
      ? {
          id: conflictBooking.id,
          userName: conflictBooking.user.name,
          pickupTime: conflictBooking.pickupTime,
          returnTime: conflictBooking.returnTime,
        }
      : undefined,
    availableVehicles: vehicleTypes.filter((v) => vehicleAvailability[v].available),
    vehicleAvailability,
  };
}
