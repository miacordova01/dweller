export const demoRenter = { name: "Alex" };

const DAY = 24 * 60 * 60 * 1000;

function addMonths(ms: number, months: number) {
  const date = new Date(ms);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.getTime();
}

export function nextTourAt(now: number) {
  const date = new Date(now);
  date.setHours(14, 0, 0, 0);
  date.setDate(date.getDate() + ((6 - date.getDay() + 7) % 7 || 7));
  return date.getTime();
}

export function demoLease(now: number, termMonths = 12) {
  const today = new Date(now);
  const start = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1);
  return {
    start,
    end: addMonths(start, termMonths) - DAY,
    rentDue: addMonths(start, 1),
    lastPaid: start,
  };
}

export const shortDate = (ms: number) =>
  new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export const longDate = (ms: number) =>
  new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export const tourLabel = (ms: number) =>
  `${new Date(ms).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · ${new Date(ms).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
