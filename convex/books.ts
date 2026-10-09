import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getTenantContext, assertTenantMatch } from "./lib/rls";

export const list = query({
  args: { tenantId: v.string() },
  handler: async (ctx, args) => {
    await getTenantContext(ctx, args.tenantId);
    return await ctx.db
      .query("books")
      .withIndex("by_tenant_usage", (q) => q.eq("tenantId", args.tenantId))
      .order("desc")
      .collect();
  },
});

export const search = query({
  args: { tenantId: v.string(), query: v.string() },
  handler: async (ctx, args) => {
    await getTenantContext(ctx, args.tenantId);
    const q = args.query.toLowerCase().trim();
    const books = await ctx.db
      .query("books")
      .withIndex("by_tenant_usage", (builder) => builder.eq("tenantId", args.tenantId))
      .order("desc")
      .collect();

    if (!q) return books;

    return books.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.author && b.author.toLowerCase().includes(q)) ||
        (b.isbn && b.isbn.toLowerCase().includes(q))
    );
  },
});

export const upsert = mutation({
  args: {
    tenantId: v.string(),
    name: v.string(),
    unitPrice: v.number(),
    author: v.optional(v.string()),
    isbn: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getTenantContext(ctx, args.tenantId);
    const trimmedName = args.name.trim();

    // Check if book exists for this tenant
    const existing = await ctx.db
      .query("books")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .filter((q) => q.eq(q.field("name"), trimmedName))
      .first();

    const now = new Date().toISOString();

    if (existing) {
      await ctx.db.patch(existing._id, {
        usageCount: existing.usageCount + 1,
        ...(args.author !== undefined ? { author: args.author } : {}),
        ...(args.isbn !== undefined ? { isbn: args.isbn } : {}),
        updatedAt: now,
      });
      return await ctx.db.get(existing._id);
    }

    const id = await ctx.db.insert("books", {
      tenantId: args.tenantId,
      name: trimmedName,
      unitPrice: args.unitPrice,
      author: args.author,
      isbn: args.isbn,
      usageCount: 1,
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(id);
  },
});

export const update = mutation({
  args: {
    tenantId: v.string(),
    bookId: v.id("books"),
    name: v.optional(v.string()),
    author: v.optional(v.string()),
    isbn: v.optional(v.string()),
    unitPrice: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await getTenantContext(ctx, args.tenantId);
    const doc = await ctx.db.get(args.bookId);
    assertTenantMatch(doc, args.tenantId, "Book");

    const { tenantId, bookId, ...data } = args;
    await ctx.db.patch(bookId, {
      ...data,
      ...(data.name ? { name: data.name.trim() } : {}),
      updatedAt: new Date().toISOString(),
    });
    return await ctx.db.get(bookId);
  },
});

export const remove = mutation({
  args: {
    tenantId: v.string(),
    bookId: v.id("books"),
  },
  handler: async (ctx, args) => {
    await getTenantContext(ctx, args.tenantId);
    const doc = await ctx.db.get(args.bookId);
    assertTenantMatch(doc, args.tenantId, "Book");
    await ctx.db.delete(args.bookId);
    return true;
  },
});

export const incrementUsage = mutation({
  args: {
    tenantId: v.string(),
    bookId: v.id("books"),
  },
  handler: async (ctx, args) => {
    await getTenantContext(ctx, args.tenantId);
    const doc = await ctx.db.get(args.bookId);
    assertTenantMatch(doc, args.tenantId, "Book");
    await ctx.db.patch(args.bookId, {
      usageCount: doc!.usageCount + 1,
      updatedAt: new Date().toISOString(),
    });
    return true;
  },
});
