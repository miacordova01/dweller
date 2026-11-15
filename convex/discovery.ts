import { getAuthUserId } from "@convex-dev/auth/server";
import { HOUR, RateLimiter } from "@convex-dev/rate-limiter";
import { ConvexError, v } from "convex/values";
import OpenAI from "openai";
import type { ResponseInputContent } from "openai/resources/responses/responses";

import { components, internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  action,
  env,
  internalMutation,
  mutation,
  query,
  type ActionCtx,
  type MutationCtx,
} from "./_generated/server";

// The discovery agent: turns a rental someone found elsewhere (a screenshot of
// an Instagram or TikTok post, or a link to an ordinary listing page) into a
// draft row in `listings`, and records each extraction in `agentActions`.

const SCREENSHOT_MODEL = "gpt-6.1-sol";
const PAGE_MODEL = "gpt-6-luna";

// Every import is a paid OpenAI call, so imports are capped before any fetch
// or model call: per signed-in user, and across everyone for callers that
// are not signed in (the app has no sign-in flow yet).
const rateLimiter = new RateLimiter(components.rateLimiter, {
  importPerUser: { kind: "token bucket", rate: 20, period: HOUR, capacity: 5 },
  importAnonymous: {
    kind: "token bucket",
    rate: 60,
    period: HOUR,
    capacity: 10,
  },
});

const UPLOAD_MAX_AGE_MS = HOUR;
const PAGE_MAX_BYTES = 2_000_000;
const PAGE_TIMEOUT_MS = 15_000;
const MAX_REDIRECTS = 5;

const importedSource = v.union(
  v.literal("instagram"),
  v.literal("tiktok"),
  v.literal("craigslist"),
  v.literal("zillow"),
  v.literal("other"),
);
type ImportedSource =
  "instagram" | "tiktok" | "craigslist" | "zillow" | "other";

// Every field the agent tries to fill, named as in the listings table. Any of
// these it cannot determine lands in `missingFields`.
const extractedFields = [
  "title",
  "rentMonthlyCents",
  "address",
  "neighborhood",
  "city",
  "bedrooms",
  "bathrooms",
  "availableFrom",
  "description",
] as const;

type Extraction = {
  isRentalListing: boolean;
  platform: ImportedSource;
  title: string | null;
  rentMonthlyDollars: number | null;
  depositDollars: number | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;
  availableFrom: string | null;
  leaseTermMonths: number | null;
  description: string | null;
  amenities: string[];
};

const nullable = (type: "string" | "number", description: string) => ({
  type: [type, "null"],
  description,
});

const extractionSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "isRentalListing",
    "platform",
    "title",
    "rentMonthlyDollars",
    "depositDollars",
    "address",
    "neighborhood",
    "city",
    "bedrooms",
    "bathrooms",
    "squareFeet",
    "availableFrom",
    "leaseTermMonths",
    "description",
    "amenities",
  ],
  properties: {
    isRentalListing: {
      type: "boolean",
      description: "True only if this is a place offered for rent.",
    },
    platform: {
      type: "string",
      enum: ["instagram", "tiktok", "craigslist", "zillow", "other"],
      description:
        "The app or site the listing was posted on, judged from its interface or URL.",
    },
    title: nullable(
      "string",
      "A short card title built only from stated facts, like '1BR with balcony in Echo Park'.",
    ),
    rentMonthlyDollars: nullable("number", "Monthly rent in US dollars."),
    depositDollars: nullable("number", "Security deposit in US dollars."),
    address: nullable(
      "string",
      "The most specific location stated: a street address or cross streets.",
    ),
    neighborhood: nullable("string", "Neighborhood as stated."),
    city: nullable("string", "City."),
    bedrooms: nullable("number", "Bedroom count. 0 for a studio."),
    bathrooms: nullable("number", "Bathroom count; halves allowed."),
    squareFeet: nullable("number", "Interior size in square feet."),
    availableFrom: nullable("string", "Move-in date as YYYY-MM-DD."),
    leaseTermMonths: nullable("number", "Lease length in months."),
    description: nullable(
      "string",
      "One to three plain sentences describing the place, from the listing's own text.",
    ),
    amenities: {
      type: "array",
      items: { type: "string" },
      description: "Short lowercase amenity phrases, like 'in-unit laundry'.",
    },
  },
};

