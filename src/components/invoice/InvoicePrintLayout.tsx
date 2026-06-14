import React, { useMemo } from 'react';
import { useInvoiceStore } from '@/stores/useInvoiceStore';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { TEMPLATE_REGISTRY } from '@/templates';
import { chunkInvoiceItems } from '@/lib/utils/pagination';
import type { InvoiceItem } from '@/types';

export function InvoicePrintLayout({ id, className = '' }: { id?: string; className?: string }) {
  const { form, calculations } = useInvoiceStore();
  const { businesses } = useBusinessStore();

  const business = useMemo(
    () => businesses.find(b => b.id === form.businessId) ?? null,
    [businesses, form.businessId]
  );

  const TemplateComponent = TEMPLATE_REGISTRY[form.templateId] ?? TEMPLATE_REGISTRY['minimal-modern'];

  const items = form.items.map(item => ({
    ...item,
    invoiceId: '',
    sortOrder: item.srNo,
  })) as unknown as InvoiceItem[];

  const itemChunks = chunkInvoiceItems(items, form, business);

  return (
    <div id={id} className={`flex flex-col bg-white ${className}`}>
      {itemChunks.map((chunk, idx) => (
        <div
          key={idx}
          style={{
            width: '794px',   // Exact A4 width at 96dpi
            height: '1122px', // 1122px is 296.86mm. 1123px is 297.12mm (which overflows A4 297mm and causes an extra blank page)
            boxSizing: 'border-box',
            pageBreakAfter: idx < itemChunks.length - 1 ? 'always' : 'auto',
            overflow: 'hidden', // Prevent any internal margin/padding from leaking
            backgroundColor: 'white',
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
            items={chunk}
            calculations={calculations}
            language={form.invoiceLanguage}
            themeOverrides={form.themeOverrides}
            pageNumber={idx + 1}
            totalPages={itemChunks.length}
          />
        </div>
      ))}
    </div>
  );
}
