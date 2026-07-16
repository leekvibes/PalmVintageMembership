import { prisma } from "./db";
import { sendWaitlistOpening } from "./email";

const BUFFER_MINUTES = 45;
const DEFAULT_RIDE_DURATION = 120;
const MINUTES_PER_DAY = 24 * 60;

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Occupied window for a ride in minutes-from-midnight, crossing-midnight aware. */
function range(pickupTime: string, returnTime: string | null): { start: number; end: number } {
  const start = timeToMinutes(pickupTime);
  let end: number;
  if (returnTime) {
    let ret = timeToMinutes(returnTime);
    if (ret <= start) ret += MINUTES_PER_DAY;
    end = ret;
  } else {
    end = start + DEFAULT_RIDE_DURATION;
  }
  return { start, end: end + BUFFER_MINUTES };
}

function sameDayUTC(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

/**
 * A booking just freed up (cancelled / no-show / declined). Notify waitlisted
 * members whose requested window on the same day overlaps the freed slot and
 * whose vehicle preference is compatible. Each entry is notified at most once.
 */
export async function notifyWaitlistForFreedSlot(freed: {
  date: Date;
  pickupTime: string;
  returnTime: string | null;
  vehicle: string | null; // the vehicle that just freed up (assigned or requested)
}): Promise<number> {
  const dayStart = new Date(freed.date);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(freed.date);
  dayEnd.setUTCHours(23, 59, 59, 999);

  const waiting = await prisma.waitlistEntry.findMany({
    where: {
      status: "waiting",
      date: { gte: dayStart, lte: dayEnd },
    },
    include: { user: { select: { email: true, name: true } } },
  });

  const freedRange = range(freed.pickupTime, freed.returnTime);

  const matches = waiting.filter((w) => {
    if (!sameDayUTC(w.date, freed.date)) return false;
    // Vehicle compatibility: entry with no preference matches anything; otherwise
    // it must want the vehicle that just opened up (if we know which one freed).
    if (w.vehicleRequest && freed.vehicle && w.vehicleRequest !== freed.vehicle) return false;
    const wRange = range(w.pickupTime, w.returnTime);
    return wRange.start < freedRange.end && wRange.end > freedRange.start;
  });

  await Promise.all(
    matches.map(async (w) => {
      await prisma.waitlistEntry.update({
        where: { id: w.id },
        data: { status: "notified", notifiedAt: new Date() },
      });
      await sendWaitlistOpening(w.user.email, {
        userName: w.user.name,
        date: w.date.toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric" }),
        pickupTime: w.pickupTime,
        vehicleRequest: w.vehicleRequest,
      }).catch((err) => console.error("[waitlist] Failed to send opening email:", err));
    })
  );

  return matches.length;
}
