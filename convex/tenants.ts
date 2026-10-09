import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getTenantContext, assertHasRole } from "./lib/rls";

export const getTenant = query({
  args: { tenantId: v.string() },
  handler: async (ctx, args) => {
    // 1. Direct ID lookup
    try {
      const doc = await ctx.db.get(args.tenantId as any);
      if (doc) return doc;
    } catch {
      // not a direct Convex ID
    }

    // 2. Slug lookup
    const bySlug = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", args.tenantId))
      .first();

    return bySlug;
  },
});

export const getTenantBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

export const getTenantByCustomDomain = query({
  args: { domain: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tenants")
      .withIndex("by_customDomain", (q) => q.eq("customDomain", args.domain))
      .first();
  },
});

export const listTenants = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tenants").collect();
  },
});

export const createTenant = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    brandName: v.optional(v.string()),
    tagline: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    accentColor: v.optional(v.string()),
    supportEmail: v.optional(v.string()),
    supportPhone: v.optional(v.string()),
    plan: v.union(v.literal("starter"), v.literal("pro"), v.literal("enterprise")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug.toLowerCase().trim()))
      .first();

    if (existing) {
      throw new Error(`Tenant slug '${args.slug}' is already registered.`);
    }

    const now = new Date().toISOString();
    const tenantId = await ctx.db.insert("tenants", {
      name: args.name,
      slug: args.slug.toLowerCase().trim(),
      brandName: args.brandName || args.name,
      tagline: args.tagline,
      logoUrl: args.logoUrl,
      primaryColor: args.primaryColor || "#3b82f6",
      accentColor: args.accentColor || "#10b981",
      supportEmail: args.supportEmail,
      supportPhone: args.supportPhone,
      plan: args.plan,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    return tenantId;
  },
});

export const updateBrandConfig = mutation({
  args: {
    tenantId: v.string(),
    brandName: v.optional(v.string()),
    tagline: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    faviconUrl: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    accentColor: v.optional(v.string()),
    supportEmail: v.optional(v.string()),
    supportPhone: v.optional(v.string()),
    customDomain: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { tenant, user } = await getTenantContext(ctx, args.tenantId);
    assertHasRole(user, ["owner", "admin"]);

    if (!tenant) {
      throw new Error("Tenant not found to update brand configuration.");
    }

    await ctx.db.patch(tenant._id, {
      ...(args.brandName !== undefined ? { brandName: args.brandName } : {}),
      ...(args.tagline !== undefined ? { tagline: args.tagline } : {}),
      ...(args.logoUrl !== undefined ? { logoUrl: args.logoUrl } : {}),
      ...(args.faviconUrl !== undefined ? { faviconUrl: args.faviconUrl } : {}),
      ...(args.primaryColor !== undefined ? { primaryColor: args.primaryColor } : {}),
      ...(args.accentColor !== undefined ? { accentColor: args.accentColor } : {}),
      ...(args.supportEmail !== undefined ? { supportEmail: args.supportEmail } : {}),
      ...(args.supportPhone !== undefined ? { supportPhone: args.supportPhone } : {}),
      ...(args.customDomain !== undefined ? { customDomain: args.customDomain } : {}),
      updatedAt: new Date().toISOString(),
    });

    return true;
  },
});
