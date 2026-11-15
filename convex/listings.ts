import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { internalMutation, mutation, query, type QueryCtx } from "./_generated/server";
import { listingSource } from "./schema";

const FEED_LIMIT = 100;

const importedSources = listingSource.members
  .map((member) => member.value)
  .filter((source) => source !== "dweller");

async function withPhotoUrls(ctx: QueryCtx, listings: Doc<"listings">[]) {
  return await Promise.all(
    listings.map(async (listing) => {
      const storageId = listing.photoStorageIds[0];
      return {
        ...listing,
        photoUrl:
          listing.photoUrls[0] ?? (storageId ? await ctx.storage.getUrl(storageId) : null),
      };
    }),
  );
}

export const discover = query({
  args: {},
  handler: async (ctx) => {
    const listings = await ctx.db
      .query("listings")
      .withIndex("by_source", (q) => q.eq("source", "dweller"))
      .order("desc")
      .filter((q) => q.neq(q.field("status"), "draft"))
      .take(FEED_LIMIT);
    return await withPhotoUrls(ctx, listings);
  },
});

export const myFinds = query({
  args: {},
  handler: async (ctx) => {
    // There is no sign-in flow yet, so importedBy is unset on every import and
    // a signed-out caller sees all imported listings. Once auth lands, the
    // importedBy filter below becomes authoritative and this fallback should go.
    const userId = await getAuthUserId(ctx);
    if (userId !== null) {
      const listings = await ctx.db
        .query("listings")
        .withIndex("by_imported_by", (q) => q.eq("importedBy", userId))
        .order("desc")
        .filter((q) =>
          q.and(q.neq(q.field("source"), "dweller"), q.neq(q.field("status"), "draft")),
        )
        .take(FEED_LIMIT);
      return await withPhotoUrls(ctx, listings);
    }
    const perSource = await Promise.all(
      importedSources.map((source) =>
        ctx.db
          .query("listings")
          .withIndex("by_source", (q) => q.eq("source", source))
          .order("desc")
          .filter((q) => q.neq(q.field("status"), "draft"))
          .take(FEED_LIMIT),
      ),
    );
    const listings = perSource
      .flat()
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, FEED_LIMIT);
    return await withPhotoUrls(ctx, listings);
  },
});

export const add = mutation({
  args: {
    title: v.string(),
    address: v.string(),
    neighborhood: v.string(),
    city: v.string(),
    rentMonthlyCents: v.number(),
    bedrooms: v.number(),
    bathrooms: v.number(),
    availableFrom: v.optional(v.number()),
    photoUrl: v.optional(v.string()),
  },
  returns: v.id("listings"),
  handler: async (ctx, { photoUrl, ...args }) => {
    const listing = {
      ...args,
      title: args.title.trim(),
      address: args.address.trim(),
      neighborhood: args.neighborhood.trim(),
      city: args.city.trim(),
    };
    for (const field of ["title", "address", "neighborhood", "city"] as const) {
      if (listing[field] === "") throw new ConvexError(`${field} is required.`);
    }
    if (!Number.isInteger(listing.rentMonthlyCents) || listing.rentMonthlyCents < 0) {
      throw new ConvexError("rentMonthlyCents must be a non-negative integer.");
    }
    for (const field of ["bedrooms", "bathrooms"] as const) {
      if (!Number.isFinite(listing[field]) || listing[field] < 0) {
        throw new ConvexError(`${field} must be a non-negative number.`);
      }
    }
    if (listing.availableFrom !== undefined && !Number.isFinite(listing.availableFrom)) {
      throw new ConvexError("availableFrom must be a timestamp.");
    }
    const trimmedPhotoUrl = photoUrl?.trim();
    return await ctx.db.insert("listings", {
      ...listing,
      amenities: [],
      photoStorageIds: [],
      photoUrls: trimmedPhotoUrl ? [trimmedPhotoUrl] : [],
      status: "active",
      source: "dweller",
      missingFields: [],
    });
  },
});

export const seed = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    if ((await ctx.db.query("listings").first()) !== null) return 0;
    const listings = [
      {
        title: "Sunny garden-level studio ADU",
        address: "1452 Diamond St",
        neighborhood: "Noe Valley",
        rentMonthlyCents: 245000,
        bedrooms: 0,
        bathrooms: 1,
        availableFrom: Date.UTC(2026, 11, 1),
      },
      {
        title: "Spare room in a Victorian flat, shared kitchen",
        address: "3218 21st St",
        neighborhood: "Mission District",
        rentMonthlyCents: 165000,
        bedrooms: 1,
        bathrooms: 1,
        availableFrom: Date.UTC(2026, 11, 15),
      },
      {
        title: "Two-bedroom upper unit near Golden Gate Park",
        address: "1739 9th Ave",
        neighborhood: "Inner Sunset",
        rentMonthlyCents: 390000,
        bedrooms: 2,
        bathrooms: 1.5,
        availableFrom: Date.UTC(2027, 0, 1),
      },
    ];
    for (const listing of listings) {
      await ctx.db.insert("listings", {
        ...listing,
        city: "San Francisco",
        amenities: [],
        photoStorageIds: [],
        photoUrls: [],
        status: "active",
        source: "dweller",
        missingFields: [],
      });
    }
    return listings.length;
  },
});
