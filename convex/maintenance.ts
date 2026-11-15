import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { activeLease, currentLandlord, currentRenter } from "./people";
import schema from "./schema";

const ticketFields = schema.tables.maintenanceTickets.validator.fields;

type NewTicket = Pick<
  Doc<"maintenanceTickets">,
  | "title"
  | "description"
  | "category"
  | "urgency"
  | "status"
  | "photoStorageIds"
  | "aiDiagnosis"
  | "aiSuggestedTrade"
  | "aiEstimatedCostCents"
>;

// A ticket always belongs to the tenant's current lease, which is where the
// listing and the landlord come from.
export async function insertTicket(
  ctx: MutationCtx,
  tenantId: Id<"users">,
  ticket: NewTicket,
) {
  const lease = await activeLease(ctx, tenantId);
  if (lease === null) {
    throw new ConvexError(
      "There's no active lease on Dweller for you, so there's no landlord to send a repair request to.",
    );
  }
  const ticketId = await ctx.db.insert("maintenanceTickets", {
    ...ticket,
    leaseId: lease._id,
    listingId: lease.listingId,
    tenantId,
    landlordId: lease.landlordId,
  });
  return { ticketId, landlordId: lease.landlordId, listingId: lease.listingId };
}

export async function confirmBooking(
  ctx: MutationCtx,
  bookingId: Id<"ticketBookings">,
  landlordId: Id<"users">,
  slot: number | undefined,
) {
  const booking = await ctx.db.get("ticketBookings", bookingId);
  if (booking === null)
    throw new ConvexError("That repair booking no longer exists.");
  const ticket = await ctx.db.get("maintenanceTickets", booking.ticketId);
  if (ticket === null || ticket.landlordId !== landlordId) {
    throw new ConvexError("That repair isn't one of yours.");
  }
  if (
    booking.status !== "proposed" &&
    booking.status !== "awaiting_landlord_approval"
  ) {
    throw new ConvexError(`That repair booking is already ${booking.status}.`);
  }
  const now = Date.now();
  const confirmedFor = slot ?? booking.proposedSlots[0];
  await ctx.db.patch("ticketBookings", bookingId, {
    status: "confirmed",
    confirmedFor,
    approvedBy: landlordId,
    approvedAt: now,
  });
  await ctx.db.patch("maintenanceTickets", ticket._id, { status: "scheduled" });
  return { booking, ticket, confirmedFor };
}

export async function cancelBooking(
  ctx: MutationCtx,
  bookingId: Id<"ticketBookings">,
  landlordId: Id<"users">,
) {
  const booking = await ctx.db.get("ticketBookings", bookingId);
  if (booking === null) return;
  const ticket = await ctx.db.get("maintenanceTickets", booking.ticketId);
  if (ticket === null || ticket.landlordId !== landlordId) {
    throw new ConvexError("That repair isn't one of yours.");
  }
  if (
    booking.status === "proposed" ||
    booking.status === "awaiting_landlord_approval"
  ) {
    await ctx.db.patch("ticketBookings", bookingId, { status: "cancelled" });
  }
}

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: ticketFields.category,
    urgency: ticketFields.urgency,
    photoStorageIds: v.optional(v.array(v.id("_storage"))),
  },
  returns: v.id("maintenanceTickets"),
  handler: async (ctx, args) => {
    const renter = await currentRenter(ctx);
    if (renter === null)
      throw new ConvexError("Sign in as a renter to report a repair.");
    const title = args.title.trim();
    const description = args.description.trim();
    if (title === "" || description === "") {
      throw new ConvexError("Describe the problem before sending it.");
    }
    const { ticketId } = await insertTicket(ctx, renter.userId, {
      title,
      description,
      category: args.category,
      urgency: args.urgency,
      status: "new",
      photoStorageIds: args.photoStorageIds ?? [],
    });
    return ticketId;
  },
});

export const setStatus = mutation({
  args: { ticketId: v.id("maintenanceTickets"), status: ticketFields.status },
  returns: v.null(),
  handler: async (ctx, { ticketId, status }) => {
    const landlord = await currentLandlord(ctx);
    if (landlord === null)
      throw new ConvexError("Sign in as a landlord to update repairs.");
    const ticket = await ctx.db.get("maintenanceTickets", ticketId);
    if (ticket === null || ticket.landlordId !== landlord.userId) {
      throw new ConvexError("That repair isn't one of yours.");
    }
    const done = status === "resolved" || status === "closed";
    await ctx.db.patch("maintenanceTickets", ticketId, {
      status,
      resolvedAt: done ? (ticket.resolvedAt ?? Date.now()) : undefined,
    });
    return null;
  },
});

// The current renter's repair requests, newest first, with photo URLs.
export const mine = query({
  args: {},
  handler: async (ctx) => {
    const renter = await currentRenter(ctx);
    if (renter === null) return [];
    const tickets = await ctx.db
      .query("maintenanceTickets")
      .withIndex("by_tenant", (q) => q.eq("tenantId", renter.userId))
      .order("desc")
      .take(20);
    return await Promise.all(
      tickets.map(async (ticket) => {
        const storageId = ticket.photoStorageIds[0];
        return {
          ...ticket,
          photoUrl: storageId ? await ctx.storage.getUrl(storageId) : null,
        };
      }),
    );
  },
});
