export interface TenantBranding {
  brandName?: string;
  tagline?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  supportEmail?: string;
  supportPhone?: string;
  customDomain?: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  customDomain?: string;
  brandConfig?: TenantBranding;
  plan: 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'trial';
  createdAt: string;
  updatedAt: string;
}

export interface TenantUser {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone?: string;
  role: 'owner' | 'admin' | 'staff' | 'operator';
  status: 'active' | 'invited' | 'disabled';
  createdAt: string;
  updatedAt: string;
}
