import { HOUR, RateLimiter } from "@convex-dev/rate-limiter";
import { ConvexError, v } from "convex/values";
import OpenAI from "openai";
import type {
  FunctionTool,
  Response,
  ResponseFunctionToolCall,
  ResponseInputItem,
} from "openai/resources/responses/responses";

import { api, components, internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  action,
  env,
  internalMutation,
  internalQuery,
  query,
  type ActionCtx,
  type QueryCtx,
} from "./_generated/server";
import { insertTicket } from "./maintenance";
import { activeLease, currentLandlord, currentRenter } from "./people";
import schema from "./schema";
import { DEFAULT_TIMEZONE, formatLocal, zonedParts, zonedTimeToUtc } from "./time";
import { inquiryFor, TOUR_MINUTES } from "./tours";

// The Dweller assistant behind the AI composer. One action per user turn:
// append the message, let the model call tools until it has an answer, append
// the reply. Tools that commit the landlord to something (a tour, a vendor
// visit) only write a proposed agentActions row; landlord.approve performs it.

const MODEL = "gpt-6-luna";
const MAX_TOOL_ROUNDS = 6;
const HISTORY_LIMIT = 30;
const MESSAGE_MAX_CHARS = 4000;
const SEARCH_DAYS = 21;
const MIN_LEAD_MS = 2 * HOUR;

const rateLimiter = new RateLimiter(components.rateLimiter, {
  askPerUser: { kind: "token bucket", rate: 60, period: HOUR, capacity: 10 },
  askAnonymous: { kind: "token bucket", rate: 200, period: HOUR, capacity: 20 },
});

const role = v.union(v.literal("renter"), v.literal("landlord"));
type Role = "renter" | "landlord";
type Capability = Doc<"conversations">["capability"];

const ticketFields = schema.tables.maintenanceTickets.validator.fields;
const categories = ticketFields.category.members.map((m) => m.value);
const urgencies = ticketFields.urgency.members.map((m) => m.value);

// ------------------------------------------------------------ tool schemas

const nullable = (type: "string" | "number", description: string) => ({
  type: [type, "null"],
  description,
});

const objectSchema = (properties: Record<string, unknown>) => ({
  type: "object",
  additionalProperties: false,
  required: Object.keys(properties),
  properties,
});

const findListingsTool: FunctionTool = {
  type: "function",
  name: "findListings",
  description:
    "Search the rentals listed on Dweller. Returns matching listings with their listingId, which bookTour needs.",
  strict: true,
  parameters: objectSchema({
    criteria: objectSchema({
      keywords: nullable(
        "string",
        "Words to match against title, address, neighborhood, description and amenities, e.g. '1067 Treat Ave' or 'private entrance'.",
      ),
      neighborhood: nullable("string", "Neighborhood name, e.g. 'Mission District'."),
      maxRentDollars: nullable("number", "Highest monthly rent in US dollars."),
      minBedrooms: nullable("number", "Fewest bedrooms. 0 allows studios."),
    }),
  }),
};

const renterTools: FunctionTool[] = [
  findListingsTool,
  {
    type: "function",
    name: "bookTour",
    description:
      "Request a tour of a Dweller listing. Picks the first slot in the owner's showing hours at or after the preferred time and sends it to the owner for approval.",
    strict: true,
    parameters: objectSchema({
      listingId: { type: "string", description: "listingId from findListings." },
      preferredWhen: {
        type: "string",
        description:
          "The renter's preferred time as local San Francisco time, YYYY-MM-DDTHH:MM, or YYYY-MM-DD when they gave only a day.",
      },
    }),
  },
  {
    type: "function",
    name: "createMaintenanceTicket",
    description:
      "Report a repair problem in the renter's home to their landlord and line up the landlord's vendor for that trade.",
    strict: true,
    parameters: objectSchema({
      description: {
        type: "string",
        description: "The problem in the renter's own words, with every detail they gave.",
      },
      photoStorageId: nullable("string", "The attached photo id, if the renter attached one."),
    }),
  },
  {
    type: "function",
    name: "answerLeaseQuestion",
    description:
      "Answer a question about the renter's lease from its clauses, with the sections relied on.",
    strict: true,
    parameters: objectSchema({
      question: { type: "string", description: "The renter's question about their lease." },
    }),
  },
];

