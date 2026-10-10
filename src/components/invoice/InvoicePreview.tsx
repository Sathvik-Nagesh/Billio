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
  const containerRef = useRef<HTMLDivElement>(null);
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

  // Auto-fit scale to mobile container width
  const updateFitScale = () => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    if (width < 640) {
      // Mobile screen: Fit width with 16px margins
      const target = Math.max(0.38, Math.min(0.85, (width - 24) / 794));
      setScale(target);
    } else if (width < 1024) {
      // Tablet screen
      setScale(0.55);
    } else {
      setScale(0.68);
    }
  };

  useEffect(() => {
    updateFitScale();
    window.addEventListener('resize', updateFitScale);
    return () => window.removeEventListener('resize', updateFitScale);
  }, []);

  // Dynamically measure the actual rendered height of the invoice
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
    let firstPageHeaderPx = 150;
    let subsequentHeaderPx = 40;
    let footerPx = 100;
    const rowHeightsPx: number[] = [];

    const headerEl = container.querySelector('[data-measure="header"]');
    if (headerEl) {
      firstPageHeaderPx = headerEl.getBoundingClientRect().height;
      const thead = container.querySelector('thead');
      if (thead) subsequentHeaderPx = thead.getBoundingClientRect().height;
    }

    const footerEl = container.querySelector('[data-measure="footer"]');
    if (footerEl) {
      footerPx = footerEl.getBoundingClientRect().height;
    }

    const rowEls = container.querySelectorAll('[data-measure="row"]');
    rowEls.forEach(el => {
      rowHeightsPx.push(el.getBoundingClientRect().height);
    });

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

  const totalUnscaledHeight = (renderedHeight * itemChunks.length) + (32 * Math.max(0, itemChunks.length - 1));
  const scaledTotalHeight = totalUnscaledHeight * scale;
  const marginOffset = scaledTotalHeight - totalUnscaledHeight;

  const handleZoomIn = () => setScale(s => Math.min(s + 0.08, 1.5));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.08, 0.3));
  const handleResetZoom = () => updateFitScale();

  return (
    <div ref={containerRef} className="h-full bg-[var(--color-surface-secondary)] overflow-auto flex flex-col">
      {/* Preview header */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Bill Preview (A4)</span>
          <div className="flex items-center gap-1 bg-[var(--color-surface-tertiary)] rounded-lg p-0.5 border border-[var(--color-border)]">
            <button onClick={handleZoomOut} className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] rounded-md transition-colors" title="Zoom Out">
              <ZoomOut size={13} />
            </button>
            <span className="text-xs font-bold w-10 text-center text-[var(--color-text-secondary)]">{Math.round(scale * 100)}%</span>
            <button onClick={handleZoomIn} className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] rounded-md transition-colors" title="Zoom In">
              <ZoomIn size={13} />
            </button>
            <button onClick={handleResetZoom} className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] rounded-md transition-colors ml-0.5" title="Auto Fit">
              <Maximize size={13} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] text-[var(--color-text-muted)] font-medium">Live</span>
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
      <div className="flex-1 overflow-auto p-3 sm:p-6 flex justify-center items-start">
        <div
          className="origin-top flex flex-col gap-6 pb-12 transition-transform duration-200"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            marginBottom: `${marginOffset}px`,
          }}
        >
          <div id="invoice-print-area" className="flex flex-col gap-6">
            {itemChunks.map((chunk, idx) => (
              <div
                key={idx}
                className="invoice-preview-page bg-white relative rounded-sm shadow-xl"
                style={{
                  width: '794px', // 210mm at 96dpi
                  minHeight: '1123px', // 297mm at 96dpi
                  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)',
                  border: '1px solid rgba(0,0,0,0.08)'
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
