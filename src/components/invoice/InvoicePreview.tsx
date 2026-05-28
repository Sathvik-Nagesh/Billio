import React, { useMemo, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { useInvoiceStore } from '@/stores/useInvoiceStore';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { TEMPLATE_REGISTRY } from '@/templates';
import type { InvoiceItem } from '@/types';

export function InvoicePreview() {
  const { form, calculations } = useInvoiceStore();
  const { businesses } = useBusinessStore();
  const [scale, setScale] = useState(0.62);

  const business = useMemo(
    () => businesses.find(b => b.id === form.businessId) ?? null,
    [businesses, form.businessId]
  );

  const TemplateComponent = TEMPLATE_REGISTRY[form.templateId] ?? TEMPLATE_REGISTRY['minimal-modern'];

  // Convert form items to InvoiceItem shape
  const items = form.items.map(item => ({
    ...item,
    invoiceId: '',
    sortOrder: item.srNo,
  })) as unknown as InvoiceItem[];

  // Calculate scale to fit within preview container
  // A4 = 210mm wide x 297mm high. At 96dpi, 210mm ≈ 794px, 297mm ≈ 1123px.
  const a4Height = 1123;
  const marginOffset = -(a4Height * (1 - scale));

  const handleZoomIn = () => setScale(s => Math.min(s + 0.1, 1.5));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.1, 0.3));
  const handleResetZoom = () => setScale(0.62);

  return (
    <div className="h-full bg-[var(--color-surface-secondary)] overflow-auto flex flex-col">
      {/* Preview header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">Live Preview — A4</span>
          <div className="flex items-center gap-1 bg-[var(--color-surface-tertiary)] rounded-lg p-0.5 border border-[var(--color-border)]">
            <button onClick={handleZoomOut} className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] rounded-md transition-colors" title="Zoom Out">
              <ZoomOut size={14} />
            </button>
            <span className="text-xs font-medium w-10 text-center text-[var(--color-text-secondary)]">{Math.round(scale * 100)}%</span>
            <button onClick={handleZoomIn} className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] rounded-md transition-colors" title="Zoom In">
              <ZoomIn size={14} />
            </button>
            <button onClick={handleResetZoom} className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] rounded-md transition-colors ml-1" title="Reset Zoom">
              <Maximize size={14} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-[var(--color-text-muted)]">Auto-updating</span>
        </div>
      </div>

      {/* Scaled A4 preview */}
      <div className="flex-1 overflow-auto p-6 flex justify-center items-start">
        <div
          className="invoice-preview-scale origin-top shadow-[var(--shadow-xl)] ring-1 ring-black/5"
          style={{
            width: '794px', // 210mm at 96dpi
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            marginBottom: `${marginOffset}px`, // compensate for scale height reduction
          }}
        >
          <TemplateComponent
            invoice={{
              ...form,
              id: '',
              createdAt: '',
              updatedAt: '',
            } as any}
            business={business}
            items={items}
            calculations={calculations}
            language={form.invoiceLanguage}
            themeOverrides={form.themeOverrides}
          />
        </div>
      </div>
    </div>
  );
}
