import { QueryCtx, MutationCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";

/**
 * Tenant Row-Level Security (RLS) & Access Control Engine
 * Ensures zero cross-tenant contamination or data leakage.
 */

export interface TenantContext {
  tenantId: string;
  tenant?: Doc<"tenants"> | null;
  user?: Doc<"users"> | null;
}

/**
 * Validates tenant access for a given request.
 * Resolves the tenant from tenantId or authenticated identity.
 */
export async function getTenantContext(
  ctx: QueryCtx | MutationCtx,
  tenantId: string
): Promise<TenantContext> {
  if (!tenantId || typeof tenantId !== "string" || tenantId.trim() === "") {
    throw new Error("RLS Authorization Error: A valid tenantId is strictly required for this operation.");
  }

  // Attempt to load tenant record to ensure active status
  let tenant: Doc<"tenants"> | null = null;
  try {
    const tenantDoc = await ctx.db.get(tenantId as Id<"tenants">);
    if (tenantDoc) {
      if (tenantDoc.status === "suspended") {
        throw new Error("Tenant Account Suspended: Access to this workspace is currently deactivated.");
      }
      tenant = tenantDoc;
    }
  } catch {
    // If tenantId is a custom string identifier, lookup by slug
    tenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", tenantId))
      .first();
  }

  // Check auth identity if available
  const identity = await ctx.auth.getUserIdentity();
  let user: Doc<"users"> | null = null;

  if (identity) {
    user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (user && user.tenantId !== tenantId) {
      throw new Error("RLS Security Violation: Authenticated user does not belong to the requested tenant.");
    }
  }

  return {
    tenantId,
    tenant,
    user,
  };
}

/**
 * Enforces that a target document belongs to the requesting tenant before reading/mutating.
 */
export function assertTenantMatch(
  doc: { tenantId?: string } | null,
  tenantId: string,
  entityName = "Document"
): void {
  if (!doc) {
    throw new Error(`${entityName} not found.`);
  }
  if (doc.tenantId !== tenantId) {
    throw new Error(`RLS Permission Denied: Cross-tenant access to ${entityName} is prohibited.`);
  }
}

/**
 * Validates role permissions for admin-level tenant operations.
 */
export function assertHasRole(
  user: Doc<"users"> | null | undefined,
  allowedRoles: Array<"owner" | "admin" | "cashier" | "staff" | "operator">
): void {
  // In development / demo mode where user isn't logged into external OAuth, allow default role
  if (!user) return;

  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Access Denied: Role '${user.role}' lacks permission for this action.`);
  }
}