const landlordTools: FunctionTool[] = [findListingsTool];

function instructions(turn: Turn) {
  const now = Date.now();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: DEFAULT_TIMEZONE }).format(new Date(now));
  return `You are the Dweller assistant, helping ${turn.displayName}, a ${turn.role} in San Francisco.

Today is ${today}; it is now ${formatLocal(now)} in San Francisco.

Rules:
- Use your tools for anything about listings, tours, repairs, or the lease. Never invent listings, times, prices, vendors, or lease terms.
- To book a tour you need the listing's listingId. Call findListings first unless an earlier tool result in this conversation already gave it. Turn the renter's preferred time into preferredWhen; "this Saturday morning" is the coming Saturday at 09:00.
- Tours and vendor visits you set up are proposals waiting on the owner. Say so plainly. Never call them confirmed.
- For a repair problem, call createMaintenanceTicket with the renter's description and the attached photo id if there is one.
- For a lease question, call answerLeaseQuestion. In your reply give the answer, then cite each clause it relied on by section number and heading and quote its text verbatim in quotation marks. If the tool says there is no lease, say that and do not guess at terms.
- If a tool returns an error, tell the user what went wrong in plain words.
- Reply in short plain sentences, without markdown headings or tables.`;
}

// ------------------------------------------------------------ public API

export const ask = action({
  args: {
    conversationId: v.optional(v.id("conversations")),
    message: v.string(),
    role,
    photoStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args): Promise<ConversationView> => {
    const turn: Turn = await ctx.runMutation(internal.assistant.beginTurn, args);
    const client = openAiClient();
    const tools = turn.role === "renter" ? renterTools : landlordTools;
    const system = instructions(turn);

    let response = await respond(client, { instructions: system, input: turn.history, tools });
    let agentActionId: Id<"agentActions"> | undefined;
    let capability: Capability | undefined;
    for (let round = 0; ; round++) {
      const calls = response.output.filter(
        (item): item is ResponseFunctionToolCall => item.type === "function_call",
      );
      if (calls.length === 0) break;
      if (round === MAX_TOOL_ROUNDS) {
        throw new ConvexError("The assistant got stuck on that request. Try rephrasing it.");
      }
      const outputs: ResponseInputItem[] = [];
      for (const call of calls) {
        const result = await runTool(ctx, client, turn, call);
        if (result.agentActionId !== undefined) agentActionId = result.agentActionId;
        if (result.capability !== undefined) capability = result.capability;
        outputs.push({
          type: "function_call_output",
          call_id: call.call_id,
          output: JSON.stringify(result.output),
        });
      }
      response = await respond(client, {
        instructions: system,
        input: outputs,
        tools,
        previous_response_id: response.id,
      });
    }
    const text = response.output_text.trim();
    if (text === "") throw new ConvexError("The assistant didn't reply. Try again.");
    return await ctx.runMutation(internal.assistant.finishTurn, {
      conversationId: turn.conversationId,
      text,
      agentActionId,
      capability,
    });
  },
});

export const conversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const people = await Promise.all([currentRenter(ctx), currentLandlord(ctx)]);
    const conversation = await ctx.db.get("conversations", conversationId);
    if (
      conversation === null ||
      !people.some((p) => p !== null && conversation.participantIds.includes(p.userId))
    ) {
      return null;
    }
    return await conversationView(ctx, conversation);
  },
});

// ------------------------------------------------------------ turn bookkeeping

