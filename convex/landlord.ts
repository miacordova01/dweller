import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";

const DEMO_LANDLORD_NAME = "Dana Whitfield";

async function currentLandlord(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId !== null) {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    return profile?.role === "landlord" ? profile : null;
  }
  const landlords = await ctx.db
    .query("profiles")
    .withIndex("by_role", (q) => q.eq("role", "landlord"))
    .take(100);
  return landlords.find((p) => p.displayName === DEMO_LANDLORD_NAME) ?? null;
}

async function displayName(ctx: QueryCtx, userId: Id<"users">) {
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
  return profile?.displayName ?? "A renter";
}

async function listingCard(ctx: QueryCtx, listingId: Id<"listings">) {
  const listing = await ctx.db.get("listings", listingId);
  if (listing === null) return null;
  const storageId = listing.photoStorageIds[0];
  return {
    _id: listing._id,
    title: listing.title,
    address: listing.address,
    neighborhood: listing.neighborhood,
    photoUrl:
      listing.photoUrls[0] ??
      (storageId ? await ctx.storage.getUrl(storageId) : null),
  };
}

function currentMonth() {
  return new Date(Date.now()).toISOString().slice(0, 7);
}

async function pendingApprovals(ctx: QueryCtx, landlordId: Id<"users">) {
  const proposed = await ctx.db
    .query("agentActions")
    .withIndex("by_status", (q) => q.eq("status", "proposed"))
    .order("desc")
    .take(200);
  return proposed.filter(
    (action) => action.requiresApproval && action.actorId === landlordId,
  );
}

const inquiryStatuses = ["open", "touring", "applied", "closed"] as const;

export const overview = query({
  args: {},
  handler: async (ctx) => {
    const landlord = await currentLandlord(ctx);
    if (landlord === null) return null;
    const landlordId = landlord.userId;

    const approvals = await pendingApprovals(ctx, landlordId);

    const applications = await ctx.db
      .query("applications")
      .withIndex("by_landlord_status", (q) =>
        q.eq("landlordId", landlordId).eq("status", "submitted"),
      )
      .take(20);
    const applicationItems = await Promise.all(
      applications.map(async (application) => ({
        kind: "application" as const,
        id: application._id,
        renterName: await displayName(ctx, application.renterId),
        listing: await listingCard(ctx, application.listingId),
        summary: application.agentSummary ?? null,
        at: application.submittedAt ?? application._creationTime,
      })),
    );

    const quoteItems = [];
    for (const action of approvals) {
      if (action.tool !== "acceptVendorQuote") continue;
      const ticket = await ctx.db.get("maintenanceTickets", action.args.ticketId);
      const vendor = await ctx.db.get("vendors", action.args.vendorId);
      if (ticket === null || vendor === null) continue;
      quoteItems.push({
        kind: "quote" as const,
        id: action._id,
        ticketTitle: ticket.title,
        vendorName: vendor.name,
        amountCents: action.args.quoteCents as number,
        listing: await listingCard(ctx, ticket.listingId),
        at: action._creationTime,
      });
    }

    const month = currentMonth();
    const leases = await ctx.db
      .query("leases")
      .withIndex("by_landlord_status", (q) =>
        q.eq("landlordId", landlordId).eq("status", "active"),
      )
      .take(100);
    let expectedCents = 0;
    let collectedCents = 0;
    let paidCount = 0;
    for (const lease of leases) {
      const payment = await ctx.db
        .query("payments")
        .withIndex("by_lease_period", (q) =>
          q.eq("leaseId", lease._id).eq("periodMonth", month),
        )
        .unique();
      expectedCents += payment?.amountDueCents ?? lease.rentMonthlyCents;
      collectedCents += payment?.amountPaidCents ?? 0;
      if (payment?.status === "paid") paidCount += 1;
    }

    return {
      name: landlord.displayName.split(" ")[0],
      approvalCount: approvals.length,
      waiting: [...applicationItems, ...quoteItems].sort((a, b) => b.at - a.at),
      rent: {
        month,
        expectedCents,
        collectedCents,
        paidCount,
        leaseCount: leases.length,
      },
    };
  },
});

