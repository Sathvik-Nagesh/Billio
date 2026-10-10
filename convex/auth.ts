import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Secure Multi-Tenant Authentication & Session Management for Billio
 */

async function hashSecret(secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(secret + "_billio_salt_2026");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Register a new organization/tenant with owner account & initial business profile
 */
export const register = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    businessName: v.string(),
  },
  handler: async (ctx, args) => {
    const cleanEmail = args.email.trim().toLowerCase();
    const cleanName = args.name.trim();
    const cleanBiz = args.businessName.trim();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      throw new Error("Please provide a valid email address.");
    }
    if (!args.password || args.password.length < 4) {
      throw new Error("Password must be at least 4 characters long.");
    }
    if (!cleanBiz) {
      throw new Error("Please provide a business or store name.");
    }

    // 1. Check if email is already registered in Convex
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", cleanEmail))
      .first();

    if (existing) {
      throw new Error(`An account with email '${cleanEmail}' is already registered. Please log in.`);
    }

    const now = new Date().toISOString();
    const slug = cleanBiz.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30) || "store";
    const tenantId = `tenant_${slug}_${Date.now().toString(36)}`;
    const passwordHash = await hashSecret(args.password);

    // 2. Create Tenant Organization
    await ctx.db.insert("tenants", {
      name: cleanBiz,
      slug,
      brandName: cleanBiz,
      plan: "starter",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    // 3. Create Owner User
    const userId = await ctx.db.insert("users", {
      tenantId,
      tokenIdentifier: `user_${cleanEmail}`,
      name: cleanName,
      email: cleanEmail,
      passwordHash,
      role: "owner",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    // 4. Create Initial Business Profile
    await ctx.db.insert("businesses", {
      tenantId,
      name: cleanBiz,
      email: cleanEmail,
      invoicePrefix: "INV-",
      invoiceYearFormat: "none",
      invoiceSeparator: "-",
      invoicePadding: 3,
      invoiceStartNumber: 1,
      accentColor: "#3b82f6",
      templateId: "minimal-modern",
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      user: {
        id: userId,
        name: cleanName,
        email: cleanEmail,
        role: "owner" as const,
        tenantId,
      },
    };
  },
});

/**
 * Authenticate user with email and password
 */
export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const cleanEmail = args.email.trim().toLowerCase();

    if (!cleanEmail) {
      throw new Error("Please enter your email address.");
    }
    if (!args.password) {
      throw new Error("Please enter your password.");
    }

    // 1. Locate user by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", cleanEmail))
      .first();

    if (!user) {
      throw new Error(`No account found for '${cleanEmail}'. Please check your email or create a new account.`);
    }

    if (user.status === "disabled") {
      throw new Error("This account has been disabled. Please contact your organization administrator.");
    }

    const inputHash = await hashSecret(args.password);

    // 2. Validate password
    if (user.passwordHash) {
      if (user.passwordHash !== inputHash) {
        throw new Error("Incorrect password. Please verify and try again.");
      }
    } else {
      // Legacy account created before password hashing - set password on first valid login
      await ctx.db.patch(user._id, {
        passwordHash: inputHash,
        updatedAt: new Date().toISOString(),
      });
    }

    return {
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        phone: user.phone,
      },
    };
  },
});

/**
 * Quick Cashier PIN authentication for a specific tenant
 */
export const loginWithPin = mutation({
  args: {
    tenantId: v.string(),
    pin: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.pin.length < 4) {
      throw new Error("PIN must be at least 4 digits.");
    }

    const cleanName = (args.name || "Cashier").trim();
    const pinHash = await hashSecret(args.pin);

    // Find cashier in this tenant
    const cashier = await ctx.db
      .query("users")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .filter((q) => q.eq(q.field("role"), "cashier"))
      .first();

    if (cashier && cashier.pinHash && cashier.pinHash !== pinHash) {
      throw new Error("Incorrect Cashier PIN.");
    }

    const now = new Date().toISOString();
    let userId = cashier?._id;

    if (!cashier) {
      userId = await ctx.db.insert("users", {
        tenantId: args.tenantId,
        tokenIdentifier: `cashier_${args.tenantId}_${Date.now().toString(36)}`,
        name: cleanName,
        email: `cashier@${args.tenantId}.local`,
        pinHash,
        role: "cashier",
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
    }

    return {
      success: true,
      user: {
        id: userId!,
        name: cleanName,
        email: cashier?.email || `cashier@${args.tenantId}.local`,
        role: "cashier" as const,
        tenantId: args.tenantId,
      },
    };
  },
});
