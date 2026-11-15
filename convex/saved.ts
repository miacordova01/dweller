import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withPhotoUrls } from "./listings";
import { currentRenter } from "./people";

export const listingIds = query({
  args: {},
  returns: v.array(v.id("listings")),
  handler: async (ctx) => {
    const renter = await currentRenter(ctx);
    if (renter === null) return [];
    const saved = await ctx.db
      .query("savedListings")
      .withIndex("by_renter", (q) => q.eq("renterId", renter.userId))
      .take(500);
    return saved.map((s) => s.listingId);
  },
});

export const toggle = mutation({
  args: { listingId: v.id("listings") },
  returns: v.object({ saved: v.boolean() }),
  handler: async (ctx, { listingId }) => {
    const renter = await currentRenter(ctx);
    if (renter === null) throw new ConvexError("Sign in as a renter to save listings.");
    const existing = await ctx.db
      .query("savedListings")
      .withIndex("by_renter_listing", (q) =>
        q.eq("renterId", renter.userId).eq("listingId", listingId),
      )
      .unique();
    if (existing !== null) {
      await ctx.db.delete("savedListings", existing._id);
      return { saved: false };
    }
    if ((await ctx.db.get("listings", listingId)) === null) {
      throw new ConvexError("That listing no longer exists.");
    }
    await ctx.db.insert("savedListings", { renterId: renter.userId, listingId });
    return { saved: true };
  },
});

// The renter's hearted listings, most recently saved first.
export const listings = query({
  args: {},
  handler: async (ctx) => {
    const renter = await currentRenter(ctx);
    if (renter === null) return [];
    const saved = await ctx.db
      .query("savedListings")
      .withIndex("by_renter", (q) => q.eq("renterId", renter.userId))
      .order("desc")
      .take(100);
    const listings = await Promise.all(saved.map((s) => ctx.db.get("listings", s.listingId)));
    return await withPhotoUrls(
      ctx,
      listings.filter((l): l is NonNullable<typeof l> => l !== null && l.status !== "draft"),
    );
  },
});
