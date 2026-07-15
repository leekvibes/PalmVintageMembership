import { prisma } from "./db";

export const BUFFER_MINUTES = 45;
const DEFAULT_RIDE_DURATION = 120;

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

interface BookingWindow {
  id: string;
  pickupTime: string;
  returnTime: string | null;
  vehicleAssigned: string | null;
  vehicleRequest: string | null;
  status: string;
  userName?: string;
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

function getBookingRange(b: BookingWindow): { start: number; end: number } {
  const start = timeToMinutes(b.pickupTime);
  const end = b.returnTime
    ? timeToMinutes(b.returnTime) + BUFFER_MINUTES
    : start + DEFAULT_RIDE_DURATION + BUFFER_MINUTES;
  return { start, end };
}

export async function checkVehicleConflict(
  date: Date,
  pickupTime: string,
  returnTime: string | null,
  vehicleType: string,
  excludeBookingId?: string
): Promise<ConflictResult> {
  const dayStart = new Date(date);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setUTCHours(23, 59, 59, 999);

  const dayBookings = await prisma.booking.findMany({
    where: {
      date: { gte: dayStart, lte: dayEnd },
      status: { in: ["confirmed", "in_progress"] },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
    include: { user: { select: { name: true } } },
  });

  const requestStart = timeToMinutes(pickupTime);
  const requestEnd = returnTime
    ? timeToMinutes(returnTime) + BUFFER_MINUTES
    : requestStart + DEFAULT_RIDE_DURATION + BUFFER_MINUTES;

  const vehicleTypes = ["rolls_royce", "escalade"];
  const vehicleAvailability: Record<string, { available: boolean; reason?: string }> = {};

  for (const vType of vehicleTypes) {
    const vehicleBookings = dayBookings.filter(
      (b) => (b.vehicleAssigned || b.vehicleRequest) === vType
    );

    const conflict = vehicleBookings.find((b) => {
      const { start, end } = getBookingRange(b);
      return requestStart < end && requestEnd > start;
    });

    if (conflict) {
      const { start, end } = getBookingRange(conflict);
      vehicleAvailability[vType] = {
        available: false,
        reason: `Booked ${minutesToTime(start)}–${minutesToTime(end - BUFFER_MINUTES)} (${conflict.user.name})`,
      };
    } else {
      vehicleAvailability[vType] = { available: true };
    }
  }

  const targetConflict = !vehicleAvailability[vehicleType]?.available;
  const conflictBooking = targetConflict
    ? dayBookings.find((b) => {
        if ((b.vehicleAssigned || b.vehicleRequest) !== vehicleType) return false;
        const { start, end } = getBookingRange(b);
        return requestStart < end && requestEnd > start;
      })
    : undefined;

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
