import React, { useMemo, useState, useRef, useEffect, useLayoutEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { useInvoiceStore } from '@/stores/useInvoiceStore';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { TEMPLATE_REGISTRY } from '@/templates';
import { chunkInvoiceItems, type PaginationMeasurements } from '@/lib/utils/pagination';
import type { InvoiceItem } from '@/types';

export function InvoicePreview() {
  const { form, calculations, paginationMeasurements: measurements, setPaginationMeasurements: setMeasurements } = useInvoiceStore();
  const { businesses } = useBusinessStore();
  const [scale, setScale] = useState(0.62);
  const templateRef = useRef<HTMLDivElement>(null);
  const measureContainerRef = useRef<HTMLDivElement>(null);
  const [renderedHeight, setRenderedHeight] = useState(1123); // default A4 height px

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

  // Dynamically measure the actual rendered height of the invoice
  // so the preview container compensates correctly for the CSS scale
  useEffect(() => {
    if (!templateRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const h = entry.contentRect.height;
        if (h > 0) setRenderedHeight(h);
      }
    });
    observer.observe(templateRef.current);
    return () => observer.disconnect();
  }, []);

  // Reset measurements when items or template configuration changes
  useEffect(() => {
    setMeasurements(null);
  }, [form.items, form.templateId, form.themeOverrides, form.invoiceLanguage, business, calculations]);

  // Perform DOM measurement pass
  useLayoutEffect(() => {
    if (measurements !== null || !measureContainerRef.current) return;

    const container = measureContainerRef.current;
    
    // Fallbacks if elements are missing
    let firstPageHeaderPx = 150;
    let subsequentHeaderPx = 40;
    let footerPx = 100;
    const rowHeightsPx: number[] = [];

    // Measure header
    const headerEl = container.querySelector('[data-measure="header"]');
    if (headerEl) {
      firstPageHeaderPx = headerEl.getBoundingClientRect().height;
      // We estimate subsequent header as a fraction if we don't have a specific element, 
      // but usually the table header alone is about 40px.
      const thead = container.querySelector('thead');
      if (thead) subsequentHeaderPx = thead.getBoundingClientRect().height;
    }

    // Measure footer
    const footerEl = container.querySelector('[data-measure="footer"]');
    if (footerEl) {
      footerPx = footerEl.getBoundingClientRect().height;
    }

    // Measure rows
    const rowEls = container.querySelectorAll('[data-measure="row"]');
    rowEls.forEach(el => {
      rowHeightsPx.push(el.getBoundingClientRect().height);
    });

    // Handle empty state gracefully
    if (rowHeightsPx.length === 0 && items.length > 0) {
      items.forEach(() => rowHeightsPx.push(30));
    }

    setMeasurements({
      firstPageHeaderPx,
      subsequentHeaderPx,
      footerPx,
      rowHeightsPx
    });
  }, [measurements, items]);

  // Paginate items using exact DOM measurements
  const itemChunks = chunkInvoiceItems(items, measurements);

  // Compensate for the CSS scale so the container doesn't leave empty space
  // after the scaled element ends (or overlap content if taller than A4)
  const totalUnscaledHeight = (renderedHeight * itemChunks.length) + (32 * Math.max(0, itemChunks.length - 1));
  const scaledTotalHeight = totalUnscaledHeight * scale;
  const marginOffset = scaledTotalHeight - totalUnscaledHeight; // negative when scale < 1

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

      {/* Hidden container for DOM measurement pass */}
      {!measurements && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', visibility: 'hidden', width: '794px' }}>
          <div ref={measureContainerRef}>
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
              pageNumber={1}
              totalPages={1}
            />
          </div>
        </div>
      )}

      {/* Scaled A4 preview */}
      <div className="flex-1 overflow-auto p-6 flex justify-center items-start">
        <div
          className="origin-top flex flex-col gap-8 pb-12"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            // Dynamically compensate for scale so the container shrinks/grows correctly
            marginBottom: `${marginOffset}px`,
          }}
        >
          <div id="invoice-print-area" className="flex flex-col gap-8">
            {itemChunks.map((chunk, idx) => (
              <div
                key={idx}
                className="invoice-preview-page bg-white relative"
                style={{
                  width: '794px', // 210mm at 96dpi
                  minHeight: '1123px', // 297mm at 96dpi
                  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.05)',
                  border: '1px solid rgba(0,0,0,0.05)'
                }}
              >
                <div ref={idx === 0 ? templateRef : null}>
                  <TemplateComponent
                    invoice={{
                      ...form,
                      id: '',
                      createdAt: '',
                      updatedAt: '',
                    } as any}
                    business={business}
                    items={chunk}
                    calculations={calculations}
                    language={form.invoiceLanguage}
                    themeOverrides={form.themeOverrides}
                    pageNumber={idx + 1}
                    totalPages={itemChunks.length}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
