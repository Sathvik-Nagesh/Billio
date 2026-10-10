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
import { Building2, Eye, FileEdit } from 'lucide-react';

export function NewInvoicePage() {
  const navigate = useNavigate();
  const { activeBusiness, businesses } = useBusinessStore();
  const { form, updateField, editingInvoiceId } = useInvoiceStore();
  const [mobileTab, setMobileTab] = React.useState<'form' | 'preview'>('form');

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
    <div className="h-full flex flex-col min-w-0 relative">
      {/* Sleek Top Bar (Single Row, No Wrapping Clutter) */}
      <div className="flex-shrink-0 px-3 sm:px-4 py-2 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between gap-2 no-print">
        <div className="flex items-center gap-2 min-w-0">
          <div className="text-xs sm:text-sm truncate">
            <span className="text-[var(--color-text-muted)]">Bill: </span>
            <span className="font-bold text-[var(--color-text-primary)]">{form.invoiceNumber || 'Draft'}</span>
            {editingInvoiceId && <span className="ml-1.5 text-xs text-[var(--color-primary)] font-bold">(Editing)</span>}
          </div>
        </div>

        {/* Mobile View Switcher (Form / Preview) */}
        <div className="flex lg:hidden items-center p-0.5 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
          <button
            onClick={() => setMobileTab('form')}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              mobileTab === 'form'
                ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-xs font-bold'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <FileEdit size={12} />
            <span>Bill Editor</span>
          </button>
          <button
            onClick={() => setMobileTab('preview')}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              mobileTab === 'preview'
                ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-xs font-bold'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Eye size={12} />
            <span>Preview</span>
          </button>
        </div>

        {/* Minimal Top Bar Actions */}
        <InvoiceActions variant="top-bar" />
      </div>

      {/* Main Form & Preview Viewport */}
      <div className="flex-1 flex overflow-hidden min-w-0 relative">
        {/* Form panel */}
        <div className={`w-full lg:w-[540px] xl:w-[620px] lg:min-w-[440px] flex-shrink-0 border-r border-[var(--color-border)] overflow-hidden flex flex-col ${
          mobileTab === 'form' ? 'flex' : 'hidden lg:flex'
        }`}>
          <InvoiceForm />
        </div>

        {/* Preview panel */}
        <div className={`flex-1 overflow-hidden min-w-0 ${
          mobileTab === 'preview' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'
        }`}>
          <InvoicePreview />
        </div>
      </div>

      {/* Sticky Bottom POS Checkout Bar */}
      <div className="flex-shrink-0">
        <InvoiceActions variant="bottom-bar" />
      </div>

      {/* Dedicated hidden print layout for PDF capture */}
      <div className="fixed top-0 left-[-9999px] z-[-9999] pointer-events-none">
        <InvoicePrintLayout id="invoice-pdf-layout" />
      </div>
    </div>
  );
}
