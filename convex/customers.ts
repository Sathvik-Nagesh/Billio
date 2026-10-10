import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getTenantContext, assertTenantMatch } from "./lib/rls";

export const list = query({
  args: { tenantId: v.string() },
  handler: async (ctx, args) => {
    await getTenantContext(ctx, args.tenantId);
    return await ctx.db
      .query("customers")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .order("desc")
      .collect();
  },
});

export const search = query({
  args: { tenantId: v.string(), query: v.string() },
  handler: async (ctx, args) => {
    await getTenantContext(ctx, args.tenantId);
    const q = args.query.toLowerCase().trim();
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_tenant", (queryBuilder) => queryBuilder.eq("tenantId", args.tenantId))
      .collect();

    if (!q) return customers.slice(0, 20);

    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q))
      )
      .slice(0, 20);
  },
});

export const upsertByName = mutation({
  args: {
    tenantId: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    gstin: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getTenantContext(ctx, args.tenantId);
    const trimmedName = args.name.trim();

    // Check existing customer
    const existing = await ctx.db
      .query("customers")
      .withIndex("by_tenant_name", (q) =>
        q.eq("tenantId", args.tenantId).eq("name", trimmedName)
      )
      .first();

    const now = new Date().toISOString();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...(args.phone !== undefined ? { phone: args.phone } : {}),
        ...(args.email !== undefined ? { email: args.email } : {}),
        ...(args.address !== undefined ? { address: args.address } : {}),
        ...(args.gstin !== undefined ? { gstin: args.gstin } : {}),
        ...(args.notes !== undefined ? { notes: args.notes } : {}),
        updatedAt: now,
      });
      return await ctx.db.get(existing._id);
    }

    const id = await ctx.db.insert("customers", {
      tenantId: args.tenantId,
      name: trimmedName,
      phone: args.phone,
      email: args.email,
      address: args.address,
      gstin: args.gstin,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(id);
  },
});

export const create = mutation({
  args: {
    tenantId: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    gstin: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getTenantContext(ctx, args.tenantId);
    const now = new Date().toISOString();
    return await ctx.db.insert("customers", {
      ...args,
      name: args.name.trim(),
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    tenantId: v.string(),
    customerId: v.id("customers"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    gstin: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getTenantContext(ctx, args.tenantId);
    const doc = await ctx.db.get(args.customerId);
    assertTenantMatch(doc, args.tenantId, "Customer");

    const { tenantId, customerId, ...data } = args;
    await ctx.db.patch(customerId, {
      ...data,
      ...(data.name ? { name: data.name.trim() } : {}),
      updatedAt: new Date().toISOString(),
    });
    return await ctx.db.get(customerId);
  },
});

export const remove = mutation({
  args: {
    tenantId: v.string(),
    customerId: v.id("customers"),
  },
  handler: async (ctx, args) => {
    await getTenantContext(ctx, args.tenantId);
    const doc = await ctx.db.get(args.customerId);
    assertTenantMatch(doc, args.tenantId, "Customer");
    await ctx.db.delete(args.customerId);
    return true;
  },
});
