import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Convex Auth & User Identity helpers for Multi-Tenant white-labeling
 */

export const storeUser = mutation({
  args: {
    tenantId: v.string(),
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const tokenIdentifier = identity ? identity.tokenIdentifier : `local_${args.email}`;

    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .first();

    const now = new Date().toISOString();

    if (existing) {
      if (existing.name !== args.name || existing.email !== args.email) {
        await ctx.db.patch(existing._id, {
          name: args.name,
          email: args.email,
          updatedAt: now,
        });
      }
      return existing._id;
    }

    // Check if this is the very first user for this tenant; if so, make them owner
    const existingTenantUsers = await ctx.db
      .query("users")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    const role = existingTenantUsers.length === 0 ? "owner" : "staff";

    return await ctx.db.insert("users", {
      tenantId: args.tenantId,
      tokenIdentifier,
      name: args.name,
      email: args.email,
      role,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getSessionUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
  },
});
