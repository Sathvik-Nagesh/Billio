import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getTenantContext, assertHasRole } from "./lib/rls";

export const get = query({
  args: { tenantId: v.string(), key: v.string() },
  handler: async (ctx, args) => {
    await getTenantContext(ctx, args.tenantId);
    const setting = await ctx.db
      .query("settings")
      .withIndex("by_tenant_key", (q) =>
        q.eq("tenantId", args.tenantId).eq("key", args.key)
      )
      .first();

    return setting ? setting.value : null;
  },
});

export const getAll = query({
  args: { tenantId: v.string() },
  handler: async (ctx, args) => {
    await getTenantContext(ctx, args.tenantId);
    const list = await ctx.db
      .query("settings")
      .withIndex("by_tenant_key", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    const record: Record<string, string> = {};
    list.forEach((item) => {
      record[item.key] = item.value;
    });
    return record;
  },
});

export const set = mutation({
  args: {
    tenantId: v.string(),
    key: v.string(),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await getTenantContext(ctx, args.tenantId);
    assertHasRole(user, ["owner", "admin"]);

    const existing = await ctx.db
      .query("settings")
      .withIndex("by_tenant_key", (q) =>
        q.eq("tenantId", args.tenantId).eq("key", args.key)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value });
      return existing._id;
    }

    return await ctx.db.insert("settings", {
      tenantId: args.tenantId,
      key: args.key,
      value: args.value,
    });
  },
});
