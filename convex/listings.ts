import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("listings").order("desc").collect();
  },
});

export const add = mutation({
  args: {
    title: v.string(),
    address: v.string(),
    neighborhood: v.string(),
    rentMonthly: v.number(),
    bedrooms: v.number(),
    bathrooms: v.number(),
    availableFrom: v.string(),
    photoUrl: v.optional(v.string()),
    landlordName: v.string(),
  },
  returns: v.id("listings"),
  handler: async (ctx, args) => {
    const listing = {
      ...args,
      title: args.title.trim(),
      address: args.address.trim(),
      neighborhood: args.neighborhood.trim(),
      availableFrom: args.availableFrom.trim(),
      landlordName: args.landlordName.trim(),
      photoUrl: args.photoUrl?.trim() || undefined,
    };
    for (const field of ["title", "address", "neighborhood", "availableFrom", "landlordName"] as const) {
      if (listing[field] === "") throw new ConvexError(`${field} is required.`);
    }
    for (const field of ["rentMonthly", "bedrooms", "bathrooms"] as const) {
      if (!Number.isFinite(listing[field]) || listing[field] < 0) {
        throw new ConvexError(`${field} must be a non-negative number.`);
      }
    }
    return await ctx.db.insert("listings", { ...listing, createdAt: Date.now() });
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
        rentMonthly: 2450,
        bedrooms: 0,
        bathrooms: 1,
        availableFrom: "2026-12-01",
        landlordName: "Priya Raman",
      },
      {
        title: "Spare room in a Victorian flat, shared kitchen",
        address: "3218 21st St",
        neighborhood: "Mission District",
        rentMonthly: 1650,
        bedrooms: 1,
        bathrooms: 1,
        availableFrom: "2026-12-15",
        landlordName: "Daniel Ortiz",
      },
      {
        title: "Two-bedroom upper unit near Golden Gate Park",
        address: "1739 9th Ave",
        neighborhood: "Inner Sunset",
        rentMonthly: 3900,
        bedrooms: 2,
        bathrooms: 1.5,
        availableFrom: "2027-01-01",
        landlordName: "Helen Wu",
      },
    ];
    const now = Date.now();
    for (const [i, listing] of listings.entries()) {
      await ctx.db.insert("listings", { ...listing, createdAt: now + i });
    }
    return listings.length;
  },
});
