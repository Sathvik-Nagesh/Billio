import type { Business, Invoice, InvoiceItem, ThemeOverrides } from '@/types';
import type { InvoiceCalculations } from '@/types';

export interface TemplateProps {
  invoice: Partial<Invoice>;
  business: Business | null;
  items: InvoiceItem[] | { id: string; srNo: number; productName: string; isbn: string; quantity: number; unitPrice: number; lineTotal: number }[];
  calculations: InvoiceCalculations;
  language: 'en' | 'kn';
  themeOverrides?: ThemeOverrides;
}

export type TemplateId =
  | 'minimal-modern'
  | 'premium-corporate'
  | 'traditional-indian'
  | 'publication-focus'
  | 'elegant-serif'
  | 'bold-contemporary';

export function getTemplateComponent(id: string): React.ComponentType<TemplateProps> {
  // Lazy import handled in InvoicePreview
  return null as unknown as React.ComponentType<TemplateProps>;
}