function instructions(today: string) {
  return `You read rental listings that people found outside Dweller and turn them into structured data for a listing card.

Today is ${today}.

Rules:
- Report only what the listing states or clearly shows. Never guess. Use null for anything not stated.
- rentMonthlyDollars is the monthly rent as a plain number: "$2.4k/mo" is 2400. Do not confuse the deposit, a fee, or a weekly price with monthly rent. If several units are offered, use the first one described.
- bedrooms is 0 for a studio and 1 for a single room in a shared home. bathrooms may be a half, like 1.5.
- address is the most specific location given: a street address, or cross streets like "Sunset Blvd & Vermont Ave". Never invent a street from a neighborhood name.
- city may be inferred only when the neighborhood or address names it unambiguously.
- availableFrom is YYYY-MM-DD. "Available now" or "immediately" is today. A month without a day is the 1st of that month. A date without a year is its next occurrence on or after today.
- description is one to three plain sentences in the listing's own terms, without hashtags, emoji, handles, or contact details.
- title is short and factual, built from the bedrooms, a standout feature, and the neighborhood.
- platform comes from the app interface visible in a screenshot (Instagram, TikTok, Craigslist, Zillow) or from the page URL; otherwise "other".
- isRentalListing is false when the content is not a place offered for rent. Then set every other field to null.`;
}

// ------------------------------------------------------------ public API

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => await ctx.storage.generateUploadUrl(),
});

export const importFromScreenshot = action({
  args: { storageId: v.id("_storage") },
  returns: v.id("listings"),
  handler: async (ctx, args): Promise<Id<"listings">> =>
    await runImport(
      ctx,
      "extractListingFromScreenshot",
      args,
      args.storageId,
      async () => {
        const blob = await ctx.storage.get(args.storageId);
        if (blob === null) {
          throw new ConvexError(
            "The screenshot upload could not be found. Try choosing it again.",
          );
        }
        const bytes = new Uint8Array(await blob.arrayBuffer());
        const mimeType = imageMimeType(bytes);
        if (mimeType === null) {
          throw new ConvexError(
            "Dweller can read PNG, JPEG, WebP and GIF images. Take a screenshot of the post and share that instead.",
          );
        }
        if (bytes.length > 20 * 1024 * 1024) {
          throw new ConvexError(
            "That image is larger than 20 MB. Share a screenshot instead.",
          );
        }
        const extraction = await extract(SCREENSHOT_MODEL, [
          {
            type: "input_text",
            text: "Extract the rental listing in this screenshot.",
          },
          {
            type: "input_image",
            image_url: `data:${mimeType};base64,${toBase64(bytes)}`,
            detail: "high",
          },
        ]);
        return {
          extraction,
          model: SCREENSHOT_MODEL,
          source: extraction.platform,
          photoStorageIds: [args.storageId],
          photoUrls: [],
        };
      },
    ),
});

export const importFromUrl = action({
  args: { url: v.string() },
  returns: v.id("listings"),
  handler: async (ctx, args): Promise<Id<"listings">> => {
    const url = parseListingUrl(args.url);
    return await runImport(
      ctx,
      "extractListingFromUrl",
      { url: url.href },
      undefined,
      async () => {
        const html = await fetchPage(url);
        const extraction = await extract(PAGE_MODEL, [
          {
            type: "input_text",
            text: `Extract the rental listing on this page.\n\nURL: ${url.href}\n\nPage content:\n${pageText(html)}`,
          },
        ]);
        const photo = metaContent(html, "og:image");
        return {
          extraction,
          model: PAGE_MODEL,
          source: sourceForHost(url.hostname),
          sourceUrl: url.href,
          photoStorageIds: [],
          photoUrls: photo && /^https:\/\//.test(photo) ? [photo] : [],
        };
      },
    );
  },
});

export const getDraft = query({
  args: { listingId: v.id("listings") },
  handler: async (ctx, { listingId }) => {
    const listing = await ctx.db.get("listings", listingId);
    if (listing === null) return null;
    const storageId = listing.photoStorageIds[0];
    return {
      ...listing,
      screenshotUrl: storageId ? await ctx.storage.getUrl(storageId) : null,
    };
  },
});

