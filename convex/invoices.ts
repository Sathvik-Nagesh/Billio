import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getTenantContext, assertTenantMatch } from "./lib/rls";

export const list = query({
  args: {
    tenantId: v.string(),
    businessId: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    query: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getTenantContext(ctx, args.tenantId);

    let invoices = await ctx.db
      .query("invoices")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .order("desc")
      .collect();

    if (args.businessId) {
      invoices = invoices.filter((i) => i.businessId === args.businessId);
    }
    if (args.startDate) {
      invoices = invoices.filter((i) => i.invoiceDate >= args.startDate!);
    }
    if (args.endDate) {
      invoices = invoices.filter((i) => i.invoiceDate <= args.endDate!);
    }
    if (args.query) {
      const q = args.query.toLowerCase().trim();
      invoices = invoices.filter(
        (i) =>
          i.invoiceNumber.toLowerCase().includes(q) ||
          i.customerName.toLowerCase().includes(q) ||
          (i.customerPhone && i.customerPhone.includes(q)) ||
          (i.customerAddress && i.customerAddress.toLowerCase().includes(q))
      );
    }

    return invoices;
  },
});

export const get = query({
  args: {
    tenantId: v.string(),
    invoiceId: v.id("invoices"),
  },
  handler: async (ctx, args) => {
    await getTenantContext(ctx, args.tenantId);
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) return null;
    assertTenantMatch(invoice, args.tenantId, "Invoice");

    const items = await ctx.db
      .query("invoice_items")
      .withIndex("by_invoice", (q) => q.eq("invoiceId", args.invoiceId))
      .collect();

    items.sort((a, b) => a.sortOrder - b.sortOrder);

    return {
      ...invoice,
      items,
    };
  },
});

