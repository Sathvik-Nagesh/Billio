import React, { useState } from 'react';
import { Download, Printer, Share2, CheckCircle, Loader2, Send, MoreVertical, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';
import { useInvoiceStore } from '@/stores/useInvoiceStore';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { useAppSettingsStore } from '@/stores/useAppSettingsStore';
import { invoiceRepository } from '@/lib/db/repositories/invoiceRepository';
import { customerRepository } from '@/lib/db/repositories/customerRepository';
import { bookRepository } from '@/lib/db/repositories/bookRepository';
import { generateInvoiceNumber } from '@/lib/utils/invoiceNumber';
import { formatINR, formatNumber } from '@/lib/utils/currency';
import type { InvoiceItem } from '@/types';
import { getWhatsAppShareUrl } from '@/lib/utils/phone';
import { getBilingualWhatsAppGreeting } from '@/lib/utils/kannadaLabels';
import { toast } from 'sonner';

interface InvoiceActionsProps {
  onSaved?: (id: string) => void;
  variant?: 'top-bar' | 'bottom-bar' | 'all';
}

export function InvoiceActions({ onSaved, variant = 'all' }: InvoiceActionsProps) {
  const { form, calculations, editingInvoiceId } = useInvoiceStore();
  const { businesses } = useBusinessStore();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

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
      slNo: item.slNo || undefined,
      author: item.author,
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
        customerName: form.customerName || 'Walk-in Customer',
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
        isPaid: form.paymentMethod !== 'credit',
        paymentMethod: (form.paymentMethod || 'cash') as 'cash' | 'upi' | 'credit',
        paymentStatus: (form.paymentMethod === 'credit' ? 'pending' : 'paid') as 'paid' | 'pending',
        receivedAmount: form.receivedAmount || 0,
        changeAmount: form.changeAmount || 0,
      },
      items,
    };
  };

  const handleSave = async (options?: { silent?: boolean }) => {
    if (!form.businessId) {
      toast.error('Please select a business first');
      return null;
    }
    if (!business) {
      toast.error('Selected business not found. Please re-select business.');
      return null;
    }
    if (form.items.every(i => !i.productName)) {
      toast.error('Please add at least one item');
      return null;
    }

    setSaving(true);
    try {
      const { invoiceData, items } = buildInvoiceData();

      // Auto-save customer details
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

      // Auto-seed books into repository & catalog automatically
      for (const item of items) {
        if (item.productName && item.productName.trim()) {
          bookRepository.upsert(item.productName.trim(), item.unitPrice, item.author?.trim() || undefined);
        }
      }

      let savedId = '';
      if (editingInvoiceId) {
        invoiceRepository.update(editingInvoiceId, invoiceData, items as Omit<InvoiceItem, 'id' | 'invoiceId'>[]);
        savedId = editingInvoiceId;
        if (!options?.silent) toast.success('Invoice updated successfully');
      } else {
        const created = invoiceRepository.create(invoiceData as any, items as any);
        savedId = created.id;
        if (!options?.silent) toast.success('Invoice saved successfully');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onSaved?.(savedId);
      return savedId;
    } catch (err) {
      console.error(err);
      toast.error('Failed to save invoice');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const getInvoiceElement = (): HTMLElement | null => {
    return document.getElementById('invoice-pdf-layout');
  };

  const generatePdfBlob = async (): Promise<Blob | null> => {
    const invoiceEl = getInvoiceElement();
    if (!invoiceEl) return null;

    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    // @ts-ignore — html2pdf.js loaded as ESM
    const html2pdf = (await import('html2pdf.js')).default;
    const expectedPages = invoiceEl.children.length;

    const opt = {
      margin: 0,
      filename: `Invoice-${form.invoiceNumber || 'draft'}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794,
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait' as const,
        compress: true,
      },
      pagebreak: {
        mode: 'css',
      },
    };

    const worker = html2pdf().set(opt).from(invoiceEl);
    await worker.toPdf().get('pdf').then((pdf: any) => {
      const actualPages = pdf.internal.getNumberOfPages();
      if (actualPages > expectedPages) {
        let pagesToRemove = actualPages - expectedPages;
        for (let i = 0; i < pagesToRemove; i++) {
          pdf.deletePage(actualPages - i);
        }
      }
    });

    return await worker.output('blob');
  };

  const getGreetingMessage = (): string => {
    const { whatsappTemplate } = useAppSettingsStore.getState();
    const customerName = form.customerName || 'Valued Customer';
    const businessName = business?.name || 'Billio';
    const invNum = form.invoiceNumber || getInvoiceNumber();
    const amount = `₹${formatNumber(calculations.grandTotal)}`;
    const paymentModeLabel = form.paymentMethod === 'upi' ? 'Paid via UPI / QR' : form.paymentMethod === 'credit' ? 'Payment Due' : 'Paid in Cash';
    const totalItems = form.items.reduce((acc, i) => acc + (i.quantity || 1), 0);

    if (whatsappTemplate && whatsappTemplate.trim()) {
      return whatsappTemplate
        .replace(/{customer_name}/g, customerName)
        .replace(/{invoice_number}/g, invNum)
        .replace(/{amount}/g, amount)
        .replace(/{payment_mode}/g, paymentModeLabel)
        .replace(/{payment_status}/g, form.paymentMethod === 'credit' ? 'Pending' : 'Paid')
        .replace(/{business_name}/g, businessName);
    }

    if (form.invoiceLanguage === 'kn') {
      return getBilingualWhatsAppGreeting({
        customerName: form.customerName,
        businessName: business?.name,
        invoiceNumber: invNum,
        grandTotal: calculations.grandTotal,
        balanceDue: form.paymentMethod === 'credit' ? calculations.grandTotal : undefined,
        paymentMode: paymentModeLabel,
        isKannada: true,
      });
    }

    // Default Greeting Template with clear emoji formatting
    return `📚 *${businessName}*\n` +
      `────────────────────────\n` +
      `🙏 *Namaste ${customerName},*\n\n` +
      `Thank you for your purchase! Here are your bill details:\n\n` +
      `🧾 *Invoice No:* ${invNum}\n` +
      `📅 *Date:* ${form.invoiceDate}\n` +
      `📦 *Items:* ${totalItems} item(s)\n` +
      `💰 *Grand Total:* ${amount}\n` +
      `💵 *Payment:* ${paymentModeLabel}\n\n` +
      `✨ Thank you for choosing *${businessName}*! Please visit again.`;
  };

  const handlePrint = async () => {
    await handleSave({ silent: true });

    const invoiceEl = getInvoiceElement();
    if (!invoiceEl) {
      toast.error('Invoice preview not ready');
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
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }
            tr { page-break-inside: avoid; }
            #invoice-print-area { min-height: unset !important; width: 210mm !important; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    printWin.document.close();

    printWin.onload = () => {
      printWin.focus();
      const doprint = () => {
        setTimeout(() => {
          printWin.print();
          printWin.close();
        }, 300);
      };
      if (printWin.document.fonts?.ready) {
        printWin.document.fonts.ready.then(doprint);
      } else {
        doprint();
      }
    };
  };

  const handleDownloadPdf = async () => {
    await handleSave({ silent: true });
    const toastId = toast.loading('Generating PDF…');
    try {
      const pdfBlob = await generatePdfBlob();
      if (!pdfBlob) {
        toast.error('Could not generate PDF. Please try again.');
        toast.dismiss(toastId);
        return;
      }

      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${form.invoiceNumber || 'draft'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      toast.dismiss(toastId);
      toast.success('PDF downloaded!');
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.dismiss(toastId);
      toast.error('PDF generation failed.');
    }
  };

  /**
   * Fast 1-Tap PDF + WhatsApp with Native Mobile File Sharing
   */
  const handleSendBill = async () => {
    await handleSave({ silent: true });
    const toastId = toast.loading('Preparing Bill & PDF…');

    try {
      const greetingMsg = getGreetingMessage();
      const phone = form.customerPhone?.replace(/\D/g, '');
      const pdfBlob = await generatePdfBlob();

      // Check if mobile native share API supports sharing the PDF file directly
      if (pdfBlob && navigator.canShare) {
        const fileName = `Invoice-${form.invoiceNumber || 'draft'}.pdf`;
        const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

        if (navigator.canShare({ files: [pdfFile] })) {
          toast.dismiss(toastId);
          await navigator.share({
            title: `Invoice ${form.invoiceNumber || ''}`,
            text: greetingMsg,
            files: [pdfFile],
          });
          toast.success('Bill shared successfully!');
          return;
        }
      }

      // If PDF file sharing is not supported by the browser, auto-download PDF and launch WhatsApp
      if (pdfBlob) {
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice-${form.invoiceNumber || 'draft'}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }

      toast.dismiss(toastId);
      const waUrl = getWhatsAppShareUrl(form.customerPhone, greetingMsg);
      window.open(waUrl, '_blank');
      toast.success('Bill saved! PDF downloaded — attach it in WhatsApp');
    } catch (err) {
      console.error('Send bill error:', err);
      toast.dismiss(toastId);
      toast.error('Failed to send bill');
    }
  };

  // Minimal Top-Bar Variant
  if (variant === 'top-bar') {
    return (
      <div className="flex items-center gap-1.5 no-print">
        <Button
          id="top-invoice-pdf-btn"
          variant="outline"
          size="sm"
          onClick={handleDownloadPdf}
          disabled={saving}
          className="hidden sm:inline-flex h-8 px-2.5 text-xs"
          title="Download PDF"
        >
          <Download size={13} className="mr-1" />
          PDF
        </Button>

        <Button
          id="top-invoice-print-btn"
          variant="outline"
          size="sm"
          onClick={handlePrint}
          disabled={saving}
          className="hidden sm:inline-flex h-8 px-2.5 text-xs"
          title="Print Invoice"
        >
          <Printer size={13} className="mr-1" />
          Print
        </Button>

        <Button
          id="top-invoice-whatsapp-btn"
          size="sm"
          onClick={handleSendBill}
          disabled={saving}
          className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs font-bold"
          title="Send PDF & WhatsApp Bill"
        >
          <Send size={13} className="sm:mr-1" />
          <span className="hidden sm:inline">Send Bill</span>
        </Button>
      </div>
    );
  }

  // Sticky POS Checkout Bar (Default / Mobile-first Power Bar)
  const totalItemCount = form.items.reduce((acc, i) => acc + (i.quantity || 1), 0);
  const paymentLabel = form.paymentMethod === 'upi' ? 'UPI' : form.paymentMethod === 'credit' ? 'Credit' : 'Cash';

  return (
    <div className="w-full bg-[var(--color-surface)] border-t border-[var(--color-border)] shadow-lg p-2.5 sm:p-4 flex items-center justify-between gap-2 sm:gap-3 no-print z-40">
      {/* Live Total & Payment Mode Badge */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-wider text-[var(--color-text-muted)]">
              Total ({totalItemCount} {totalItemCount === 1 ? 'item' : 'items'})
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
              form.paymentMethod === 'upi'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                : form.paymentMethod === 'credit'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
            }`}>
              {paymentLabel}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[var(--color-primary)] tracking-tight">
            {formatINR(calculations.grandTotal)}
          </div>
        </div>
      </div>

      {/* Main Checkout Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* Send Bill: WhatsApp + PDF Combo with Native File Sharing */}
        <button
          type="button"
          id="invoice-share-pdf-whatsapp-btn"
          onClick={handleSendBill}
          disabled={saving}
          className="flex items-center gap-1.5 h-11 px-3 sm:px-4 text-xs sm:text-sm font-extrabold rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white transition-all shadow-md cursor-pointer"
          title="Send PDF & Greeting via WhatsApp"
        >
          <Send size={15} />
          <span>Send Bill</span>
        </button>

        {/* Save / Finalize button */}
        <Button
          id="invoice-save-btn"
          onClick={() => handleSave()}
          disabled={saving}
          className="h-11 px-3 sm:px-5 text-xs sm:text-sm font-extrabold rounded-xl shadow-md bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white active:scale-98 transition-all cursor-pointer flex items-center gap-1.5"
        >
          {saving ? (
            <><Loader2 size={15} className="animate-spin" /> Saving</>
          ) : saved ? (
            <><CheckCircle size={15} /> Saved!</>
          ) : (
            <><Sparkles size={15} /> {editingInvoiceId ? 'Update' : 'Save Bill'}</>
          )}
        </Button>

        {/* More Actions Dropdown Menu (PDF, Print) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="h-11 w-10 flex items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-all"
            title="More Options"
          >
            <MoreVertical size={18} />
          </button>

          {showMoreMenu && (
            <div
              className="absolute right-0 bottom-full mb-2 w-48 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl py-1.5 z-50 text-xs font-medium"
              onClick={() => setShowMoreMenu(false)}
            >
              <button
                onClick={handleDownloadPdf}
                className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)]"
              >
                <Download size={14} />
                <span>Download PDF</span>
              </button>
              <button
                onClick={handlePrint}
                className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)]"
              >
                <Printer size={14} />
                <span>Print Bill</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
