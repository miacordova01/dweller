// Dweller's listings are in San Francisco. Availability rows carry their own
// timezone; this is the fallback for times that have none.
export const DEFAULT_TIMEZONE = "America/Los_Angeles";

const MINUTE = 60_000;

export function zonedParts(ms: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).formatToParts(new Date(ms));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    minuteOfDay: get("hour") * 60 + get("minute"),
  };
}

// Wall-clock time in a timezone to epoch ms. Two passes settle the offset on
// either side of a daylight-saving change.
export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  minuteOfDay: number,
  timeZone: string,
) {
  const wall = Date.UTC(year, month - 1, day, 0, minuteOfDay);
  const offset = (ms: number) => {
    const p = zonedParts(ms, timeZone);
    return Date.UTC(p.year, p.month - 1, p.day, 0, p.minuteOfDay) - Math.floor(ms / MINUTE) * MINUTE;
  };
  const first = wall - offset(wall);
  return wall - offset(first);
}

export function formatLocal(ms: number, timeZone = DEFAULT_TIMEZONE) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ms));
}