// The renter checks the card, fills in what the agent could not find, and
// saves it. Fields left blank stay in missingFields.
export const saveImported = mutation({
  args: {
    listingId: v.id("listings"),
    fields: v.object({
      title: v.optional(v.string()),
      rentMonthlyCents: v.optional(v.number()),
      address: v.optional(v.string()),
      neighborhood: v.optional(v.string()),
      city: v.optional(v.string()),
      bedrooms: v.optional(v.number()),
      bathrooms: v.optional(v.number()),
      availableFrom: v.optional(v.number()),
      description: v.optional(v.string()),
    }),
  },
  returns: v.null(),
  handler: async (ctx, { listingId, fields }) => {
    const listing = await requireImportedDraft(ctx, listingId);
    const patch: Partial<Doc<"listings">> = {};
    for (const key of [
      "title",
      "address",
      "neighborhood",
      "city",
      "description",
    ] as const) {
      const value = fields[key]?.trim();
      if (value) patch[key] = value;
    }
    for (const key of [
      "rentMonthlyCents",
      "bedrooms",
      "bathrooms",
      "availableFrom",
    ] as const) {
      const value = fields[key];
      if (value === undefined) continue;
      if (!Number.isFinite(value) || value < 0) {
        throw new ConvexError(`${key} must be a non-negative number.`);
      }
      patch[key] = value;
    }
    if (
      patch.rentMonthlyCents !== undefined &&
      !Number.isInteger(patch.rentMonthlyCents)
    ) {
      throw new ConvexError("rentMonthlyCents must be whole cents.");
    }
    await ctx.db.patch("listings", listingId, {
      ...patch,
      missingFields: listing.missingFields.filter((field) => !(field in patch)),
      status: "active",
    });
    return null;
  },
});

export const discardImport = mutation({
  args: { listingId: v.id("listings") },
  returns: v.null(),
  handler: async (ctx, { listingId }) => {
    const listing = await requireImportedDraft(ctx, listingId);
    for (const storageId of listing.photoStorageIds) {
      await deleteUpload(ctx, storageId);
    }
    await ctx.db.delete("listings", listingId);
    return null;
  },
});

// ------------------------------------------------------------ internals

export const saveDraft = internalMutation({
  args: {
    tool: v.string(),
    toolArgs: v.any(),
    model: v.string(),
    extraction: v.any(),
    source: importedSource,
    sourceUrl: v.optional(v.string()),
    photoStorageIds: v.array(v.id("_storage")),
    photoUrls: v.array(v.string()),
  },
  returns: v.id("listings"),
  handler: async (ctx, args) => {
    const importedBy = (await getAuthUserId(ctx)) ?? undefined;
    const { fields, missingFields } = toListingFields(
      args.extraction as Extraction,
    );
    const listingId = await ctx.db.insert("listings", {
      ...fields,
      photoStorageIds: args.photoStorageIds,
      photoUrls: args.photoUrls,
      status: "draft",
      source: args.source,
      sourceUrl: args.sourceUrl,
      importedBy,
      missingFields,
    });
    await ctx.db.insert("agentActions", {
      capability: "discovery",
      actorId: importedBy,
      tool: args.tool,
      args: args.toolArgs,
      requiresApproval: false,
      status: "executed",
      result: {
        listingId,
        model: args.model,
        extraction: args.extraction,
        missingFields,
      },
    });
    return listingId;
  },
});

