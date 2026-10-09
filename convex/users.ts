import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getTenantContext, assertTenantMatch, assertHasRole } from "./lib/rls";

export const list = query({
  args: { tenantId: v.string() },
  handler: async (ctx, args) => {
    await getTenantContext(ctx, args.tenantId);
    return await ctx.db
      .query("users")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
  },
});

export const getCurrentUser = query({
  args: { tenantId: v.string() },
  handler: async (ctx, args) => {
    const { user } = await getTenantContext(ctx, args.tenantId);
    return user;
  },
});

export const inviteUser = mutation({
  args: {
    tenantId: v.string(),
    name: v.string(),
    email: v.string(),
    role: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("staff"),
      v.literal("operator")
    ),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await getTenantContext(ctx, args.tenantId);
    assertHasRole(user, ["owner", "admin"]);

    const cleanEmail = args.email.toLowerCase().trim();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_tenant_email", (q) =>
        q.eq("tenantId", args.tenantId).eq("email", cleanEmail)
      )
      .first();

    if (existing) {
      throw new Error(`User with email ${cleanEmail} is already invited to this tenant organization.`);
    }

    const now = new Date().toISOString();
    return await ctx.db.insert("users", {
      tenantId: args.tenantId,
      tokenIdentifier: `invited_${cleanEmail}`,
      name: args.name.trim(),
      email: cleanEmail,
      phone: args.phone,
      role: args.role,
      status: "invited",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateRole = mutation({
  args: {
    tenantId: v.string(),
    userId: v.id("users"),
    role: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("staff"),
      v.literal("operator")
    ),
  },
  handler: async (ctx, args) => {
    const { user } = await getTenantContext(ctx, args.tenantId);
    assertHasRole(user, ["owner"]);

    const targetUser = await ctx.db.get(args.userId);
    assertTenantMatch(targetUser, args.tenantId, "User");

    await ctx.db.patch(args.userId, {
      role: args.role,
      updatedAt: new Date().toISOString(),
    });

    return await ctx.db.get(args.userId);
  },
});

export const remove = mutation({
  args: {
    tenantId: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { user } = await getTenantContext(ctx, args.tenantId);
    assertHasRole(user, ["owner", "admin"]);

    const targetUser = await ctx.db.get(args.userId);
    assertTenantMatch(targetUser, args.tenantId, "User");

    await ctx.db.delete(args.userId);
    return true;
  },
});