type Turn = {
  conversationId: Id<"conversations">;
  userId: Id<"users">;
  role: Role;
  displayName: string;
  history: ResponseInputItem[];
};

type ConversationView = {
  conversation: Doc<"conversations">;
  messages: Doc<"messages">[];
};

async function conversationView(
  ctx: QueryCtx,
  conversation: Doc<"conversations">,
): Promise<ConversationView> {
  const messages = await ctx.db
    .query("messages")
    .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
    .order("desc")
    .take(100);
  return { conversation, messages: messages.reverse() };
}

export const beginTurn = internalMutation({
  args: {
    conversationId: v.optional(v.id("conversations")),
    message: v.string(),
    role,
    photoStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args): Promise<Turn> => {
    const profile = args.role === "renter" ? await currentRenter(ctx) : await currentLandlord(ctx);
    if (profile === null) throw new ConvexError(`Sign in as a ${args.role} to use the assistant.`);
    const status = await rateLimiter.limit(ctx, "askPerUser", { key: profile.userId });
    if (!status.ok) {
      const minutes = Math.max(1, Math.ceil(status.retryAfter / 60_000));
      throw new ConvexError(`You've sent a lot of messages in a short time. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`);
    }
    const anonymous = await rateLimiter.limit(ctx, "askAnonymous");
    if (!anonymous.ok) throw new ConvexError("The assistant is busy right now. Try again in a minute.");

    const text = args.message.trim();
    if (text === "") throw new ConvexError("Type a message first.");
    if (text.length > MESSAGE_MAX_CHARS) {
      throw new ConvexError(`Keep messages under ${MESSAGE_MAX_CHARS} characters.`);
    }
    if (args.photoStorageId && (await ctx.db.system.get("_storage", args.photoStorageId)) === null) {
      throw new ConvexError("That photo upload could not be found. Attach it again.");
    }

    const now = Date.now();
    let conversationId = args.conversationId;
    if (conversationId === undefined) {
      conversationId = await ctx.db.insert("conversations", {
        participantIds: [profile.userId],
        capability: args.role === "renter" ? "leasing" : "discovery",
        title: text.length > 60 ? `${text.slice(0, 57)}...` : text,
        lastMessageAt: now,
      });
    } else {
      const conversation = await ctx.db.get("conversations", conversationId);
      if (conversation === null || !conversation.participantIds.includes(profile.userId)) {
        throw new ConvexError("That conversation isn't yours.");
      }
      await ctx.db.patch("conversations", conversationId, { lastMessageAt: now });
    }
    await ctx.db.insert("messages", {
      conversationId,
      authorId: profile.userId,
      authorRole: args.role,
      text,
      attachmentStorageIds: args.photoStorageId ? [args.photoStorageId] : [],
    });

    const [messages, actions] = await Promise.all([
      ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
        .order("desc")
        .take(HISTORY_LIMIT),
      ctx.db
        .query("agentActions")
        .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
        .order("desc")
        .take(HISTORY_LIMIT),
    ]);
    // Earlier tool calls go back to the model as developer notes, so ids it
    // found in an earlier turn (a listingId, a tourId) are still known.
    const history = [...messages, ...actions]
      .sort((a, b) => a._creationTime - b._creationTime)
      .flatMap((row): ResponseInputItem[] => {
        if ("tool" in row) {
          const note = JSON.stringify({ tool: row.tool, status: row.status, args: row.args, result: row.result });
          return [{ role: "developer", content: `Earlier tool call: ${note.slice(0, 3000)}` }];
        }
        if (row.authorRole === "system") return [];
        if (row.authorRole === "agent") return [{ role: "assistant", content: row.text }];
        const photos = row.attachmentStorageIds.map((id) => `\n(Attached photo id: ${id})`).join("");
        return [{ role: "user", content: row.text + photos }];
      });

    return {
      conversationId,
      userId: profile.userId,
      role: args.role,
      displayName: profile.displayName,
      history,
    };
  },
});

