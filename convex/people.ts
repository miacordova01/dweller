import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";
import { ConvexError, v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import schema, { discoverFilters } from "./schema";

export const DEMO_LANDLORD_NAME = "Dana Whitfield";
// Jordan is the seeded renter with an active lease, so lease questions and
// maintenance requests have something real to work against.
export const DEMO_RENTER_NAME = "Jordan Lee";

// There is no sign-in flow yet. A signed-in caller resolves to their own
// profile; a signed-out caller falls back to the seeded demo person for the
// role. Once auth lands, this becomes a plain getAuthUserId + profile lookup
// and the demo fallback below should be deleted.
async function currentProfile(
  ctx: QueryCtx,
  role: "renter" | "landlord",
  demoName: string,
) {
  const userId = await getAuthUserId(ctx);
  if (userId !== null) {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    return profile?.role === role ? profile : null;
  }
  const profiles = await ctx.db
    .query("profiles")
    .withIndex("by_role", (q) => q.eq("role", role))
    .take(100);
  return profiles.find((p) => p.displayName === demoName) ?? null;
}

export const currentLandlord = (ctx: QueryCtx) =>
  currentProfile(ctx, "landlord", DEMO_LANDLORD_NAME);

export const currentRenter = (ctx: QueryCtx) =>
  currentProfile(ctx, "renter", DEMO_RENTER_NAME);

export async function activeLease(ctx: QueryCtx, tenantId: Id<"users">) {
  const leases = await ctx.db
    .query("leases")
    .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
    .take(20);
  return (
    leases.find((l) => l.status === "active" || l.status === "ending") ?? null
  );
}

export const renterPreferences = query({
  args: {},
  handler: async (ctx) => {
    const renter = await currentRenter(ctx);
    return renter?.preferences ?? null;
  },
});

// Onboarding saves every answer; Discover's filter sheet saves only filters.
export const saveRenterPreferences = mutation({
  args: { preferences: schema.tables.profiles.validator.fields.preferences },
  returns: v.null(),
  handler: async (ctx, { preferences }) => {
    const renter = await currentRenter(ctx);
    if (renter === null)
      throw new ConvexError("No renter profile to save preferences to.");
    await ctx.db.patch("profiles", renter._id, { preferences });
    return null;
  },
});

export const saveDiscoverFilters = mutation({
  args: { filters: discoverFilters },
  returns: v.null(),
  handler: async (ctx, { filters }) => {
    const renter = await currentRenter(ctx);
    if (renter === null)
      throw new ConvexError("No renter profile to save filters to.");
    await ctx.db.patch("profiles", renter._id, {
      preferences: { amenities: [], ...renter.preferences, filters },
    });
    return null;
  },
});
