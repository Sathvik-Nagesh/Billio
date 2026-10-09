import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getTenantContext, assertTenantMatch, assertHasRole } from "./lib/rls";

export const list = query({
  args: { tenantId: v.string() },
  handler: async (ctx, args) => {
    await getTenantContext(ctx, args.tenantId);
    return await ctx.db
      .query("businesses")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
  },
});

export const get = query({
  args: { tenantId: v.string(), businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    await getTenantContext(ctx, args.tenantId);
    const doc = await ctx.db.get(args.businessId);
    if (!doc) return null;
    assertTenantMatch(doc, args.tenantId, "Business");
    return doc;
  },
});

export const getDefault = query({
  args: { tenantId: v.string() },
  handler: async (ctx, args) => {
    await getTenantContext(ctx, args.tenantId);
    const def = await ctx.db
      .query("businesses")
      .withIndex("by_tenant_default", (q) =>
        q.eq("tenantId", args.tenantId).eq("isDefault", true)
      )
      .first();

    if (def) return def;

    // Fallback to first business if no default explicitly marked
    return await ctx.db
      .query("businesses")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .first();
  },
});

export const create = mutation({
  args: {
    tenantId: v.string(),
    name: v.string(),
    logoPath: v.optional(v.string()),
    address: v.optional(v.string()),
    gstin: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    bankName: v.optional(v.string()),
    bankAccount: v.optional(v.string()),
    bankIfsc: v.optional(v.string()),
    bankBranch: v.optional(v.string()),
    upiId: v.optional(v.string()),
    upiQrPath: v.optional(v.string()),
    terms: v.optional(v.string()),
    signaturePath: v.optional(v.string()),
    sealPath: v.optional(v.string()),
    invoicePrefix: v.optional(v.string()),
    invoiceYearFormat: v.union(v.literal("YYYY"), v.literal("FY"), v.literal("YY"), v.literal("none")),
    invoiceSeparator: v.string(),
    invoicePadding: v.number(),
    invoiceStartNumber: v.number(),
    accentColor: v.string(),
    templateId: v.string(),
    isDefault: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { user } = await getTenantContext(ctx, args.tenantId);
    assertHasRole(user, ["owner", "admin"]);

    const existingBusinesses = await ctx.db
      .query("businesses")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    let isDefault = args.isDefault;
    if (existingBusinesses.length === 0) {
      isDefault = true;
    }

    if (isDefault) {
      for (const biz of existingBusinesses) {
        if (biz.isDefault) {
          await ctx.db.patch(biz._id, { isDefault: false });
        }
      }
    }

    const now = new Date().toISOString();
    return await ctx.db.insert("businesses", {
      ...args,
      isDefault,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    tenantId: v.string(),
    businessId: v.id("businesses"),
    name: v.optional(v.string()),
    logoPath: v.optional(v.string()),
    address: v.optional(v.string()),
    gstin: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    bankName: v.optional(v.string()),
    bankAccount: v.optional(v.string()),
    bankIfsc: v.optional(v.string()),
    bankBranch: v.optional(v.string()),
    upiId: v.optional(v.string()),
    upiQrPath: v.optional(v.string()),
    terms: v.optional(v.string()),
    signaturePath: v.optional(v.string()),
    sealPath: v.optional(v.string()),
    invoicePrefix: v.optional(v.string()),
    invoiceYearFormat: v.optional(v.union(v.literal("YYYY"), v.literal("FY"), v.literal("YY"), v.literal("none"))),
    invoiceSeparator: v.optional(v.string()),
    invoicePadding: v.optional(v.number()),
    invoiceStartNumber: v.optional(v.number()),
    accentColor: v.optional(v.string()),
    templateId: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { user } = await getTenantContext(ctx, args.tenantId);
    assertHasRole(user, ["owner", "admin"]);

    const doc = await ctx.db.get(args.businessId);
    assertTenantMatch(doc, args.tenantId, "Business");

    const { tenantId, businessId, ...updates } = args;

    if (updates.isDefault) {
      const allBiz = await ctx.db
        .query("businesses")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
        .collect();
      for (const b of allBiz) {
        if (b._id !== businessId && b.isDefault) {
          await ctx.db.patch(b._id, { isDefault: false });
        }
      }
    }

    await ctx.db.patch(businessId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    return await ctx.db.get(businessId);
  },
});

export const remove = mutation({
  args: {
    tenantId: v.string(),
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const { user } = await getTenantContext(ctx, args.tenantId);
    assertHasRole(user, ["owner", "admin"]);

    const doc = await ctx.db.get(args.businessId);
    assertTenantMatch(doc, args.tenantId, "Business");

    await ctx.db.delete(args.businessId);

    // If deleted business was default, promote another business
    const remaining = await ctx.db
      .query("businesses")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    if (remaining.length > 0 && !remaining.some((b) => b.isDefault)) {
      await ctx.db.patch(remaining[0]._id, { isDefault: true });
    }

    return true;
  },
});
