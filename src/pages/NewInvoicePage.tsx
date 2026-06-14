import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { InvoiceForm } from '@/components/invoice/InvoiceForm';
import { InvoicePreview } from '@/components/invoice/InvoicePreview';
import { InvoicePrintLayout } from '@/components/invoice/InvoicePrintLayout';
import { InvoiceActions } from '@/components/invoice/InvoiceActions';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { useInvoiceStore } from '@/stores/useInvoiceStore';
import { generateInvoiceNumber } from '@/lib/utils/invoiceNumber';
import { invoiceRepository } from '@/lib/db/repositories/invoiceRepository';
import { Button } from '@/components/ui';
import { Building2 } from 'lucide-react';

export function NewInvoicePage() {
  const navigate = useNavigate();
  const { activeBusiness, businesses } = useBusinessStore();
  const { form, updateField, editingInvoiceId } = useInvoiceStore();

  // Auto-set business and generate invoice number
  useEffect(() => {
    if (!form.businessId && activeBusiness) {
      updateField('businessId', activeBusiness.id);
    }
    if (!form.invoiceNumber && activeBusiness && !editingInvoiceId) {
      const nextNum = invoiceRepository.getNextSequenceNumber(activeBusiness.id);
      const num = generateInvoiceNumber(activeBusiness, nextNum);
      updateField('invoiceNumber', num);
    }
  }, [activeBusiness]);

  // No businesses set up yet
  if (businesses.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6 animate-fade-in">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-[var(--color-primary-50)] flex items-center justify-center mx-auto mb-6">
            <Building2 size={40} className="text-[var(--color-primary)]" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">No Business Set Up</h2>
          <p className="text-[var(--color-text-secondary)] text-sm mb-6">
            You need to create a business profile before creating invoices.
          </p>
          <Button id="goto-business-btn" onClick={() => navigate('/businesses/new')}>
            Create Business Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top action bar */}
      <div className="flex-shrink-0 px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between gap-4 no-print">
        <div className="text-sm">
          <span className="text-[var(--color-text-muted)]">Invoice: </span>
          <span className="font-semibold text-[var(--color-text-primary)]">{form.invoiceNumber || 'Draft'}</span>
          {editingInvoiceId && <span className="ml-2 text-xs text-[var(--color-primary)] font-medium">(Editing)</span>}
        </div>
        <InvoiceActions />
      </div>

      {/* Side-by-side: Form (left) + Preview (right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Form panel */}
        <div className="w-[600px] min-w-[450px] max-w-[60vw] flex-shrink-0 border-r border-[var(--color-border)] resize-x overflow-auto flex flex-col">
          <InvoiceForm />
        </div>

        {/* Preview panel */}
        <div className="flex-1 overflow-hidden">
          <InvoicePreview />
        </div>
      </div>

      {/* Dedicated hidden print layout for flawless PDF capture */}
      <div className="fixed top-0 left-[-9999px] z-[-9999] pointer-events-none">
        <InvoicePrintLayout id="invoice-pdf-layout" />
      </div>
    </div>
  );
}
