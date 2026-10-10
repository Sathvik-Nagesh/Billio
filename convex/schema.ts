import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Multi-Tenant White-Label Schema for Billio
 * Every data table is strictly scoped with `tenantId` and indexed for high-performance RLS isolation.
 */
export default defineSchema({
  // 1. Tenants (Organizations / White-label clients)
  tenants: defineTable({
    name: v.string(), // e.g., "Navakarnataka Publications"
    slug: v.string(), // e.g., "navakarnataka" - used for tenant resolution / subdomains
    customDomain: v.optional(v.string()), // e.g., "billing.navakarnataka.com"
    
    // White-label Branding Configuration
    brandName: v.optional(v.string()), // Custom app title (e.g. "Sahitya Billio", "BookBilling Pro")
    tagline: v.optional(v.string()),
    logoUrl: v.optional(v.string()), // Custom brand logo
    faviconUrl: v.optional(v.string()),
    primaryColor: v.optional(v.string()), // Custom brand primary HEX
    accentColor: v.optional(v.string()),
    supportEmail: v.optional(v.string()),
    supportPhone: v.optional(v.string()),
    
    // Plan & Account Status
    plan: v.union(v.literal("starter"), v.literal("pro"), v.literal("enterprise")),
    status: v.union(v.literal("active"), v.literal("suspended"), v.literal("trial")),
    maxUsers: v.optional(v.number()),
    
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_slug", ["slug"])
    .index("by_customDomain", ["customDomain"]),

  // 2. Tenant Users & Roles (Memberships)
  users: defineTable({
    tenantId: v.string(),
    tokenIdentifier: v.string(), // Auth provider ID or email-based identity
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    role: v.union(
      v.literal("owner"),     // Full billing, brand config, and tenant management
      v.literal("admin"),     // Management, business profiles, and reports
      v.literal("cashier"),   // Quick cashier & billing
      v.literal("staff"),     // Creating invoices, viewing books & history
      v.literal("operator")   // Fast POS Speed-Billing only
    ),
    status: v.union(v.literal("active"), v.literal("invited"), v.literal("disabled")),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_token", ["tokenIdentifier"])
    .index("by_tenant_email", ["tenantId", "email"]),

  // 3. Businesses (Multiple business profiles per tenant)
  businesses: defineTable({
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
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_name", ["tenantId", "name"])
    .index("by_tenant_default", ["tenantId", "isDefault"]),

  // 4. Customers (CRM scoped to tenant)
  customers: defineTable({
    tenantId: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    gstin: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_name", ["tenantId", "name"]),

  // 5. Book / Product Catalog
  books: defineTable({
    tenantId: v.string(),
    name: v.string(),
    author: v.optional(v.string()),
    isbn: v.optional(v.string()),
    unitPrice: v.number(),
    usageCount: v.number(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_usage", ["tenantId", "usageCount"])
    .index("by_tenant_name", ["tenantId", "name"]),

  // 6. Invoices
  invoices: defineTable({
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
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_biz", ["tenantId", "businessId"])
    .index("by_tenant_date", ["tenantId", "invoiceDate"])
    .index("by_tenant_number", ["tenantId", "invoiceNumber"]),

  // 7. Invoice Line Items
  invoice_items: defineTable({
    tenantId: v.string(),
    invoiceId: v.string(),
    srNo: v.number(),
    slNo: v.optional(v.string()),
    productName: v.string(),
    author: v.optional(v.string()),
    isbn: v.optional(v.string()),
    quantity: v.number(),
    unitPrice: v.number(),
    lineTotal: v.number(),
    sortOrder: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_invoice", ["invoiceId"])
    .index("by_tenant_invoice", ["tenantId", "invoiceId"]),

  // 8. Invoice Sequences (Atomic sequential numbering per business per year)
  invoice_sequences: defineTable({
    tenantId: v.string(),
    businessId: v.string(),
    yearKey: v.string(),
    lastNumber: v.number(),
  }).index("by_tenant_biz_year", ["tenantId", "businessId", "yearKey"]),

  // 9. Tenant Settings & Key-Value Configuration
  settings: defineTable({
    tenantId: v.string(),
    key: v.string(),
    value: v.string(),
  }).index("by_tenant_key", ["tenantId", "key"]),
});
