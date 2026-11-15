import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Dweller — one data model shared by all four agent capabilities.
//
// Conventions:
//   - Money is ALWAYS integer cents. Never floats, never dollars.
//   - Timestamps are ms since epoch. Convex gives every row `_creationTime`
//     for free, so we only store dates that mean something in the domain
//     (dueDate, scheduledFor, leaseEnd) — not createdAt.
//   - Anything binding (money moving, an applicant decision, a lease change)
//     is written as a row in `agentActions` with requiresApproval: true.
//     The agent never performs it directly. See the note at the bottom.

// ---------------------------------------------------------------- enums

const userRole = v.union(v.literal("renter"), v.literal("landlord"));

// Narrowing for the Discover feed and the assistant's findListings. Every
// field is optional; none set means every listing.
export const discoverFilters = v.object({
  maxRentCents: v.optional(v.number()),
  minBedrooms: v.optional(v.number()),
  maxBedrooms: v.optional(v.number()),
  neighborhoods: v.optional(v.array(v.string())),
  availableBy: v.optional(v.number()),
});

const listingStatus = v.union(
  v.literal("draft"),
  v.literal("active"),
  v.literal("leased"),
  v.literal("archived"),
);

// Where a listing came from. Dweller-native listings are "dweller";
// the rest are created by the discovery agent from a shared link.
export const listingSource = v.union(
  v.literal("dweller"),
  v.literal("instagram"),
  v.literal("tiktok"),
  v.literal("craigslist"),
  v.literal("zillow"),
  v.literal("other"),
);

const capability = v.union(
  v.literal("leasing"),
  v.literal("maintenance"),
  v.literal("rent"),
  v.literal("discovery"),
);