export const properties = query({
  args: {},
  handler: async (ctx) => {
    const landlord = await currentLandlord(ctx);
    if (landlord === null) return null;
    const listings = await ctx.db
      .query("listings")
      .withIndex("by_landlord", (q) => q.eq("landlordId", landlord.userId))
      .take(100);
    return await Promise.all(
      listings
        .filter((listing) => listing.status !== "archived")
        .map(async (listing) => {
          const leases = await ctx.db
            .query("leases")
            .withIndex("by_listing", (q) => q.eq("listingId", listing._id))
            .take(20);
          const lease = leases.find(
            (l) => l.status === "active" || l.status === "ending",
          );
          const inquiries = await ctx.db
            .query("inquiries")
            .withIndex("by_listing", (q) => q.eq("listingId", listing._id))
            .take(100);
          const card = await listingCard(ctx, listing._id);
          return {
            ...card!,
            bedrooms: listing.bedrooms,
            bathrooms: listing.bathrooms,
            squareFeet: listing.squareFeet ?? null,
            occupied: lease !== undefined,
            tenantName: lease ? await displayName(ctx, lease.tenantId) : null,
            leaseEnd: lease?.endDate ?? null,
            rentCents: lease?.rentMonthlyCents ?? listing.rentMonthlyCents,
            openInquiries: inquiries.filter((i) => i.status !== "closed").length,
          };
        }),
    );
  },
});

export const inbox = query({
  args: {},
  handler: async (ctx) => {
    const landlord = await currentLandlord(ctx);
    if (landlord === null) return null;
    const byStatus = await Promise.all(
      inquiryStatuses.map((status) =>
        ctx.db
          .query("inquiries")
          .withIndex("by_landlord_status", (q) =>
            q.eq("landlordId", landlord.userId).eq("status", status),
          )
          .take(100),
      ),
    );
    const inquiries = byStatus
      .flat()
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt)
      .slice(0, 100);
    return await Promise.all(
      inquiries.map(async (inquiry) => {
        const conversation = await ctx.db
          .query("conversations")
          .withIndex("by_inquiry", (q) => q.eq("inquiryId", inquiry._id))
          .first();
        const lastMessage = conversation
          ? await ctx.db
              .query("messages")
              .withIndex("by_conversation", (q) =>
                q.eq("conversationId", conversation._id),
              )
              .order("desc")
              .first()
          : null;
        return {
          _id: inquiry._id,
          status: inquiry.status,
          lastMessageAt: inquiry.lastMessageAt,
          renterName: await displayName(ctx, inquiry.renterId),
          listing: await listingCard(ctx, inquiry.listingId),
          lastMessage: lastMessage
            ? { text: lastMessage.text, authorRole: lastMessage.authorRole }
            : null,
        };
      }),
    );
  },
});

async function describeAction(ctx: QueryCtx, action: Doc<"agentActions">) {
  const args = action.args ?? {};
  const base = {
    _id: action._id,
    capability: action.capability,
    proposedAt: action._creationTime,
    reason: typeof args.reason === "string" ? args.reason : null,
  };
  if (action.tool === "bookTour") {
    return {
      ...base,
      kind: "bookTour" as const,
      renterName: await displayName(ctx, args.renterId),
      scheduledFor: args.scheduledFor as number,
      durationMinutes: args.durationMinutes as number,
      listing: await listingCard(ctx, args.listingId),
    };
  }
  if (action.tool === "acceptVendorQuote") {
    const ticket = await ctx.db.get("maintenanceTickets", args.ticketId);
    const vendor = await ctx.db.get("vendors", args.vendorId);
    return {
      ...base,
      kind: "acceptVendorQuote" as const,
      vendorName: vendor?.name ?? "the vendor",
      quoteCents: args.quoteCents as number,
      slot: args.slot as number,
      ticket: ticket
        ? { title: ticket.title, urgency: ticket.urgency, tenantName: await displayName(ctx, ticket.tenantId) }
        : null,
      listing: ticket ? await listingCard(ctx, ticket.listingId) : null,
    };
  }
  if (action.tool === "sendRentReminder") {
    const lease = await ctx.db.get("leases", args.leaseId);
    const payment = await ctx.db.get("payments", args.paymentId);
    return {
      ...base,
      kind: "sendRentReminder" as const,
      tenantName: await displayName(ctx, args.tenantId),
      amountCents: payment?.amountDueCents ?? lease?.rentMonthlyCents ?? 0,
      dueDate: payment?.dueDate ?? null,
      sendAt: args.sendAt as number,
      message: typeof args.message === "string" ? args.message : null,
      listing: lease ? await listingCard(ctx, lease.listingId) : null,
    };
  }
  return {
    ...base,
    kind: "other" as const,
    tool: action.tool,
    listing: args.listingId ? await listingCard(ctx, args.listingId) : null,
  };
}

