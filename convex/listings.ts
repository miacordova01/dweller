import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const listings = await ctx.db
      .query("listings")
      .order("desc")
      .filter((q) => q.neq(q.field("status"), "draft"))
      .take(100);
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
