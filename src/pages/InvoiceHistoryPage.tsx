import React, { useEffect, useState } from 'react';
import { Search, Eye, Trash2, Copy, FileText, Calendar, ChevronDown, Filter, CheckCircle2 } from 'lucide-react';
import { Input, Button, Badge, Card } from '@/components/ui';
import { invoiceRepository } from '@/lib/db/repositories/invoiceRepository';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { useInvoiceStore } from '@/stores/useInvoiceStore';
import { generateInvoiceNumber } from '@/lib/utils/invoiceNumber';
import { formatINR } from '@/lib/utils/currency';
import { useNavigate } from 'react-router-dom';
import type { Invoice } from '@/types';
import { useAppSettingsStore } from '@/stores/useAppSettingsStore';
import { formatDate } from '@/lib/utils/dateFormat';

export function InvoiceHistoryPage() {
  const navigate = useNavigate();
  const { businesses } = useBusinessStore();
  const { loadInvoice } = useInvoiceStore();
  const { dateFormat } = useAppSettingsStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [query, setQuery] = useState('');
  const [filterBusiness, setFilterBusiness] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');

  const load = () => {
    const results = invoiceRepository.search(query, filterBusiness || undefined, filterStart || undefined, filterEnd || undefined);
    setInvoices(results);
  };

  useEffect(() => { load(); }, [query, filterBusiness, filterStart, filterEnd]);

  const handleView = (inv: Invoice) => {
    const full = invoiceRepository.getById(inv.id);
    if (!full) return;
    const hasIsbnData = (full.items ?? []).some(i => i.isbn && i.isbn.trim() !== '');
    const hasSlNoData = (full.items ?? []).some(i => i.slNo && i.slNo.trim() !== '');
    loadInvoice({
      businessId: full.businessId,
      invoiceNumber: full.invoiceNumber,
      invoiceDate: full.invoiceDate,
      dueDate: full.dueDate ?? '',
      customerName: full.customerName,
      customerPhone: full.customerPhone ?? '',
      customerEmail: full.customerEmail ?? '',
      customerAddress: full.customerAddress ?? '',
      customerGstin: full.customerGstin ?? '',
      customerNotes: full.customerNotes ?? '',
      items: (full.items ?? []).map(i => ({ id: i.id, srNo: i.srNo, slNo: i.slNo ?? '', productName: i.productName, author: i.author ?? '', isbn: i.isbn ?? '', quantity: i.quantity, unitPrice: i.unitPrice, lineTotal: i.lineTotal })),
      discountType: full.discountType,
      discountValue: full.discountValue,
      invoiceLanguage: full.invoiceLanguage,
      templateId: full.templateId ?? 'minimal-modern',
      themeOverrides: full.themeOverrides ?? {},
      status: full.status,
      showIsbn: hasIsbnData || full.templateId === 'publication-focus',
      showSlNo: hasSlNoData,
      showAuthor: (full.items ?? []).some(i => i.author && i.author.trim() !== ''),
    }, full.id);
    navigate('/invoice/new');
  };


  const handleDuplicate = (inv: Invoice) => {
    const biz = businesses.find(b => b.id === inv.businessId);
    if (!biz) return;
    const nextNum = invoiceRepository.getNextSequenceNumber(biz.id);
    const newNumber = generateInvoiceNumber(biz, nextNum);
    invoiceRepository.duplicate(inv.id, newNumber);
    load();
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this invoice permanently?')) return;
    invoiceRepository.delete(id);
    load();
  };

  const handleTogglePaid = (inv: Invoice) => {
    invoiceRepository.togglePaidStatus(inv.id, !inv.isPaid);
    load();
  };

  return (
    <div className="h-full flex flex-col overflow-hidden animate-fade-in">
      {/* Filters */}
      <div className="flex-shrink-0 p-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              id="history-search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by invoice number or customer..."
              className="h-9 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] pl-9 pr-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            />
          </div>
          <select
            id="history-filter-business"
            value={filterBusiness}
            onChange={e => setFilterBusiness(e.target.value)}
            className="h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          >
            <option value="">All Businesses</option>
            {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-text-muted)]">From:</span>
            <input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} className="h-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-2 text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-text-muted)]">To:</span>
            <input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} className="h-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-2 text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
          </div>
          {(query || filterBusiness || filterStart || filterEnd) && (
            <button onClick={() => { setQuery(''); setFilterBusiness(''); setFilterStart(''); setFilterEnd(''); }} className="text-xs text-red-500 hover:underline">Clear filters</button>
          )}
          <div className="ml-auto text-xs text-[var(--color-text-muted)]">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Invoice List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {invoices.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={48} className="mx-auto mb-4 text-[var(--color-text-muted)]" strokeWidth={1} />
            <div className="text-sm text-[var(--color-text-muted)]">No invoices found</div>
          </div>
        ) : (
          invoices.map(inv => {
            const biz = businesses.find(b => b.id === inv.businessId);
            return (
              <div key={inv.id} className="group flex items-center gap-4 px-4 py-3.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl hover:border-[var(--color-primary-300)] hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: biz?.accentColor ? `${biz.accentColor}20` : 'var(--color-primary-50)' }}>
                  <FileText size={18} style={{ color: biz?.accentColor ?? 'var(--color-primary)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{inv.customerName}</span>
                    <Badge>{inv.invoiceNumber}</Badge>
                    {biz && <Badge variant="default" className="text-xs">{biz.name}</Badge>}
                    {inv.isPaid ? (
                      <Badge variant="success">Paid</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[var(--color-text-muted)]">Unpaid</Badge>
                    )}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] mt-0.5 flex items-center gap-2">
                    <Calendar size={10} />{formatDate(inv.invoiceDate, dateFormat)}
                  </div>
                </div>
                <div className="text-base font-bold text-[var(--color-text-primary)] shrink-0">{formatINR(inv.grandTotal)}</div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleTogglePaid(inv)} className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${inv.isPaid ? 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 shadow-sm' : 'text-[var(--color-text-muted)] hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950'}`} title={inv.isPaid ? 'Mark as Unpaid' : 'Mark as Paid'}><CheckCircle2 size={14} /></button>
                  <button onClick={() => handleView(inv)} className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-50)] transition-all" title="View/Edit"><Eye size={14} /></button>
                  <button onClick={() => handleDuplicate(inv)} className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-all" title="Duplicate"><Copy size={14} /></button>
                  <button onClick={() => handleDelete(inv.id)} className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-all" title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
