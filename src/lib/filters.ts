import type { DiscoverFilters } from "../../convex/listings";
import type { RenterAnswers } from "@/features/onboarding/OnboardingProvider";

export type { DiscoverFilters };

const DAY = 86_400_000;

export const priceOptions: { label: string; cents?: number }[] = [
  { label: "Any" },
  { label: "$2,000", cents: 200_000 },
  { label: "$2,500", cents: 250_000 },
  { label: "$3,000", cents: 300_000 },
  { label: "$4,000", cents: 400_000 },
  { label: "$5,000", cents: 500_000 },
];

export const bedroomOptions: { label: string; min?: number; max?: number }[] = [
  { label: "Any" },
  { label: "Studio", min: 0, max: 0 },
  { label: "1", min: 1, max: 1 },
  { label: "2", min: 2, max: 2 },
  { label: "3+", min: 3 },
];

export const moveInOptions: { label: string; days?: number }[] = [
  { label: "Any time" },
  { label: "Within a month", days: 30 },
  { label: "Within 3 months", days: 90 },
  { label: "Within 6 months", days: 180 },
];

const budgetCents: Record<string, number | undefined> = {
  "Under $1,500": 150_000,
  "$1,500–2,500": 250_000,
  "$2,500–4,000": 400_000,
  "$4,000+": undefined,
};

const moveInDays: Record<string, number | undefined> = {
  ASAP: 30,
  "1–3 months": 90,
  "3–6 months": 180,
  "Just browsing": undefined,
};

const citywide = /^(sf|san francisco|anywhere|any)$/i;

export function filtersFromAnswers(
  answers: RenterAnswers,
  now: number,
): DiscoverFilters {
  const location = answers.location
    .trim()
    .replace(/,?\s*(sf|san francisco)$/i, "")
    .trim();
  const beds = bedroomOptions.find((o) => o.label === answers.bedrooms);
  const days = answers.moveIn ? moveInDays[answers.moveIn] : undefined;
  return {
    maxRentCents: answers.budget ? budgetCents[answers.budget] : undefined,
    minBedrooms: beds?.min,
    maxBedrooms: beds?.max,
    neighborhoods:
      location && !citywide.test(location) ? [location] : undefined,
    availableBy: days === undefined ? undefined : now + days * DAY,
  };
}

export function bedroomLabel(f: DiscoverFilters) {
  return bedroomOptions.find(
    (o) =>
      o.min === f.minBedrooms && o.max === f.maxBedrooms && o.label !== "Any",
  )?.label;
}

export function priceLabel(f: DiscoverFilters) {
  return f.maxRentCents === undefined
    ? undefined
    : `Under $${(f.maxRentCents / 100).toLocaleString("en-US")}`;
}

export function moveInLabel(f: DiscoverFilters) {
  return f.availableBy === undefined
    ? undefined
    : `By ${new Date(f.availableBy).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export function activeCount(f: DiscoverFilters) {
  return [
    f.maxRentCents !== undefined,
    f.minBedrooms !== undefined || f.maxBedrooms !== undefined,
    (f.neighborhoods?.length ?? 0) > 0,
    f.availableBy !== undefined,
  ].filter(Boolean).length;
}

export function summary(f: DiscoverFilters) {
  const beds = bedroomLabel(f);
  return [
    beds && (beds === "Studio" ? "Studios" : `${beds} bd`),
    priceLabel(f)?.toLowerCase(),
    f.neighborhoods?.join(", "),
    moveInLabel(f)?.replace("By", "available by"),
  ]
    .filter(Boolean)
    .join(" · ");
}