export const finishTurn = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    text: v.string(),
    agentActionId: v.optional(v.id("agentActions")),
    capability: v.optional(schema.tables.conversations.validator.fields.capability),
  },
  handler: async (ctx, args): Promise<ConversationView> => {
    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      authorRole: "agent",
      text: args.text,
      attachmentStorageIds: [],
      agentActionId: args.agentActionId,
    });
    await ctx.db.patch("conversations", args.conversationId, {
      lastMessageAt: Date.now(),
      ...(args.capability ? { capability: args.capability } : {}),
    });
    const conversation = await ctx.db.get("conversations", args.conversationId);
    return await conversationView(ctx, conversation!);
  },
});

// ------------------------------------------------------------ tools

type ToolResult = {
  output: unknown;
  agentActionId?: Id<"agentActions">;
  capability?: Capability;
};

async function runTool(
  ctx: ActionCtx,
  client: OpenAI,
  turn: Turn,
  call: ResponseFunctionToolCall,
): Promise<ToolResult> {
  const args = JSON.parse(call.arguments);
  const base = { conversationId: turn.conversationId, userId: turn.userId };
  const allowed = (turn.role === "renter" ? renterTools : landlordTools).some((t) => t.name === call.name);
  try {
    if (!allowed) throw new ConvexError(`${call.name} isn't available here.`);
    switch (call.name) {
      case "findListings":
        return await findListings(ctx, turn, args.criteria);
      case "bookTour":
        return await ctx.runMutation(internal.assistant.bookTour, {
          ...base,
          listingId: args.listingId,
          preferredWhen: args.preferredWhen,
        });
      case "createMaintenanceTicket": {
        const triage = await triageRepair(client, args.description);
        return await ctx.runMutation(internal.assistant.fileTicket, {
          ...base,
          description: args.description,
          photoStorageId: args.photoStorageId ?? undefined,
          triage,
        });
      }
      case "answerLeaseQuestion":
        return await answerLeaseQuestion(ctx, client, turn, args.question);
      default:
        throw new ConvexError(`Unknown tool ${call.name}.`);
    }
  } catch (error) {
    if (!(error instanceof ConvexError) || typeof error.data !== "string") throw error;
    await ctx.runMutation(internal.assistant.logAction, {
      ...base,
      capability: capabilityOf(call.name),
      tool: call.name,
      args,
      status: "failed",
      error: error.data,
    });
    return { output: { error: error.data } };
  }
}

function capabilityOf(tool: string): Capability {
  if (tool === "createMaintenanceTicket") return "maintenance";
  if (tool === "answerLeaseQuestion") return "rent";
  if (tool === "findListings") return "discovery";
  return "leasing";
}

// Audit rows for tools that need no approval, and for failed tool calls.
export const logAction = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    capability: schema.tables.agentActions.validator.fields.capability,
    tool: v.string(),
    args: v.any(),
    status: v.union(v.literal("executed"), v.literal("failed")),
    result: v.optional(v.any()),
    error: v.optional(v.string()),
  },
  returns: v.id("agentActions"),
  handler: async (ctx, { conversationId, userId, ...row }) =>
    await ctx.db.insert("agentActions", {
      ...row,
      conversationId,
      actorId: userId,
      requiresApproval: false,
    }),
});

// --- findListings