// Runs before any fetch or model call: spends one unit of the import quota
// and, for a screenshot, claims the upload so it backs only this import.
export const beginImport = internalMutation({
  args: { storageId: v.optional(v.id("_storage")) },
  returns: v.null(),
  handler: async (ctx, { storageId }) => {
    const userId = await getAuthUserId(ctx);
    const status = userId
      ? await rateLimiter.limit(ctx, "importPerUser", { key: userId })
      : await rateLimiter.limit(ctx, "importAnonymous");
    if (!status.ok) {
      const minutes = Math.max(1, Math.ceil(status.retryAfter / 60_000));
      throw new ConvexError(
        `You've imported a lot of listings in a short time. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
      );
    }
    if (storageId === undefined) return null;
    const upload = await ctx.db.system.get("_storage", storageId);
    const claimed = await ctx.db
      .query("discoveryUploads")
      .withIndex("by_storage", (q) => q.eq("storageId", storageId))
      .unique();
    if (
      upload === null ||
      claimed !== null ||
      Date.now() - upload._creationTime > UPLOAD_MAX_AGE_MS
    ) {
      throw new ConvexError(
        "That upload can't be used. Choose the screenshot again.",
      );
    }
    await ctx.db.insert("discoveryUploads", { storageId });
    return null;
  },
});

export const recordFailure = internalMutation({
  args: {
    tool: v.string(),
    toolArgs: v.any(),
    error: v.string(),
    storageId: v.optional(v.id("_storage")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.storageId !== undefined) await deleteUpload(ctx, args.storageId);
    await ctx.db.insert("agentActions", {
      capability: "discovery",
      actorId: (await getAuthUserId(ctx)) ?? undefined,
      tool: args.tool,
      args: args.toolArgs,
      requiresApproval: false,
      status: "failed",
      error: args.error,
    });
    return null;
  },
});

type ImportResult = {
  extraction: Extraction;
  model: string;
  source: ImportedSource;
  sourceUrl?: string;
  photoStorageIds: Id<"_storage">[];
  photoUrls: string[];
};

async function runImport(
  ctx: ActionCtx,
  tool: string,
  toolArgs: Record<string, string>,
  storageId: Id<"_storage"> | undefined,
  run: () => Promise<ImportResult>,
): Promise<Id<"listings">> {
  await ctx.runMutation(internal.discovery.beginImport, { storageId });
  try {
    const result = await run();
    if (!result.extraction.isRentalListing) {
      throw new ConvexError(
        "This doesn't look like a rental listing. Try a post or page that shows a place for rent.",
      );
    }
    return await ctx.runMutation(internal.discovery.saveDraft, {
      tool,
      toolArgs,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof ConvexError && typeof error.data === "string"
        ? error.data
        : "Something went wrong reading that listing. Try again.";
    console.error(`${tool} failed`, error);
    await ctx.runMutation(internal.discovery.recordFailure, {
      tool,
      toolArgs,
      error: message,
      storageId,
    });
    throw new ConvexError(message);
  }
}

async function extract(
  model: string,
  content: ResponseInputContent[],
): Promise<Extraction> {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new ConvexError(
      "Listing import isn't set up yet: OPENAI_API_KEY is missing on this Convex deployment. Set it in the Convex dashboard under Settings → Environment Variables.",
    );
  }
  const client = new OpenAI({ apiKey });
  let response;
  try {
    response = await client.responses.create({
      model,
      instructions: instructions(new Date().toISOString().slice(0, 10)),
      input: [{ role: "user", content }],
      text: {
        format: {
          type: "json_schema",
          name: "rental_listing",
          strict: true,
          schema: extractionSchema,
        },
      },
    });
  } catch (error) {
    if (error instanceof OpenAI.APIError && error.status === 401) {
      throw new ConvexError(
        "OpenAI rejected the OPENAI_API_KEY set on this Convex deployment. Update it in the Convex dashboard.",
      );
    }
    if (
      error instanceof OpenAI.APIError &&
      error.type === "insufficient_quota"
    ) {
      throw new ConvexError(
        `The OpenAI account behind OPENAI_API_KEY has no credits for ${model}. Add credits in the OpenAI dashboard and try again.`,
      );
    }
    if (error instanceof OpenAI.APIError && error.status === 429) {
      throw new ConvexError("OpenAI is busy right now. Try again in a minute.");
    }
    throw error;
  }
  if (response.status !== "completed" || !response.output_text) {
    throw new ConvexError(
      "The listing could not be read. Try again, or share a clearer screenshot.",
    );
  }
  return JSON.parse(response.output_text) as Extraction;
}

function toListingFields(x: Extraction) {
  const missingFields: string[] = [];
  const text = (
    field: (typeof extractedFields)[number],
    value: string | null,
  ) => {
    const trimmed = value?.trim();
    if (!trimmed) missingFields.push(field);
    return trimmed || undefined;
  };
  const amount = (
    field: (typeof extractedFields)[number] | null,
    value: number | null,
  ) => {
    if (value === null || !Number.isFinite(value) || value < 0) {
      if (field) missingFields.push(field);
      return undefined;
    }
    return value;
  };
  const cents = (dollars: number | undefined) =>
    dollars === undefined ? undefined : Math.round(dollars * 100);

  const title = text("title", x.title);
  const rentMonthlyCents = cents(
    amount("rentMonthlyCents", x.rentMonthlyDollars),
  );
  const address = text("address", x.address);
  const neighborhood = text("neighborhood", x.neighborhood);
  const city = text("city", x.city);
  const bedrooms = amount("bedrooms", x.bedrooms);
  const bathrooms = amount("bathrooms", x.bathrooms);
  const availableFrom = parseIsoDate(x.availableFrom);
  if (availableFrom === undefined) missingFields.push("availableFrom");
  const description = text("description", x.description);

  return {
    missingFields: extractedFields.filter((field) =>
      missingFields.includes(field),
    ),
    fields: {
      // The schema requires these, so unknown values are stored as empty
      // placeholders and the UI reads missingFields instead of showing them.
      title:
        title ??
        (neighborhood ? `Rental in ${neighborhood}` : "Imported rental"),
      address: address ?? "",
      neighborhood: neighborhood ?? "",
      city: city ?? "",
      rentMonthlyCents: rentMonthlyCents ?? 0,
      bedrooms: bedrooms ?? 0,
      bathrooms: bathrooms ?? 0,
      availableFrom,
      description,
      depositCents: cents(amount(null, x.depositDollars)),
      squareFeet: amount(null, x.squareFeet),
      leaseTermMonths: amount(null, x.leaseTermMonths),
      amenities: x.amenities
        .map((a) => a.trim())
        .filter(Boolean)
        .slice(0, 20),
    },
  };
}

async function deleteUpload(ctx: MutationCtx, storageId: Id<"_storage">) {
  const claim = await ctx.db
    .query("discoveryUploads")
    .withIndex("by_storage", (q) => q.eq("storageId", storageId))
    .unique();
  if (claim === null) return;
  await ctx.db.delete("discoveryUploads", claim._id);
  await ctx.storage.delete(storageId);
}

async function requireImportedDraft(
  ctx: MutationCtx,
  listingId: Id<"listings">,
) {
  const listing = await ctx.db.get("listings", listingId);
  if (
    listing === null ||
    listing.source === "dweller" ||
    listing.status !== "draft"
  ) {
    throw new ConvexError("That imported listing is no longer a draft.");
  }
  if (
    listing.importedBy !== undefined &&
    listing.importedBy !== (await getAuthUserId(ctx))
  ) {
    throw new ConvexError(
      "Only the person who imported this listing can change it.",
    );
  }
  return listing;
}

// ------------------------------------------------------------ helpers

function parseIsoDate(value: string | null) {
  const match = value ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim()) : null;
  if (!match) return undefined;
  const [year, month, day] = match.slice(1).map(Number);
  const ms = Date.UTC(year, month - 1, day);
  return new Date(ms).getUTCDate() === day ? ms : undefined;
}

function imageMimeType(bytes: Uint8Array) {
  const ascii = (start: number, end: number) =>
    String.fromCharCode(...bytes.subarray(start, end));
  if (bytes[0] === 0x89 && ascii(1, 4) === "PNG") return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (ascii(0, 4) === "GIF8") return "image/gif";
  return null;
}

function toBase64(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

const blockedHosts: Record<string, string> = {
  "instagram.com": "Instagram",
  "instagr.am": "Instagram",
  "tiktok.com": "TikTok",
};

function hostIs(hostname: string, domain: string) {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

function sourceForHost(hostname: string): ImportedSource {
  if (hostIs(hostname, "craigslist.org")) return "craigslist";
  if (hostIs(hostname, "zillow.com")) return "zillow";
  return "other";
}

function rejectSocialHost(hostname: string) {
  for (const [domain, name] of Object.entries(blockedHosts)) {
    if (hostIs(hostname, domain)) {
      throw new ConvexError(
        `${name} posts can't be read from a link. Take a screenshot of the post and share that instead.`,
      );
    }
  }
}

function assertPublicUrl(url: URL) {
  const hostname = url.hostname.toLowerCase();
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username !== "" ||
    url.password !== "" ||
    !hostname.includes(".") ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    /^[\d.]+$/.test(hostname) ||
    /^0x/i.test(hostname) ||
    hostname.startsWith("[")
  ) {
    throw new ConvexError("That doesn't look like a public listing page.");
  }
  rejectSocialHost(hostname);
}

