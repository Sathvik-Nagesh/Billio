import React, { useRef, useState } from 'react';
import { Download, Printer, Share2, CheckCircle, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui';
import { useInvoiceStore } from '@/stores/useInvoiceStore';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { TEMPLATE_REGISTRY } from '@/templates';
import { invoiceRepository } from '@/lib/db/repositories/invoiceRepository';
import { customerRepository } from '@/lib/db/repositories/customerRepository';
import { bookRepository } from '@/lib/db/repositories/bookRepository';
import { generateInvoiceNumber } from '@/lib/utils/invoiceNumber';
import type { InvoiceItem } from '@/types';
import { toast } from 'sonner';

interface InvoiceActionsProps {
  onSaved?: (id: string) => void;
}

export function InvoiceActions({ onSaved }: InvoiceActionsProps) {
  const { form, calculations, editingInvoiceId, resetForm } = useInvoiceStore();
  const { businesses } = useBusinessStore();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  // Track the off-screen clone element to clean up properly
  const cloneRef = useRef<HTMLElement | null>(null);

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
    if (!business) {
      toast.error('Selected business no longer exists. Please select another business.');
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

      // Auto-save books
      for (const item of items) {
        if (item.productName && item.productName.trim()) {
          bookRepository.upsert(item.productName.trim(), item.unitPrice, item.author?.trim() || undefined);
        }
      }

      let savedId = '';
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

  /**
   * Get the invoice print area element and capture its current computed styles.
   * Returns null if not found.
   */
  const getInvoiceElement = (): HTMLElement | null => {
    return document.getElementById('invoice-pdf-layout');
  };

  // PDF/Print utilities removed in favor of live-DOM capture

  const handlePrint = async () => {
    await handleSave();

    const invoiceEl = getInvoiceElement();
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

    // Wait for fonts to load before printing to avoid blank/wrong-font output
    printWin.onload = () => {
      printWin.focus();
      // Use document.fonts.ready if available
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
    await handleSave();

    const invoiceEl = getInvoiceElement();
    if (!invoiceEl) {
      toast.error('Invoice preview not found. Please wait for it to load.');
      return;
    }

    const toastId = toast.loading('Generating PDF…');
    let parentTransform = '';
    let parentEl: HTMLElement | null = null;
    
    try {
      // 1. Debug Logs & Validation
      console.log('--- PDF Debug Init ---');
      console.log('Invoice Element Exists:', !!invoiceEl);
      
      const expectedPages = invoiceEl.children.length;
      console.log('Expected Page Count (DOM children):', expectedPages);
      
      let totalHeight = 0;
      for (let i = 0; i < invoiceEl.children.length; i++) {
        const child = invoiceEl.children[i] as HTMLElement;
        const h = child.getBoundingClientRect().height;
        totalHeight += h;
        console.log(`Page ${i + 1} Height:`, h);
      }
      console.log('Total Document Height:', totalHeight);
      
      // Temporarily remove CSS scale from the parent container is NO LONGER NEEDED 
      // because invoice-pdf-layout is rendered without scales!

      // Wait for fonts to be available
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      // @ts-ignore — html2pdf.js loaded as ESM
      const html2pdf = (await import('html2pdf.js')).default;

      const opt = {
        margin: 0,
        filename: `Invoice-${form.invoiceNumber || 'draft'}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          logging: true, // Enabled for debugging
          scrollX: 0,    // Force no scroll offset clipping
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

      console.log('Starting html2pdf generation...');
      
      const worker = html2pdf().set(opt).from(invoiceEl);
      
      // Get the PDF object to log pages and validate
      await worker.toPdf().get('pdf').then((pdf: any) => {
         const actualPages = pdf.internal.getNumberOfPages();
         console.log('Actual PDF Generated Page Count:', actualPages);
         
         if (actualPages > expectedPages) {
           console.warn(`WARNING: Generated PDF has ${actualPages} pages, but expected ${expectedPages}. Blank page protection triggered. Automatically trimming trailing blank page.`);
           
           // Automatically remove trailing blank pages
           let pagesToRemove = actualPages - expectedPages;
           for (let i = 0; i < pagesToRemove; i++) {
             pdf.deletePage(actualPages - i);
           }
         } else if (actualPages < expectedPages) {
           throw new Error(`PDF generation failed: Expected ${expectedPages} pages but got ${actualPages}`);
         }
      });
      
      // Generate Blob
      const pdfBlob = await worker.output('blob');
      
      console.log('PDF Blob Size:', pdfBlob.size, 'bytes');
      
      // Save manually so we can log the size
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = opt.filename;
      a.click();
      URL.revokeObjectURL(url);

      toast.dismiss(toastId);
      toast.success('PDF downloaded!');
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.dismiss(toastId);
      toast.error('PDF generation failed. Check console for details.');
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