async function findListings(
  ctx: ActionCtx,
  turn: Turn,
  criteria: {
    keywords: string | null;
    neighborhood: string | null;
    maxRentDollars: number | null;
    minBedrooms: number | null;
  },
): Promise<ToolResult> {
  const listings = await ctx.runQuery(api.listings.discover, {});
  const words = (criteria.keywords ?? "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const neighborhood = criteria.neighborhood?.trim().toLowerCase();
  const scored = listings
    .filter((l) => l.status === "active")
    .filter((l) => !neighborhood || l.neighborhood.toLowerCase().includes(neighborhood))
    .filter((l) => criteria.maxRentDollars === null || l.rentMonthlyCents <= criteria.maxRentDollars * 100)
    .filter((l) => criteria.minBedrooms === null || l.bedrooms >= criteria.minBedrooms)
    .map((l) => {
      const haystack = [l.title, l.address, l.neighborhood, l.description ?? "", ...l.amenities]
        .join(" ")
        .toLowerCase();
      return { listing: l, score: words.filter((w) => haystack.includes(w)).length };
    })
    .filter(({ score }) => words.length === 0 || score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  const matches = scored.map(({ listing: l }) => ({
    listingId: l._id,
    title: l.title,
    address: l.address,
    neighborhood: l.neighborhood,
    rentMonthlyDollars: l.rentMonthlyCents / 100,
    bedrooms: l.bedrooms,
    bathrooms: l.bathrooms,
    availableFrom: l.availableFrom ? new Date(l.availableFrom).toISOString().slice(0, 10) : null,
    amenities: l.amenities,
  }));
  const agentActionId = await ctx.runMutation(internal.assistant.logAction, {
    conversationId: turn.conversationId,
    userId: turn.userId,
    capability: "discovery",
    tool: "findListings",
    args: { criteria },
    status: "executed",
    result: { listingIds: matches.map((m) => m.listingId) },
  });
  return { output: { matches }, agentActionId, capability: "discovery" };
}

// --- bookTour

type Window = Doc<"availability">;

// First slot in the owner's showing hours at or after the preferred time that
// doesn't overlap another proposed or confirmed tour.
function pickSlot(windows: Window[], busy: Doc<"tours">[], preferredWhen: string, now: number) {
  const timeZone = windows[0].timezone;
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(preferredWhen.trim());
  const start = match
    ? { year: +match[1], month: +match[2], day: +match[3], minuteOfDay: match[4] ? +match[4] * 60 + +match[5] : 0 }
    : zonedParts(now, timeZone);
  const preferred = zonedTimeToUtc(start.year, start.month, start.day, start.minuteOfDay, timeZone);
  const notBefore = Math.max(preferred, now + MIN_LEAD_MS);
  const length = TOUR_MINUTES * 60_000;
  for (let offset = 0; offset < SEARCH_DAYS; offset++) {
    const date = new Date(Date.UTC(start.year, start.month - 1, start.day + offset));
    const weekday = date.getUTCDay();
    const todays = windows
      .filter((w) => w.weekday === weekday)
      .sort((a, b) => a.startMinute - b.startMinute);
    for (const window of todays) {
      for (let minute = window.startMinute; minute + TOUR_MINUTES <= window.endMinute; minute += 30) {
        const slot = zonedTimeToUtc(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), minute, window.timezone);
        if (slot < notBefore) continue;
        const clashes = busy.some(
          (t) => slot < t.scheduledFor + t.durationMinutes * 60_000 && t.scheduledFor < slot + length,
        );
        if (!clashes) return { slot, timeZone: window.timezone };
      }
    }
  }
  return null;
}

export const bookTour = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    listingId: v.string(),
    preferredWhen: v.string(),
  },
  handler: async (ctx, args): Promise<ToolResult> => {
    const listingId = ctx.db.normalizeId("listings", args.listingId);
    const listing = listingId ? await ctx.db.get("listings", listingId) : null;
    if (listing === null || listing.status !== "active") {
      throw new ConvexError("That listing isn't available to tour. Search again with findListings.");
    }
    const { inquiryId, landlordId } = await inquiryFor(ctx, args.userId, listing);
    const windows = (
      await ctx.db
        .query("availability")
        .withIndex("by_landlord", (q) => q.eq("landlordId", landlordId))
        .take(100)
    ).filter((w) => w.listingId === undefined || w.listingId === listing._id);
    if (windows.length === 0) {
      throw new ConvexError("The owner hasn't set showing hours yet, so there's no slot to offer.");
    }
    const now = Date.now();
    const busy = (
      await ctx.db
        .query("tours")
        .withIndex("by_landlord_time", (q) => q.eq("landlordId", landlordId).gte("scheduledFor", now - 4 * HOUR))
        .take(500)
    ).filter((t) => t.status === "proposed" || t.status === "confirmed");
    const picked = pickSlot(windows, busy, args.preferredWhen, now);
    if (picked === null) {
      throw new ConvexError(`The owner has no open showing slot in the ${SEARCH_DAYS} days after that time.`);
    }
    const when = formatLocal(picked.slot, picked.timeZone);
    const tourId = await ctx.db.insert("tours", {
      inquiryId,
      listingId: listing._id,
      renterId: args.userId,
      landlordId,
      scheduledFor: picked.slot,
      durationMinutes: TOUR_MINUTES,
      status: "proposed",
      proposedBy: "agent",
      notes: `Renter asked for ${args.preferredWhen}.`,
    });
    const renter = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    const agentActionId = await ctx.db.insert("agentActions", {
      capability: "leasing",
      conversationId: args.conversationId,
      actorId: landlordId,
      tool: "bookTour",
      args: {
        tourId,
        inquiryId,
        listingId: listing._id,
        renterId: args.userId,
        scheduledFor: picked.slot,
        durationMinutes: TOUR_MINUTES,
        preferredWhen: args.preferredWhen,
        reason: `${renter?.displayName ?? "The renter"} asked for ${args.preferredWhen}. ${when} is the first open slot in your showing hours from then and doesn't overlap another tour.`,
      },
      requiresApproval: true,
      status: "proposed",
    });
    return {
      output: {
        status: "waiting_for_owner_approval",
        tourId,
        address: listing.address,
        scheduledFor: when,
        durationMinutes: TOUR_MINUTES,
      },
      agentActionId,
      capability: "leasing",
    };
  },
});

