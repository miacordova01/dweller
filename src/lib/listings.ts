import type { Doc } from "../../convex/_generated/dataModel";

export function formatBeds(bedrooms: number) {
  if (bedrooms === 0) return "Studio";
  return `${bedrooms} bed${bedrooms === 1 ? "" : "s"}`;
}

export function formatBaths(bathrooms: number) {
  return `${bathrooms} bath${bathrooms === 1 ? "" : "s"}`;
}

export function formatRent(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });
}

export function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function parseDate(text: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text.trim());
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const ms = Date.UTC(year, month - 1, day);
  const date = new Date(ms);
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? ms
    : null;
}

const sourceNames: Record<Doc<"listings">["source"], string> = {
  dweller: "Dweller",
  instagram: "Instagram",
  tiktok: "TikTok",
  craigslist: "Craigslist",
  zillow: "Zillow",
  other: "the web",
};

export function sourceName(source: Doc<"listings">["source"]) {
  return sourceNames[source];
}
