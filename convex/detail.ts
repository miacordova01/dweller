import { v } from "convex/values";
import { query } from "./_generated/server";

export const getListing = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const listingId = ctx.db.normalizeId("listings", id);
    if (listingId === null) return null;
    const listing = await ctx.db.get(listingId);
    if (listing === null || listing.status === "draft") return null;
    const storedPhotos = await Promise.all(
      listing.photoStorageIds.map((storageId) => ctx.storage.getUrl(storageId)),
    );
    return {
      ...listing,
      photos: [...listing.photoUrls, ...storedPhotos.filter((url) => url !== null)],
    };
  },
});