// --- createMaintenanceTicket

type Triage = {
  title: string;
  category: Doc<"maintenanceTickets">["category"];
  urgency: Doc<"maintenanceTickets">["urgency"];
  diagnosis: string;
  estimatedCostDollars: number;
};

const triageSchema = objectSchema({
  title: { type: "string", description: "A short ticket title, like 'Kitchen sink leaking under the cabinet'." },
  category: { type: "string", enum: categories, description: "The trade the repair needs." },
  urgency: {
    type: "string",
    enum: urgencies,
    description:
      "emergency: active danger or flooding, no heat in winter, no water, gas smell. high: damage gets worse within days or a core appliance is out. normal: needs fixing but can wait a week. low: cosmetic.",
  },
  diagnosis: { type: "string", description: "One or two sentences on the most likely cause, for the landlord." },
  estimatedCostDollars: { type: "number", description: "Typical San Francisco cost for the repair in US dollars, parts and labour." },
});

async function triageRepair(client: OpenAI, description: string): Promise<Triage> {
  const response = await respond(client, {
    instructions:
      "You triage repair requests from renters for their landlord. Judge only from the description; do not assume details it doesn't give.",
    input: [{ role: "user", content: description }],
    text: { format: { type: "json_schema", name: "repair_triage", strict: true, schema: triageSchema } },
  });
  return JSON.parse(response.output_text) as Triage;
}

