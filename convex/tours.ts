import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { currentLandlord, currentRenter } from "./people";

export const TOUR_MINUTES = 30;

// One inquiry per renter and listing: a tour reuses the open one, or starts
// it, and moves it to "touring".
export async function inquiryFor(
  ctx: MutationCtx,
  renterId: Id<"users">,
  listing: Doc<"listings">,
) {
  const landlordId = listing.landlordId;
  if (landlordId === undefined) {
    throw new ConvexError(
      "This listing's owner isn't on Dweller yet, so a tour can't be booked here.",
    );
  }
  const now = Date.now();
  const inquiries = await ctx.db
    .query("inquiries")
    .withIndex("by_renter", (q) => q.eq("renterId", renterId))
    .take(200);
  const existing = inquiries.find(
    (i) => i.listingId === listing._id && i.status !== "closed",
  );
  if (existing !== undefined) {
    await ctx.db.patch("inquiries", existing._id, {
      status: existing.status === "open" ? "touring" : existing.status,
      lastMessageAt: now,
    });
    return { inquiryId: existing._id, landlordId };
  }
  const inquiryId = await ctx.db.insert("inquiries", {
    renterId,
    listingId: listing._id,
    landlordId,
    status: "touring",
    lastMessageAt: now,
  });
  return { inquiryId, landlordId };
}

// The single place a proposed tour is confirmed or declined, used by these
// mutations and by approving the agent's bookTour proposal.
export async function decideTour(
  ctx: MutationCtx,
  tourId: Id<"tours">,
  landlordId: Id<"users">,
  status: "confirmed" | "declined",
) {
  const tour = await ctx.db.get("tours", tourId);
  if (tour === null || tour.landlordId !== landlordId) {
    throw new ConvexError("That tour isn't one of yours.");
  }
  if (tour.status !== "proposed") {
    throw new ConvexError(`That tour is already ${tour.status}.`);
  }
  await ctx.db.patch("tours", tourId, { status });
  return { ...tour, status };
}

// Confirming or declining a tour directly settles any agent proposal for the
// same tour, so it doesn't linger in the approvals queue.
async function settleAgentProposal(
  ctx: MutationCtx,
  tour: Doc<"tours">,
  landlordId: Id<"users">,
) {
  const proposed = await ctx.db
    .query("agentActions")
    .withIndex("by_status", (q) => q.eq("status", "proposed"))
    .filter((q) => q.eq(q.field("tool"), "bookTour"))
    .take(200);
  for (const action of proposed) {
    if (action.args?.tourId !== tour._id) continue;
    await ctx.db.patch("agentActions", action._id, {
      status: tour.status === "confirmed" ? "executed" : "rejected",
      approverId: landlordId,
      approvedAt: Date.now(),
      result: { tourId: tour._id, tourStatus: tour.status },
    });
  }
}

export const propose = mutation({
  args: {
    listingId: v.id("listings"),
    scheduledFor: v.number(),
    durationMinutes: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  returns: v.id("tours"),
  handler: async (ctx, args) => {
    const renter = await currentRenter(ctx);
    if (renter === null) throw new ConvexError("Sign in as a renter to book a tour.");
    const listing = await ctx.db.get("listings", args.listingId);
    if (listing === null || listing.status !== "active") {
      throw new ConvexError("That listing isn't available to tour.");
    }
    if (!Number.isFinite(args.scheduledFor) || args.scheduledFor < Date.now()) {
      throw new ConvexError("Pick a tour time in the future.");
    }
    const durationMinutes = args.durationMinutes ?? TOUR_MINUTES;
    if (!Number.isInteger(durationMinutes) || durationMinutes <= 0 || durationMinutes > 240) {
      throw new ConvexError("durationMinutes must be between 1 and 240.");
    }
    const { inquiryId, landlordId } = await inquiryFor(ctx, renter.userId, listing);
    return await ctx.db.insert("tours", {
      inquiryId,
      listingId: listing._id,
      renterId: renter.userId,
      landlordId,
      scheduledFor: args.scheduledFor,
      durationMinutes,
      status: "proposed",
      proposedBy: "renter",
      notes: args.notes?.trim() || undefined,
    });
  },
});

export const confirm = mutation({
  args: { tourId: v.id("tours") },
  returns: v.null(),
  handler: async (ctx, { tourId }) => {
    const landlord = await currentLandlord(ctx);
    if (landlord === null) throw new ConvexError("Sign in as a landlord to confirm tours.");
    const tour = await decideTour(ctx, tourId, landlord.userId, "confirmed");
    await settleAgentProposal(ctx, tour, landlord.userId);
    return null;
  },
});

export const decline = mutation({
  args: { tourId: v.id("tours") },
  returns: v.null(),
  handler: async (ctx, { tourId }) => {
    const landlord = await currentLandlord(ctx);
    if (landlord === null) throw new ConvexError("Sign in as a landlord to decline tours.");
    const tour = await decideTour(ctx, tourId, landlord.userId, "declined");
    await settleAgentProposal(ctx, tour, landlord.userId);
    return null;
  },
});

// The current renter's tours with the listing they're for, soonest first.
export const mine = query({
  args: {},
  handler: async (ctx) => {
    const renter = await currentRenter(ctx);
    if (renter === null) return [];
    const tours = await ctx.db
      .query("tours")
      .withIndex("by_renter_time", (q) => q.eq("renterId", renter.userId))
      .take(100);
    const withListings = await Promise.all(
      tours.map(async (tour) => {
        const listing = await ctx.db.get("listings", tour.listingId);
        return {
          ...tour,
          address: listing?.address ?? "Listing removed",
          neighborhood: listing?.neighborhood ?? null,
          photoUrl: listing?.photoUrls[0] ?? null,
        };
      }),
    );
    return withListings.sort((a, b) => a.scheduledFor - b.scheduledFor);
  },
});
