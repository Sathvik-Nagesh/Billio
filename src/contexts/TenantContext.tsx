import React, { createContext, useContext, useState, useEffect } from "react";
import type { Tenant, TenantBranding, TenantUser } from "../types/tenant";
import { db } from "../lib/db";
import { toast } from "sonner";

interface TenantContextType {
  currentTenant: Tenant;
  tenantsList: Tenant[];
  branding: TenantBranding;
  currentUser: TenantUser | null;
  switchTenant: (tenantIdOrSlug: string) => void;
  updateBranding: (branding: Partial<TenantBranding>) => void;
  createTenant: (name: string, slug: string, branding?: Partial<TenantBranding>) => Tenant;
  deleteTenant: (tenantId: string) => void;
  isMultiTenant: boolean;
}

const DEFAULT_BRANDING: TenantBranding = {
  brandName: "Billio",
  tagline: "Smart Book Invoicing & POS",
  primaryColor: "#3b82f6",
  accentColor: "#10b981",
  supportEmail: "support@billio.app",
};

const DEFAULT_TENANT: Tenant = {
  id: "tenant_default",
  name: "Main Organization",
  slug: "default",
  brandConfig: DEFAULT_BRANDING,
  plan: "pro",
  status: "active",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const TENANTS_STORAGE_KEY = "billio_tenants";
const ACTIVE_TENANT_KEY = "billio_active_tenant_id";

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenantsList, setTenantsList] = useState<Tenant[]>(() => {
    try {
      const stored = localStorage.getItem(TENANTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Failed to load tenants list:", e);
    }
    return [DEFAULT_TENANT];
  });

  const [activeTenantId, setActiveTenantId] = useState<string>(() => {
    try {
      // 1. Check URL subdomain or query param
      const urlParams = new URLSearchParams(window.location.search);
      const tenantParam = urlParams.get("tenant");
      if (tenantParam) return tenantParam;

      // 2. Check saved active tenant in storage
      const saved = localStorage.getItem(ACTIVE_TENANT_KEY);
      if (saved) return saved;
    } catch {
      // ignore
    }
    return DEFAULT_TENANT.id;
  });

  const currentTenant =
    tenantsList.find((t) => t.id === activeTenantId || t.slug === activeTenantId) ||
    tenantsList[0] ||
    DEFAULT_TENANT;

  const branding: TenantBranding = {
    ...DEFAULT_BRANDING,
    ...(currentTenant.brandConfig || {}),
  };

  const [currentUser] = useState<TenantUser | null>({
    id: "user_admin",
    tenantId: currentTenant.id,
    name: "Tenant Owner",
    email: branding.supportEmail || "owner@example.com",
    role: "owner",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Persist tenants list
  useEffect(() => {
    try {
      localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(tenantsList));
    } catch (err) {
      console.error("Failed to persist tenants:", err);
    }
  }, [tenantsList]);

  // Persist active tenant and sync local DB tenant scope
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_TENANT_KEY, currentTenant.id);
      db.setTenantId(currentTenant.id);
    } catch (err) {
      console.error("Failed to persist active tenant:", err);
    }
  }, [currentTenant.id]);

  // Apply White-Label branding to Document Title & CSS Theme
  useEffect(() => {
    const brandName = branding.brandName || "Billio";
    document.title = `${brandName} - ${branding.tagline || "Book Invoicing & POS"}`;

    const root = document.documentElement;
    if (branding.primaryColor) {
      root.style.setProperty("--brand-primary", branding.primaryColor);
    }
    if (branding.accentColor) {
      root.style.setProperty("--brand-accent", branding.accentColor);
    }

    // Dynamic favicon if provided
    if (branding.faviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.getElementsByTagName("head")[0].appendChild(link);
      }
      link.href = branding.faviconUrl;
    }
  }, [branding]);

  const switchTenant = (tenantIdOrSlug: string) => {
    const found = tenantsList.find((t) => t.id === tenantIdOrSlug || t.slug === tenantIdOrSlug);
    if (found) {
      setActiveTenantId(found.id);
      toast.success(`Switched workspace to ${found.name}`);
    } else {
      toast.error(`Workspace not found: ${tenantIdOrSlug}`);
    }
  };

  const updateBranding = (newBranding: Partial<TenantBranding>) => {
    setTenantsList((prev) =>
      prev.map((t) => {
        if (t.id === currentTenant.id) {
          const updatedBrand: TenantBranding = {
            ...(t.brandConfig || DEFAULT_BRANDING),
            ...newBranding,
          };
          return {
            ...t,
            name: newBranding.brandName || t.name,
            brandConfig: updatedBrand,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      })
    );
    toast.success("White-label brand styling updated successfully!");
  };

  const createTenant = (name: string, slug: string, customBrand?: Partial<TenantBranding>): Tenant => {
    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "-");
    const existing = tenantsList.find((t) => t.slug === cleanSlug);
    if (existing) {
      toast.error(`A tenant with slug '${cleanSlug}' already exists.`);
      return existing;
    }

    const now = new Date().toISOString();
    const newTenant: Tenant = {
      id: `tenant_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      slug: cleanSlug,
      brandConfig: {
        brandName: name.trim(),
        tagline: "Invoicing & Billing Portal",
        primaryColor: customBrand?.primaryColor || "#3b82f6",
        accentColor: customBrand?.accentColor || "#10b981",
        ...customBrand,
      },
      plan: "pro",
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    setTenantsList((prev) => [...prev, newTenant]);
    setActiveTenantId(newTenant.id);
    toast.success(`Tenant organization '${name}' created and activated!`);
    return newTenant;
  };

  const deleteTenant = (tenantId: string) => {
    if (tenantsList.length <= 1) {
      toast.error("Cannot delete the only remaining tenant workspace.");
      return;
    }

    setTenantsList((prev) => prev.filter((t) => t.id !== tenantId));
    if (currentTenant.id === tenantId) {
      const remaining = tenantsList.filter((t) => t.id !== tenantId);
      setActiveTenantId(remaining[0].id);
    }
    toast.success("Tenant workspace removed.");
  };

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        tenantsList,
        branding,
        currentUser,
        switchTenant,
        updateBranding,
        createTenant,
        deleteTenant,
        isMultiTenant: tenantsList.length > 1,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
};