export const approvals = query({
  args: {},
  handler: async (ctx) => {
    const landlord = await currentLandlord(ctx);
    if (landlord === null) return null;
    const actions = await pendingApprovals(ctx, landlord.userId);
    return await Promise.all(actions.map((action) => describeAction(ctx, action)));
  },
});

async function decide(
  ctx: MutationCtx,
  actionId: Id<"agentActions">,
  status: "approved" | "rejected",
) {
  const landlord = await currentLandlord(ctx);
  if (landlord === null) throw new ConvexError("Sign in as a landlord to decide.");
  const action = await ctx.db.get("agentActions", actionId);
  if (action === null || action.actorId !== landlord.userId) {
    throw new ConvexError("That request isn't in your approvals.");
  }
  if (!action.requiresApproval || action.status !== "proposed") {
    throw new ConvexError("This request has already been decided.");
  }
  await ctx.db.patch("agentActions", actionId, {
    status,
    approverId: landlord.userId,
    approvedAt: Date.now(),
  });
  return null;
}

export const approve = mutation({
  args: { actionId: v.id("agentActions") },
  returns: v.null(),
  handler: (ctx, { actionId }) => decide(ctx, actionId, "approved"),
});

export const decline = mutation({
  args: { actionId: v.id("agentActions") },
  returns: v.null(),
  handler: (ctx, { actionId }) => decide(ctx, actionId, "rejected"),
});

async function createPerson(
  ctx: MutationCtx,
  displayName: string,
  role: "renter" | "landlord",
) {
  const userId = await ctx.db.insert("users", {});
  await ctx.db.insert("profiles", { userId, displayName, role });
  return userId;
}