export const getItems = query({
  args: {
    tenantId: v.string(),
    invoiceId: v.string(),
  },
  handler: async (ctx, args) => {
    await getTenantContext(ctx, args.tenantId);
    const items = await ctx.db
      .query("invoice_items")
      .withIndex("by_invoice", (q) => q.eq("invoiceId", args.invoiceId))
      .collect();
    return items.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const getNextSequenceNumber = query({
  args: {
    tenantId: v.string(),
    businessId: v.string(),
  },
  handler: async (ctx, args) => {
    await getTenantContext(ctx, args.tenantId);
    const yearKey = new Date().getFullYear().toString();

    const seq = await ctx.db
      .query("invoice_sequences")
      .withIndex("by_tenant_biz_year", (q) =>
        q.eq("tenantId", args.tenantId).eq("businessId", args.businessId).eq("yearKey", yearKey)
      )
      .first();

    const nextSeq = seq ? seq.lastNumber + 1 : 1;
    return nextSeq;
  },
});

export const create = mutation({
  args: {
    tenantId: v.string(),
    businessId: v.string(),
    invoiceNumber: v.string(),
    invoiceDate: v.string(),
    dueDate: v.optional(v.string()),
    customerId: v.optional(v.string()),
    customerName: v.string(),
    customerPhone: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    customerAddress: v.optional(v.string()),
    customerGstin: v.optional(v.string()),
    customerNotes: v.optional(v.string()),
    subtotal: v.number(),
    discountType: v.union(v.literal("percentage"), v.literal("flat")),
    discountValue: v.number(),
    discountAmount: v.number(),
    roundOff: v.number(),
    grandTotal: v.number(),
    amountInWords: v.optional(v.string()),
    templateId: v.optional(v.string()),
    themeOverrides: v.optional(v.any()),
    invoiceLanguage: v.union(v.literal("en"), v.literal("kn")),
    pdfPath: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("final")),
    isPaid: v.optional(v.boolean()),
    paymentMethod: v.optional(v.union(v.literal("cash"), v.literal("upi"), v.literal("credit"))),
    paymentStatus: v.optional(v.union(v.literal("paid"), v.literal("pending"))),
    receivedAmount: v.optional(v.number()),
    changeAmount: v.optional(v.number()),
    items: v.array(
      v.object({
        srNo: v.number(),
        slNo: v.optional(v.string()),
        productName: v.string(),
        author: v.optional(v.string()),
        isbn: v.optional(v.string()),
        quantity: v.number(),
        unitPrice: v.number(),
        lineTotal: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    await getTenantContext(ctx, args.tenantId);
    const { tenantId, items, ...invoiceData } = args;

    const now = new Date().toISOString();

    // Check if invoice already exists for this tenant & invoiceNumber (idempotent sync)
    const existing = await ctx.db
      .query("invoices")
      .withIndex("by_tenant_number", (q) =>
        q.eq("tenantId", tenantId).eq("invoiceNumber", args.invoiceNumber)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...invoiceData,
        updatedAt: now,
      });

      // Clear existing items and re-insert
      const existingItems = await ctx.db
        .query("invoice_items")
        .withIndex("by_invoice", (q) => q.eq("invoiceId", existing._id))
        .collect();
      for (const itm of existingItems) {
        await ctx.db.delete(itm._id);
      }

      for (let i = 0; i < items.length; i++) {
        await ctx.db.insert("invoice_items", {
          tenantId,
          invoiceId: existing._id,
          srNo: items[i].srNo,
          slNo: items[i].slNo,
          productName: items[i].productName,
          author: items[i].author,
          isbn: items[i].isbn,
          quantity: items[i].quantity,
          unitPrice: items[i].unitPrice,
          lineTotal: items[i].lineTotal,
          sortOrder: i,
        });
      }

      return existing._id;
    }

    const invoiceId = await ctx.db.insert("invoices", {
      ...invoiceData,
      tenantId,
      createdAt: now,
      updatedAt: now,
    });

    // Insert items
    for (let i = 0; i < items.length; i++) {
      await ctx.db.insert("invoice_items", {
        tenantId,
        invoiceId: invoiceId,
        srNo: items[i].srNo,
        slNo: items[i].slNo,
        productName: items[i].productName,
        author: items[i].author,
        isbn: items[i].isbn,
        quantity: items[i].quantity,
        unitPrice: items[i].unitPrice,
        lineTotal: items[i].lineTotal,
        sortOrder: i,
      });
    }

    // Increment atomic sequence
    const yearKey = new Date().getFullYear().toString();
    const seq = await ctx.db
      .query("invoice_sequences")
      .withIndex("by_tenant_biz_year", (q) =>
        q.eq("tenantId", tenantId).eq("businessId", args.businessId).eq("yearKey", yearKey)
      )
      .first();

    if (seq) {
      await ctx.db.patch(seq._id, { lastNumber: seq.lastNumber + 1 });
    } else {
      await ctx.db.insert("invoice_sequences", {
        tenantId,
        businessId: args.businessId,
        yearKey,
        lastNumber: 1,
      });
    }

    return invoiceId;
  },
});

export const update = mutation({
  args: {
    tenantId: v.string(),
    invoiceId: v.id("invoices"),
    businessId: v.optional(v.string()),
    invoiceNumber: v.optional(v.string()),
    invoiceDate: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    customerId: v.optional(v.string()),
    customerName: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    customerAddress: v.optional(v.string()),
    customerGstin: v.optional(v.string()),
    customerNotes: v.optional(v.string()),
    subtotal: v.optional(v.number()),
    discountType: v.optional(v.union(v.literal("percentage"), v.literal("flat"))),
    discountValue: v.optional(v.number()),
    discountAmount: v.optional(v.number()),
    roundOff: v.optional(v.number()),
    grandTotal: v.optional(v.number()),
    amountInWords: v.optional(v.string()),
    templateId: v.optional(v.string()),
    themeOverrides: v.optional(v.any()),
    invoiceLanguage: v.optional(v.union(v.literal("en"), v.literal("kn"))),
    pdfPath: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("final"))),
    isPaid: v.optional(v.boolean()),
    paymentMethod: v.optional(v.union(v.literal("cash"), v.literal("upi"), v.literal("credit"))),
    paymentStatus: v.optional(v.union(v.literal("paid"), v.literal("pending"))),
    receivedAmount: v.optional(v.number()),
    changeAmount: v.optional(v.number()),
    items: v.optional(
      v.array(
        v.object({
          srNo: v.number(),
          slNo: v.optional(v.string()),
          productName: v.string(),
          author: v.optional(v.string()),
          isbn: v.optional(v.string()),
          quantity: v.number(),
          unitPrice: v.number(),
          lineTotal: v.number(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    await getTenantContext(ctx, args.tenantId);
    const invoice = await ctx.db.get(args.invoiceId);
    assertTenantMatch(invoice, args.tenantId, "Invoice");

    const { tenantId, invoiceId, items, ...updates } = args;

    await ctx.db.patch(invoiceId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    if (items !== undefined) {
      // Delete old line items
      const oldItems = await ctx.db
        .query("invoice_items")
        .withIndex("by_invoice", (q) => q.eq("invoiceId", invoiceId))
        .collect();

      for (const item of oldItems) {
        await ctx.db.delete(item._id);
      }

      // Re-insert new items
      for (let i = 0; i < items.length; i++) {
        await ctx.db.insert("invoice_items", {
          tenantId,
          invoiceId: invoiceId,
          srNo: items[i].srNo,
          slNo: items[i].slNo,
          productName: items[i].productName,
          author: items[i].author,
          isbn: items[i].isbn,
          quantity: items[i].quantity,
          unitPrice: items[i].unitPrice,
          lineTotal: items[i].lineTotal,
          sortOrder: i,
        });
      }
    }

    return await ctx.db.get(invoiceId);
  },
});

export const togglePaidStatus = mutation({
  args: {
    tenantId: v.string(),
    invoiceId: v.id("invoices"),
    isPaid: v.boolean(),
  },
  handler: async (ctx, args) => {
    await getTenantContext(ctx, args.tenantId);
    const invoice = await ctx.db.get(args.invoiceId);
    assertTenantMatch(invoice, args.tenantId, "Invoice");

    await ctx.db.patch(args.invoiceId, {
      isPaid: args.isPaid,
      paymentStatus: args.isPaid ? "paid" : "pending",
      updatedAt: new Date().toISOString(),
    });

    return await ctx.db.get(args.invoiceId);
  },
});

export const remove = mutation({
  args: {
    tenantId: v.string(),
    invoiceId: v.id("invoices"),
  },
  handler: async (ctx, args) => {
    await getTenantContext(ctx, args.tenantId);
    const invoice = await ctx.db.get(args.invoiceId);
    assertTenantMatch(invoice, args.tenantId, "Invoice");

    const items = await ctx.db
      .query("invoice_items")
      .withIndex("by_invoice", (q) => q.eq("invoiceId", args.invoiceId))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    await ctx.db.delete(args.invoiceId);
    return true;
  },
});

export const getDailyFairStats = query({
  args: {
    tenantId: v.string(),
    dateStr: v.optional(v.string()),
    businessId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getTenantContext(ctx, args.tenantId);
    const targetDate = args.dateStr || new Date().toISOString().split("T")[0];

    let all = await ctx.db
      .query("invoices")
      .withIndex("by_tenant_date", (q) =>
        q.eq("tenantId", args.tenantId).eq("invoiceDate", targetDate)
      )
      .collect();

    if (args.businessId) {
      all = all.filter((i) => i.businessId === args.businessId);
    }

    let totalRevenue = 0;
    let totalCash = 0;
    let totalUpi = 0;
    let totalCredit = 0;
    let totalBooks = 0;

    for (const inv of all) {
      totalRevenue += inv.grandTotal;
      const method = inv.paymentMethod || "cash";
      if (method === "cash") totalCash += inv.grandTotal;
      else if (method === "upi") totalUpi += inv.grandTotal;
      else if (method === "credit") totalCredit += inv.grandTotal;

      const items = await ctx.db
        .query("invoice_items")
        .withIndex("by_invoice", (q) => q.eq("invoiceId", inv._id))
        .collect();

      items.forEach((it) => {
        totalBooks += it.quantity || 1;
      });
    }

    return {
      date: targetDate,
      totalRevenue,
      totalInvoices: all.length,
      totalCash,
      totalUpi,
      totalCredit,
      totalBooks,
      invoices: all,
    };
  },
});