function parseListingUrl(raw: string) {
  const trimmed = raw.trim();
  let url: URL;
  try {
    url = new URL(
      /^[a-z]+:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`,
    );
  } catch {
    throw new ConvexError(
      "That doesn't look like a link. Paste the full address of the listing.",
    );
  }
  assertPublicUrl(url);
  return url;
}

// Follows redirects by hand so every hop passes assertPublicUrl, and keeps
// one deadline and a byte cap over the whole download, body included.
async function fetchPage(start: URL) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PAGE_TIMEOUT_MS);
  try {
    let url = start;
    for (let hop = 0; ; hop++) {
      const response = await fetch(url.href, {
        signal: controller.signal,
        redirect: "manual",
        headers: {
          "user-agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1",
          accept: "text/html,application/xhtml+xml",
        },
      });
      const location = response.headers.get("location");
      if (response.status >= 300 && response.status < 400 && location) {
        await response.body?.cancel();
        if (hop >= MAX_REDIRECTS) {
          throw new ConvexError(
            "That link redirects too many times. Share a screenshot instead.",
          );
        }
        url = new URL(location, url);
        assertPublicUrl(url);
        continue;
      }
      if (!response.ok) {
        await response.body?.cancel();
        throw new ConvexError(
          `That page answered with an error (${response.status}). Share a screenshot of the listing instead.`,
        );
      }
      if (!(response.headers.get("content-type") ?? "").includes("html")) {
        await response.body?.cancel();
        throw new ConvexError(
          "That link isn't a web page. Share a screenshot of the listing instead.",
        );
      }
      return await readCapped(response);
    }
  } catch (error) {
    if (error instanceof ConvexError) throw error;
    throw new ConvexError(
      "That page didn't load. Check the link, or share a screenshot instead.",
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function readCapped(response: Response) {
  if (response.body === null) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let bytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    text += decoder.decode(value, { stream: true });
    if (bytes >= PAGE_MAX_BYTES) {
      await reader.cancel();
      break;
    }
  }
  return text;
}

function decodeEntities(text: string) {
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
  };
  return text.replace(
    /&(#x[\da-f]+|#\d+|[a-z]+);/gi,
    (entity, code: string) => {
      if (code[0] !== "#") return named[code.toLowerCase()] ?? entity;
      const n =
        code[1].toLowerCase() === "x"
          ? parseInt(code.slice(2), 16)
          : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000
        ? String.fromCodePoint(n)
        : entity;
    },
  );
}

function metaContent(html: string, property: string) {
  for (const [tag] of html.matchAll(/<meta\s[^>]*>/gi)) {
    const name = /(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    const content = /content\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1];
    if (name?.toLowerCase() === property && content)
      return decodeEntities(content).trim();
  }
  return null;
}

// Listing pages carry the facts in a few places: the title, social meta tags,
// schema.org JSON-LD, and the visible text. Keep those and drop the markup.
function pageText(html: string) {
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "";
  const meta = [...html.matchAll(/<meta\s[^>]*>/gi)]
    .map(([tag]) => tag)
    .filter((tag) => /(og:|twitter:|description|geo\.)/i.test(tag));
  const jsonLd = [
    ...html.matchAll(
      /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ].map((m) => m[1].trim());
  const body = decodeEntities(
    html
      .replace(
        /<(script|style|noscript|svg|head|template)[\s\S]*?<\/\1>/gi,
        " ",
      )
      .replace(/<br\s*\/?>|<\/(p|div|li|h\d|tr|section|article|dd|dt)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
  return [`Title: ${decodeEntities(title).trim()}`, ...meta, ...jsonLd, body]
    .join("\n")
    .slice(0, 60_000);
}
