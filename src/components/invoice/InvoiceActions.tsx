import React, { useRef, useState } from 'react';
import { Download, Printer, Share2, Copy, CheckCircle, Loader2, Save } from 'lucide-react';
import { Button, Tooltip } from '@/components/ui';
import { useInvoiceStore } from '@/stores/useInvoiceStore';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { TEMPLATE_REGISTRY } from '@/templates';
import { invoiceRepository } from '@/lib/db/repositories/invoiceRepository';
import { customerRepository } from '@/lib/db/repositories/customerRepository';
import { generateInvoiceNumber } from '@/lib/utils/invoiceNumber';
import type { InvoiceItem } from '@/types';
import { Toaster, toast } from 'sonner';

interface InvoiceActionsProps {
  onSaved?: (id: string) => void;
}

export function InvoiceActions({ onSaved }: InvoiceActionsProps) {
  const { form, calculations, editingInvoiceId, resetForm } = useInvoiceStore();
  const { businesses } = useBusinessStore();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const business = businesses.find(b => b.id === form.businessId) ?? null;

  const getInvoiceNumber = (): string => {
    if (form.invoiceNumber) return form.invoiceNumber;
    if (!business) return 'INV-001';
    const nextNum = invoiceRepository.getNextSequenceNumber(business.id);
    return generateInvoiceNumber(business, nextNum);
  };

  const buildInvoiceData = () => {
    const items = form.items.map((item, idx) => ({
      id: item.id,
      srNo: idx + 1,
      productName: item.productName,
      isbn: item.isbn,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      sortOrder: idx,
    }));

    return {
      invoiceData: {
        businessId: form.businessId,
        invoiceNumber: getInvoiceNumber(),
        invoiceDate: form.invoiceDate,
        dueDate: form.dueDate || undefined,
        customerName: form.customerName,
        customerPhone: form.customerPhone || undefined,
        customerEmail: form.customerEmail || undefined,
        customerAddress: form.customerAddress || undefined,
        customerGstin: form.customerGstin || undefined,
        customerNotes: form.customerNotes || undefined,
        subtotal: calculations.subtotal,
        discountType: form.discountType,
        discountValue: form.discountValue,
        discountAmount: calculations.discountAmount,
        roundOff: calculations.roundOff,
        grandTotal: calculations.grandTotal,
        amountInWords: calculations.amountInWords,
        templateId: form.templateId,
        themeOverrides: form.themeOverrides,
        invoiceLanguage: form.invoiceLanguage,
        status: 'final' as const,
      },
      items,
    };
  };

  const handleSave = async () => {
    if (!form.businessId) {
      toast.error('Please select a business first');
      return;
    }
    if (!form.customerName) {
      toast.error('Please enter customer name');
      return;
    }
    if (form.items.every(i => !i.productName)) {
      toast.error('Please add at least one item');
      return;
    }

    setSaving(true);
    try {
      const { invoiceData, items } = buildInvoiceData();

      // Auto-save customer
      if (form.customerName) {
        customerRepository.upsertByName({
          name: form.customerName,
          phone: form.customerPhone || undefined,
          email: form.customerEmail || undefined,
          address: form.customerAddress || undefined,
          gstin: form.customerGstin || undefined,
          notes: form.customerNotes || undefined,
        });
      }

      let savedId: string;
      if (editingInvoiceId) {
        invoiceRepository.update(editingInvoiceId, invoiceData, items as Omit<InvoiceItem, 'id' | 'invoiceId'>[]);
        savedId = editingInvoiceId;
        toast.success('Invoice updated successfully');
      } else {
        const created = invoiceRepository.create(invoiceData as any, items as any);
        savedId = created.id;
        toast.success('Invoice saved successfully');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onSaved?.(savedId);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = async () => {
    await handleSave();

    // Render the invoice to a hidden iframe for printing
    const TemplateComponent = TEMPLATE_REGISTRY[form.templateId] ?? TEMPLATE_REGISTRY['minimal-modern'];
    const invoiceEl = document.getElementById('invoice-print-area');
    if (!invoiceEl) {
      toast.error('Invoice preview not found');
      return;
    }

    const printContent = invoiceEl.outerHTML;
    const printWin = window.open('', '_blank');
    if (!printWin) {
      toast.error('Could not open print window. Please allow popups.');
      return;
    }
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${form.invoiceNumber || 'Draft'}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Noto+Sans+Kannada:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
          <style>
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
            body { margin: 0; padding: 0; background: white; }
            @page { size: A4; margin: 0; }
            table, tr, td, th { page-break-inside: avoid; }
            #invoice-print-area { min-height: auto !important; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
      printWin.close();
    }, 600);
  };

  const handleDownloadPdf = async () => {
    await handleSave();

    const invoiceEl = document.getElementById('invoice-print-area');
    if (!invoiceEl) {
      toast.error('Invoice preview not found. Please wait for it to load.');
      return;
    }

    toast.loading('Generating PDF...');
    try {
      // Create an unscaled clone to fix blank/cut-off PDF bugs caused by CSS transform scale
      const clone = invoiceEl.cloneNode(true) as HTMLElement;
      clone.style.transform = 'none';
      clone.style.position = 'fixed';
      clone.style.top = '0';
      clone.style.left = '0';
      clone.style.zIndex = '-9999';
      clone.style.width = '210mm';
      // Remove minHeight so it doesn't force a huge blank space at the bottom if short,
      // but keeps its natural height if long for pagination.
      clone.style.minHeight = 'auto';
      document.body.appendChild(clone);

      // @ts-ignore — html2pdf.js loaded as ESM
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin: [5, 0, 5, 0] as [number, number, number, number], // Slight top/bottom margin for multi-page padding
        filename: `Invoice-${form.invoiceNumber || 'draft'}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, windowWidth: 794 },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
        pagebreak: { mode: ['css', 'legacy'], avoid: 'tr' }
      };
      
      await html2pdf().set(opt).from(clone).save();
      
      document.body.removeChild(clone);
      toast.dismiss();
      toast.success('PDF downloaded!');
    } catch (err) {
      console.error(err);
      toast.dismiss();
      toast.error('PDF generation failed');
      // Cleanup in case of failure
      const orphanedClone = document.body.lastElementChild as HTMLElement;
      if (orphanedClone && orphanedClone.style.zIndex === '-9999') {
        document.body.removeChild(orphanedClone);
      }
    }
  };

  const handleWhatsApp = async () => {
    const phone = form.customerPhone?.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Dear ${form.customerName},\n\nPlease find attached your invoice ${form.invoiceNumber || ''} for ₹${calculations.grandTotal.toFixed(2)}.\n\nThank you for your business!\n\n${business?.name ?? ''}`
    );
    const url = phone
      ? `https://wa.me/${phone}?text=${message}`
      : `https://web.whatsapp.com/`;
    window.open(url, '_blank');
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="flex items-center gap-2 flex-wrap no-print">
        {/* Save */}
        <Button
          id="invoice-save-btn"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 min-w-[100px]"
        >
          {saving ? (
            <><Loader2 size={14} className="animate-spin" /> Saving...</>
          ) : saved ? (
            <><CheckCircle size={14} /> Saved!</>
          ) : (
            <><Save size={14} /> Save</>
          )}
        </Button>

        {/* PDF */}
        <Button
          id="invoice-pdf-btn"
          variant="outline"
          onClick={handleDownloadPdf}
          disabled={saving}
        >
          <Download size={14} />
          PDF
        </Button>

        {/* Print */}
        <Button
          id="invoice-print-btn"
          variant="outline"
          onClick={handlePrint}
          disabled={saving}
        >
          <Printer size={14} />
          Print
        </Button>

        {/* WhatsApp */}
        <Button
          id="invoice-whatsapp-btn"
          variant="outline"
          onClick={handleWhatsApp}
          className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950"
        >
          <Share2 size={14} />
          WhatsApp
        </Button>
      </div>
    </>
  );
}