export const fileTicket = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    description: v.string(),
    photoStorageId: v.optional(v.string()),
    triage: v.object({
      title: v.string(),
      category: ticketFields.category,
      urgency: ticketFields.urgency,
      diagnosis: v.string(),
      estimatedCostDollars: v.number(),
    }),
  },
  handler: async (ctx, args): Promise<ToolResult> => {
    const photoId = args.photoStorageId ? ctx.db.system.normalizeId("_storage", args.photoStorageId) : null;
    if (args.photoStorageId && photoId === null) {
      throw new ConvexError("That photo id isn't a valid upload.");
    }
    const { triage } = args;
    const estimatedCostCents = Math.max(0, Math.round(triage.estimatedCostDollars * 100));
    const { ticketId, landlordId } = await insertTicket(ctx, args.userId, {
      title: triage.title,
      description: args.description.trim(),
      category: triage.category,
      urgency: triage.urgency,
      status: "triaging",
      photoStorageIds: photoId ? [photoId] : [],
      aiDiagnosis: triage.diagnosis,
      aiSuggestedTrade: triage.category,
      aiEstimatedCostCents: estimatedCostCents,
    });
    const ticket = { ticketId, title: triage.title, category: triage.category, urgency: triage.urgency };
    const vendors = await ctx.db
      .query("vendors")
      .withIndex("by_landlord_trade", (q) => q.eq("landlordId", landlordId).eq("trade", triage.category))
      .take(20);
    const vendor = vendors.sort((a, b) => (a.hourlyRateCents ?? Infinity) - (b.hourlyRateCents ?? Infinity))[0];
    if (vendor === undefined) {
      return {
        output: { ...ticket, status: "triaging", vendor: null, note: `Your landlord has no ${triage.category} vendor on file yet, so they'll arrange the repair themselves.` },
        capability: "maintenance",
      };
    }
    // Next morning and afternoon in San Francisco, sooner for an emergency.
    const now = Date.now();
    const today = zonedParts(now, DEFAULT_TIMEZONE);
    const dayOffset = triage.urgency === "emergency" ? 0 : 1;
    const proposedSlots = [9 * 60, 13 * 60]
      .map((minute) => zonedTimeToUtc(today.year, today.month, today.day + dayOffset, minute, DEFAULT_TIMEZONE))
      .map((slot) => (slot < now + MIN_LEAD_MS ? slot + 24 * HOUR : slot));
    const bookingId = await ctx.db.insert("ticketBookings", {
      ticketId,
      vendorId: vendor._id,
      proposedSlots,
      estimatedCostCents,
      status: "awaiting_landlord_approval",
    });
    const tenant = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    const rate = vendor.hourlyRateCents ? ` at $${vendor.hourlyRateCents / 100}/hr` : "";
    const agentActionId = await ctx.db.insert("agentActions", {
      capability: "maintenance",
      conversationId: args.conversationId,
      actorId: landlordId,
      tool: "contactVendor",
      args: {
        ticketId,
        bookingId,
        vendorId: vendor._id,
        estimatedCostCents,
        slot: proposedSlots[0],
        reason: `${tenant?.displayName ?? "Your tenant"} reported: ${triage.title} (${triage.urgency} urgency). ${triage.diagnosis} ${vendor.name} is your ${triage.category} vendor${rate}; estimated $${estimatedCostCents / 100}.`,
      },
      requiresApproval: true,
      status: "proposed",
    });
    return {
      output: {
        ...ticket,
        status: "triaging",
        vendor: vendor.name,
        proposedVisit: formatLocal(proposedSlots[0]),
        estimatedCostDollars: estimatedCostCents / 100,
        note: "The vendor visit is waiting on the landlord's approval.",
      },
      agentActionId,
      capability: "maintenance",
    };
  },
});

// --- answerLeaseQuestion

export const leaseForTenant = internalQuery({
  args: { tenantId: v.id("users") },
  handler: async (ctx, { tenantId }) => {
    const lease = await activeLease(ctx, tenantId);
    if (lease === null) return null;
    const [clauses, listing] = await Promise.all([
      ctx.db
        .query("leaseClauses")
        .withIndex("by_lease_order", (q) => q.eq("leaseId", lease._id))
        .take(300),
      ctx.db.get("listings", lease.listingId),
    ]);
    return { lease, clauses, address: listing?.address ?? null };
  },
});