export default defineSchema({
  // Convex Auth 2.x keeps its own state (sessions, refresh tokens, and each
  // sign-in method's accounts) inside the components mounted in
  // convex.config.ts. The app owns `users`: a method's createUser callback
  // inserts the row and the core only stores its id. Profile data lives in
  // `profiles`, so the row itself stays empty.
  users: defineTable({}),

  // ------------------------------------------------------------ people

  // Profile data that is ours, keyed to the auth user. Kept separate so
  // Convex Auth owns `users` and we never fight it over columns.
  profiles: defineTable({
    userId: v.id("users"),
    displayName: v.string(),
    role: userRole,
    phone: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    // A renter's onboarding answers and the Discover filters they imply.
    preferences: v.optional(
      v.object({
        location: v.optional(v.string()),
        budget: v.optional(v.string()),
        moveIn: v.optional(v.string()),
        space: v.optional(v.string()),
        bedrooms: v.optional(v.string()),
        amenities: v.array(v.string()),
        filters: discoverFilters,
      }),
    ),
  })
    .index("by_user", ["userId"])
    .index("by_role", ["role"]),

  // ----------------------------------------------------------- listings

  // One table for both landlord-posted listings and cards the discovery
  // agent built from an Instagram / Craigslist link. That is deliberate:
  // the renter's comparison view has to show them side by side, and a
  // separate table would mean every query is a union.
  listings: defineTable({
    // Null for imported listings — nobody on Dweller owns them yet.
    landlordId: v.optional(v.id("users")),

    title: v.string(),
    address: v.string(),
    neighborhood: v.string(),
    city: v.string(),

    rentMonthlyCents: v.number(),
    depositCents: v.optional(v.number()),
    bedrooms: v.number(),
    bathrooms: v.number(),
    squareFeet: v.optional(v.number()),

    availableFrom: v.optional(v.number()),
    leaseTermMonths: v.optional(v.number()),

    description: v.optional(v.string()),
    amenities: v.array(v.string()),
    photoStorageIds: v.array(v.id("_storage")),
    photoUrls: v.array(v.string()), // external photos on imported listings

    status: listingStatus,

    // --- discovery agent fields -------------------------------------
    source: listingSource,
    sourceUrl: v.optional(v.string()),
    importedBy: v.optional(v.id("users")),
    // Field names the agent could not extract from the link, so the UI
    // can show "rent unknown — ask the owner?" instead of a blank.
    missingFields: v.array(v.string()),
  })
    .index("by_landlord", ["landlordId"])
    .index("by_status_neighborhood", ["status", "neighborhood"])
    .index("by_imported_by", ["importedBy"])
    .index("by_source", ["source"]),

  // Screenshots uploaded for the discovery agent. One row per upload, written
  // when an import starts, so an upload backs at most one imported listing and
  // can be deleted with it.
  discoveryUploads: defineTable({
    storageId: v.id("_storage"),
  }).index("by_storage", ["storageId"]),

  // A renter's shortlist. Separate from `listings` because two renters
  // can save the same listing with different notes.
  savedListings: defineTable({
    renterId: v.id("users"),
    listingId: v.id("listings"),
    notes: v.optional(v.string()),
    rating: v.optional(v.number()), // 1-5, renter's own gut score
  })
    .index("by_renter", ["renterId"])
    .index("by_renter_listing", ["renterId", "listingId"]),

  // ------------------------------------------- agent 1: leasing

  // The unit of work for the leasing agent: one renter's interest in one
  // listing, from first question through to an application decision.
  inquiries: defineTable({
    renterId: v.id("users"),
    listingId: v.id("listings"),
    landlordId: v.id("users"),
    status: v.union(
      v.literal("open"),
      v.literal("touring"),
      v.literal("applied"),
      v.literal("closed"),
    ),
    lastMessageAt: v.number(),
  })
    .index("by_renter", ["renterId"])
    .index("by_listing", ["listingId"])
    .index("by_landlord_status", ["landlordId", "status"]),

  // Recurring weekly windows the landlord is willing to show the place.
  // The agent reads these to offer a slot without asking the landlord.
  availability: defineTable({
    landlordId: v.id("users"),
    listingId: v.optional(v.id("listings")), // null = applies to all
    weekday: v.number(), // 0 = Sunday
    startMinute: v.number(), // minutes from midnight, local
    endMinute: v.number(),
    timezone: v.string(),
  }).index("by_landlord", ["landlordId"]),

  tours: defineTable({
    inquiryId: v.id("inquiries"),
    listingId: v.id("listings"),
    renterId: v.id("users"),
    landlordId: v.id("users"),
    scheduledFor: v.number(),
    durationMinutes: v.number(),
    status: v.union(
      v.literal("proposed"),
      v.literal("confirmed"),
      v.literal("declined"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
    proposedBy: v.union(
      v.literal("agent"),
      v.literal("renter"),
      v.literal("landlord"),
    ),
    notes: v.optional(v.string()),
  })
    .index("by_inquiry", ["inquiryId"])
    .index("by_landlord_time", ["landlordId", "scheduledFor"])
    .index("by_renter_time", ["renterId", "scheduledFor"]),

  // The agent collects and summarises these. It never approves one:
  // status leaves "under_review" only through a landlord action.
  applications: defineTable({
    inquiryId: v.id("inquiries"),
    renterId: v.id("users"),
    listingId: v.id("listings"),
    landlordId: v.id("users"),
    status: v.union(
      v.literal("draft"),
      v.literal("submitted"),
      v.literal("under_review"),
      v.literal("approved"),
      v.literal("declined"),
      v.literal("withdrawn"),
    ),
    monthlyIncomeCents: v.optional(v.number()),
    employer: v.optional(v.string()),
    moveInDate: v.optional(v.number()),
    occupants: v.optional(v.number()),
    pets: v.optional(v.string()),
    creditScoreBand: v.optional(v.string()), // "720-759" — never a raw score
    documentStorageIds: v.array(v.id("_storage")),
    // What the agent prepared for the landlord to read in 10 seconds.
    agentSummary: v.optional(v.string()),
    submittedAt: v.optional(v.number()),
    decidedBy: v.optional(v.id("users")),
    decidedAt: v.optional(v.number()),
  })
    .index("by_listing_status", ["listingId", "status"])
    .index("by_renter", ["renterId"])
    .index("by_landlord_status", ["landlordId", "status"]),

  // ------------------------------------------- agent 3: rent and lease

  leases: defineTable({
    listingId: v.id("listings"),
    landlordId: v.id("users"),
    tenantId: v.id("users"),
    rentMonthlyCents: v.number(),
    depositCents: v.number(),
    dueDayOfMonth: v.number(), // 1-28
    startDate: v.number(),
    endDate: v.number(),
    status: v.union(
      v.literal("pending_signature"),
      v.literal("active"),
      v.literal("ending"),
      v.literal("ended"),
    ),
    documentStorageId: v.optional(v.id("_storage")),
    signedByTenantAt: v.optional(v.number()),
    signedByLandlordAt: v.optional(v.number()),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_landlord_status", ["landlordId", "status"])
    .index("by_listing", ["listingId"])
    // Drives "flag upcoming lease expirations" without a table scan.
    .index("by_status_end", ["status", "endDate"]),

  // The lease broken into addressable chunks. This is what makes
  // "answers lease questions with citations" real rather than a model
  // paraphrasing a PDF — the agent quotes a row and links to it.
  leaseClauses: defineTable({
    leaseId: v.id("leases"),
    section: v.string(), // "8.2"
    heading: v.string(), // "Late payment"
    text: v.string(),
    orderIndex: v.number(),
  }).index("by_lease_order", ["leaseId", "orderIndex"]),

  // Tracked, never moved. Dweller records what is owed and what arrived;
  // the actual transfer happens outside and is reconciled here.
  payments: defineTable({
    leaseId: v.id("leases"),
    tenantId: v.id("users"),
    landlordId: v.id("users"),
    periodMonth: v.string(), // "2026-11"
    amountDueCents: v.number(),
    amountPaidCents: v.number(),
    dueDate: v.number(),
    paidAt: v.optional(v.number()),
    status: v.union(
      v.literal("due"),
      v.literal("partial"),
      v.literal("paid"),
      v.literal("late"),
      v.literal("waived"),
    ),
    method: v.optional(v.string()), // "venmo", "zelle", "check"
    externalRef: v.optional(v.string()),
  })
    .index("by_lease_period", ["leaseId", "periodMonth"])
    .index("by_tenant_status", ["tenantId", "status"])
    .index("by_status_due", ["status", "dueDate"]), // reminder sweep

  // ------------------------------------------- agent 2: maintenance

  maintenanceTickets: defineTable({
    leaseId: v.optional(v.id("leases")),
    listingId: v.id("listings"),
    tenantId: v.id("users"),
    landlordId: v.id("users"),
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("plumbing"),
      v.literal("electrical"),
      v.literal("appliance"),
      v.literal("hvac"),
      v.literal("pest"),
      v.literal("structural"),
      v.literal("other"),
    ),
    urgency: v.union(
      v.literal("emergency"),
      v.literal("high"),
      v.literal("normal"),
      v.literal("low"),
    ),
    status: v.union(
      v.literal("new"),
      v.literal("triaging"),
      v.literal("awaiting_approval"),
      v.literal("scheduled"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("closed"),
    ),
    photoStorageIds: v.array(v.id("_storage")),
    // Filled by the triage agent, shown to the landlord as a suggestion.
    aiDiagnosis: v.optional(v.string()),
    aiSuggestedTrade: v.optional(v.string()),
    aiEstimatedCostCents: v.optional(v.number()),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_landlord_status", ["landlordId", "status"])
    .index("by_listing", ["listingId"]),

  // The landlord's approved repair people. The agent may only contact
  // somebody who is in this table.
  vendors: defineTable({
    landlordId: v.id("users"),
    name: v.string(),
    trade: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    hourlyRateCents: v.optional(v.number()),
    notes: v.optional(v.string()),
  }).index("by_landlord_trade", ["landlordId", "trade"]),

  // A proposed repair visit. Sits at awaiting_landlord_approval until a
  // human says yes — this is the gate on spending the landlord's money.
  ticketBookings: defineTable({
    ticketId: v.id("maintenanceTickets"),
    vendorId: v.id("vendors"),
    proposedSlots: v.array(v.number()),
    confirmedFor: v.optional(v.number()),
    estimatedCostCents: v.optional(v.number()),
    status: v.union(
      v.literal("proposed"),
      v.literal("awaiting_landlord_approval"),
      v.literal("confirmed"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
  })
    .index("by_ticket", ["ticketId"])
    .index("by_vendor", ["vendorId"]),

  // ------------------------------------- shared across all four agents

  // One conversation table, not four. Every capability writes here, so
  // the assistant has a single history and the renter sees one inbox.
  conversations: defineTable({
    participantIds: v.array(v.id("users")),
    capability: capability,
    title: v.string(),
    // Whichever of these the conversation is about.
    listingId: v.optional(v.id("listings")),
    inquiryId: v.optional(v.id("inquiries")),
    leaseId: v.optional(v.id("leases")),
    ticketId: v.optional(v.id("maintenanceTickets")),
    lastMessageAt: v.number(),
  })
    .index("by_last_message", ["lastMessageAt"])
    .index("by_inquiry", ["inquiryId"])
    .index("by_ticket", ["ticketId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    authorId: v.optional(v.id("users")), // null when the agent speaks
    authorRole: v.union(
      v.literal("renter"),
      v.literal("landlord"),
      v.literal("agent"),
      v.literal("system"),
    ),
    text: v.string(),
    attachmentStorageIds: v.array(v.id("_storage")),
    // Set when this message is the agent reporting a tool it ran.
    agentActionId: v.optional(v.id("agentActions")),
  }).index("by_conversation", ["conversationId"]),

  // The audit log and the approval queue in one table. This is the piece
  // that makes Dweller agentic rather than a chatbot: every tool call the
  // assistant wants to make lands here first. Anything that moves money,
  // decides on an applicant, or changes a lease is written with
  // requiresApproval: true and executes only after a human approves it.
  agentActions: defineTable({
    capability: capability,
    conversationId: v.optional(v.id("conversations")),
    actorId: v.optional(v.id("users")), // who the agent acted on behalf of
    tool: v.string(), // "bookTour", "contactVendor", "sendRentReminder"
    args: v.any(),
    requiresApproval: v.boolean(),
    status: v.union(
      v.literal("proposed"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("executed"),
      v.literal("failed"),
    ),
    approverId: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    result: v.optional(v.any()),
    error: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_approver_status", ["approverId", "status"])
    .index("by_conversation", ["conversationId"]),

  notifications: defineTable({
    userId: v.id("users"),
    kind: v.string(),
    title: v.string(),
    body: v.string(),
    link: v.optional(v.string()),
    readAt: v.optional(v.number()),
  }).index("by_user_unread", ["userId", "readAt"]),
});