async function findListing(ctx: MutationCtx, address: string) {
  const listings = await ctx.db.query("listings").take(500);
  const listing = listings.find(
    (l) => l.address === address && l.city === "San Francisco",
  );
  if (listing === undefined) {
    throw new ConvexError(
      address + " is missing. Run seed:seedListings before seeding the landlord demo.",
    );
  }
  return listing;
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const pacific = (y: number, m: number, d: number, h: number, min = 0) =>
  Date.UTC(y, m - 1, d, h + 8, min);

export const seedLandlordDemo = internalMutation({
  args: {},
  returns: v.object({ created: v.boolean() }),
  handler: async (ctx) => {
    const landlords = await ctx.db
      .query("profiles")
      .withIndex("by_role", (q) => q.eq("role", "landlord"))
      .take(100);
    if (landlords.some((p) => p.displayName === DEMO_LANDLORD_NAME)) {
      return { created: false };
    }

    const now = Date.now();
    const landlordId = await createPerson(ctx, DEMO_LANDLORD_NAME, "landlord");
    const marcusId = await createPerson(ctx, "Marcus Bell", "renter");
    const priyaId = await createPerson(ctx, "Priya Natarajan", "renter");
    const jordanId = await createPerson(ctx, "Jordan Lee", "renter");

    const flat = await findListing(ctx, "1338 Sanchez St");
    const inlaw = await findListing(ctx, "1067 Treat Ave");
    await ctx.db.patch("listings", flat._id, { landlordId, status: "leased" });
    await ctx.db.patch("listings", inlaw._id, { landlordId });

    const marcusInquiry = await ctx.db.insert("inquiries", {
      renterId: marcusId,
      listingId: inlaw._id,
      landlordId,
      status: "open",
      lastMessageAt: now - 35 * 60 * 1000,
    });
    const marcusConversation = await ctx.db.insert("conversations", {
      participantIds: [marcusId, landlordId],
      capability: "leasing",
      title: "Marcus Bell · 1067 Treat Ave",
      listingId: inlaw._id,
      inquiryId: marcusInquiry,
      lastMessageAt: now - 35 * 60 * 1000,
    });
    await ctx.db.insert("messages", {
      conversationId: marcusConversation,
      authorId: marcusId,
      authorRole: "renter",
      text: "Hi! Is the in-law on Treat still available for mid-December? I work from home, so the built-in desk is a big plus. Could I see it this weekend?",
      attachmentStorageIds: [],
    });
    await ctx.db.insert("messages", {
      conversationId: marcusConversation,
      authorRole: "agent",
      text: "It is, from Dec 15. I've asked the owner to confirm Saturday, Nov 21 at 10:30 AM and will send you the entry details as soon as it's approved.",
      attachmentStorageIds: [],
    });

    const priyaInquiry = await ctx.db.insert("inquiries", {
      renterId: priyaId,
      listingId: inlaw._id,
      landlordId,
      status: "applied",
      lastMessageAt: now - 26 * HOUR,
    });
    const priyaConversation = await ctx.db.insert("conversations", {
      participantIds: [priyaId, landlordId],
      capability: "leasing",
      title: "Priya Natarajan · 1067 Treat Ave",
      listingId: inlaw._id,
      inquiryId: priyaInquiry,
      lastMessageAt: now - 26 * HOUR,
    });
    await ctx.db.insert("messages", {
      conversationId: priyaConversation,
      authorId: priyaId,
      authorRole: "renter",
      text: "Loved the place on Tuesday. I just submitted my application. Happy to send anything else you need.",
      attachmentStorageIds: [],
    });
    await ctx.db.insert("messages", {
      conversationId: priyaConversation,
      authorRole: "agent",
      text: "Thanks, Priya. Your application is complete and with the owner now. Most decisions come back within two days.",
      attachmentStorageIds: [],
    });

    await ctx.db.insert("applications", {
      inquiryId: priyaInquiry,
      renterId: priyaId,
      listingId: inlaw._id,
      landlordId,
      status: "submitted",
      monthlyIncomeCents: 1150000,
      employer: "UCSF Benioff Children's Hospital",
      moveInDate: Date.UTC(2026, 11, 15),
      occupants: 1,
      pets: "None",
      creditScoreBand: "740-779",
      documentStorageIds: [],
      agentSummary:
        "Pediatric nurse at UCSF, $11,500/mo income, 4.3x the rent. Credit 740-779, no pets, moving in alone on Dec 15. Toured on Tuesday.",
      submittedAt: now - 26 * HOUR,
    });

    const tourTime = pacific(2026, 11, 21, 10, 30);
    const tourId = await ctx.db.insert("tours", {
      inquiryId: marcusInquiry,
      listingId: inlaw._id,
      renterId: marcusId,
      landlordId,
      scheduledFor: tourTime,
      durationMinutes: 30,
      status: "proposed",
      proposedBy: "agent",
      notes: "Works from home; wants to check the desk and mobile signal in the unit.",
    });

    const leaseId = await ctx.db.insert("leases", {
      listingId: flat._id,
      landlordId,
      tenantId: jordanId,
      rentMonthlyCents: 560000,
      depositCents: 840000,
      dueDayOfMonth: 1,
      startDate: Date.UTC(2026, 5, 1),
      endDate: Date.UTC(2027, 4, 31),
      status: "active",
      signedByTenantAt: Date.UTC(2026, 4, 12),
      signedByLandlordAt: Date.UTC(2026, 4, 13),
    });
    await ctx.db.insert("payments", {
      leaseId,
      tenantId: jordanId,
      landlordId,
      periodMonth: "2026-11",
      amountDueCents: 560000,
      amountPaidCents: 560000,
      dueDate: pacific(2026, 11, 1, 0),
      paidAt: pacific(2026, 10, 30, 18, 12),
      status: "paid",
      method: "zelle",
    });
    const decemberRent = await ctx.db.insert("payments", {
      leaseId,
      tenantId: jordanId,
      landlordId,
      periodMonth: "2026-12",
      amountDueCents: 560000,
      amountPaidCents: 0,
      dueDate: pacific(2026, 12, 1, 0),
      status: "due",
    });

    const ticketId = await ctx.db.insert("maintenanceTickets", {
      leaseId,
      listingId: flat._id,
      tenantId: jordanId,
      landlordId,
      title: "Kitchen sink leaking under the cabinet",
      description:
        "Water has been pooling in the cabinet under the kitchen sink since Thursday night. I've put a bowl under it and closed the shut-off valve for now.",
      category: "plumbing",
      urgency: "high",
      status: "awaiting_approval",
      photoStorageIds: [],
      aiDiagnosis:
        "Most likely a worn slip-joint washer on the P-trap or a loose supply line. Not an emergency with the valve closed, but the cabinet floor will swell if it stays wet.",
      aiSuggestedTrade: "plumbing",
      aiEstimatedCostCents: 35000,
    });
    const vendorId = await ctx.db.insert("vendors", {
      landlordId,
      name: "Ortega Plumbing",
      trade: "plumbing",
      phone: "+1 415 555 0142",
      hourlyRateCents: 14500,
      notes: "Luis. Fixed the upstairs water heater in March.",
    });
    const repairSlot = pacific(2026, 11, 17, 9);
    const bookingId = await ctx.db.insert("ticketBookings", {
      ticketId,
      vendorId,
      proposedSlots: [repairSlot, pacific(2026, 11, 17, 13)],
      estimatedCostCents: 38500,
      status: "awaiting_landlord_approval",
    });

    await ctx.db.insert("agentActions", {
      capability: "rent",
      actorId: landlordId,
      tool: "sendRentReminder",
      args: {
        leaseId,
        paymentId: decemberRent,
        tenantId: jordanId,
        sendAt: pacific(2026, 11, 28, 9),
        message:
          "Hi Jordan, a quick heads-up that December rent of $5,600 for 1338 Sanchez St is due Tuesday, Dec 1. Same Zelle details as always. Thanks!",
        reason:
          "Jordan has paid on time every month. This is the usual friendly note three days before rent is due.",
      },
      requiresApproval: true,
      status: "proposed",
    });
    await ctx.db.insert("agentActions", {
      capability: "maintenance",
      actorId: landlordId,
      tool: "acceptVendorQuote",
      args: {
        ticketId,
        bookingId,
        vendorId,
        quoteCents: 38500,
        slot: repairSlot,
        reason:
          "Luis quoted $385 flat for parts and labour. Two other plumbers quoted $450 and $520. Jordan is home Tuesday morning.",
      },
      requiresApproval: true,
      status: "proposed",
    });
    await ctx.db.insert("agentActions", {
      capability: "leasing",
      conversationId: marcusConversation,
      actorId: landlordId,
      tool: "bookTour",
      args: {
        tourId,
        inquiryId: marcusInquiry,
        listingId: inlaw._id,
        renterId: marcusId,
        scheduledFor: tourTime,
        durationMinutes: 30,
        reason:
          "Marcus asked for this weekend. Saturday 10:30 is inside your showing hours and nobody else is booked.",
      },
      requiresApproval: true,
      status: "proposed",
    });

    return { created: true };
  },
});
