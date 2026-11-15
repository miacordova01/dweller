import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  listings: defineTable({
    title: v.string(),
    address: v.string(),
    neighborhood: v.string(),
    rentMonthly: v.number(),
    bedrooms: v.number(),
    bathrooms: v.number(),
    availableFrom: v.string(),
    photoUrl: v.optional(v.string()),
    landlordName: v.string(),
    createdAt: v.number(),
  }).index("by_neighborhood", ["neighborhood"]),
});