const leaseAnswerSchema = objectSchema({
  answer: { type: "string", description: "A direct answer in one to three plain sentences, using only the clauses." },
  sections: {
    type: "array",
    items: { type: "string" },
    description: "Section numbers of every clause the answer relies on, exactly as given, e.g. '8.2'.",
  },
});

async function answerLeaseQuestion(
  ctx: ActionCtx,
  client: OpenAI,
  turn: Turn,
  question: string,
): Promise<ToolResult> {
  const found = await ctx.runQuery(internal.assistant.leaseForTenant, { tenantId: turn.userId });
  const log = (result: unknown) =>
    ctx.runMutation(internal.assistant.logAction, {
      conversationId: turn.conversationId,
      userId: turn.userId,
      capability: "rent",
      tool: "answerLeaseQuestion",
      args: { question },
      status: "executed",
      result,
    });
  if (found === null || found.clauses.length === 0) {
    const output = {
      answer: found === null
        ? "There is no active lease on Dweller for this renter, so there are no lease terms to answer from."
        : "This lease has no clauses on Dweller yet, so there is no lease text to answer from.",
      citations: [],
    };
    return { output, agentActionId: await log(output), capability: "rent" };
  }
  const { lease, clauses, address } = found;
  const leaseText = clauses.map((c) => `Section ${c.section}, ${c.heading}:\n${c.text}`).join("\n\n");
  const response = await respond(client, {
    instructions: `You answer a renter's question about their lease using only its clauses below. If the clauses don't settle the question, say the lease doesn't address it and cite nothing.

Lease for ${address ?? "the unit"}: rent $${lease.rentMonthlyCents / 100}/month due on day ${lease.dueDayOfMonth}, deposit $${lease.depositCents / 100}, ${new Date(lease.startDate).toISOString().slice(0, 10)} to ${new Date(lease.endDate).toISOString().slice(0, 10)}.

${leaseText}`,
    input: [{ role: "user", content: question }],
    text: { format: { type: "json_schema", name: "lease_answer", strict: true, schema: leaseAnswerSchema } },
  });
  const parsed = JSON.parse(response.output_text) as { answer: string; sections: string[] };
  // Quotes come from the stored clause rows, never from the model.
  const citations = clauses
    .filter((c) => parsed.sections.includes(c.section))
    .map((c) => ({ section: c.section, heading: c.heading, quote: c.text }));
  const output = { answer: parsed.answer, citations };
  return {
    output,
    agentActionId: await log({ leaseId: lease._id, ...output }),
    capability: "rent",
  };
}

// ------------------------------------------------------------ OpenAI

function openAiClient() {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new ConvexError(
      "The assistant isn't set up yet: OPENAI_API_KEY is missing on this Convex deployment. Set it in the Convex dashboard under Settings → Environment Variables.",
    );
  }
  return new OpenAI({ apiKey });
}

async function respond(
  client: OpenAI,
  request: Omit<Parameters<OpenAI["responses"]["create"]>[0], "model" | "stream">,
): Promise<Response> {
  let response: Response;
  try {
    response = await client.responses.create({ ...request, model: MODEL, stream: false });
  } catch (error) {
    if (error instanceof OpenAI.APIError && error.status === 401) {
      throw new ConvexError("OpenAI rejected the OPENAI_API_KEY set on this Convex deployment. Update it in the Convex dashboard.");
    }
    if (error instanceof OpenAI.APIError && error.type === "insufficient_quota") {
      throw new ConvexError(`The OpenAI account behind OPENAI_API_KEY has no credits for ${MODEL}. Add credits in the OpenAI dashboard and try again.`);
    }
    if (error instanceof OpenAI.APIError && error.status === 429) {
      throw new ConvexError("OpenAI is busy right now. Try again in a minute.");
    }
    throw error;
  }
  if (response.status !== "completed") {
    throw new ConvexError("The assistant couldn't finish that reply. Try again.");
  }
  return response;
}
