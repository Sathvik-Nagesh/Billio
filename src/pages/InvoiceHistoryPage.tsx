import React, { useEffect, useState } from 'react';
import { Search, Eye, Trash2, Copy, FileText, Calendar, CheckCircle2 } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { invoiceRepository } from '@/lib/db/repositories/invoiceRepository';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { useInvoiceStore } from '@/stores/useInvoiceStore';
import { generateInvoiceNumber } from '@/lib/utils/invoiceNumber';
import { formatINR } from '@/lib/utils/currency';
import { useNavigate } from 'react-router-dom';
import type { Invoice } from '@/types';
import { useAppSettingsStore } from '@/stores/useAppSettingsStore';
import { formatDate } from '@/lib/utils/dateFormat';
import { toast } from 'sonner';

export function InvoiceHistoryPage() {
  const navigate = useNavigate();
  const { businesses } = useBusinessStore();
  const { loadInvoice } = useInvoiceStore();
  const { dateFormat } = useAppSettingsStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filterBusiness, setFilterBusiness] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [displayLimit, setDisplayLimit] = useState(50);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setDisplayLimit(50);
    }, 150);
    return () => clearTimeout(timer);
  }, [query]);

  const load = () => {
    let results = invoiceRepository.search(debouncedQuery, filterBusiness || undefined, filterStart || undefined, filterEnd || undefined);
    if (filterMethod) {
      results = results.filter(i => (i.paymentMethod || 'cash') === filterMethod);
    }
    setInvoices(results);
  };

  useEffect(() => { load(); }, [debouncedQuery, filterBusiness, filterMethod, filterStart, filterEnd]);

  // O(1) business lookup map
  const businessMap = React.useMemo(() => {
    return new Map(businesses.map(b => [b.id, b]));
  }, [businesses]);

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
      paymentMethod: full.paymentMethod ?? 'cash',
      paymentStatus: full.paymentStatus ?? (full.isPaid ? 'paid' : 'pending'),
      receivedAmount: full.receivedAmount ?? 0,
      changeAmount: full.changeAmount ?? 0,
      showIsbn: hasIsbnData || full.templateId === 'publication-focus',
      showSlNo: hasSlNoData,
      showAuthor: (full.items ?? []).some(i => i.author && i.author.trim() !== ''),
    }, full.id);
    navigate('/invoice/new');
  };


  const handleDuplicate = (inv: Invoice) => {
    const biz = businesses.find(b => b.id === inv.businessId);
    if (!biz) {
      toast.error('Cannot duplicate: The associated business profile was deleted');
      return;
    }
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
      <div className="flex-shrink-0 p-3 sm:p-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] space-y-2.5 sm:space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              id="history-search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search invoice number or customer..."
              className="h-9 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] pl-9 pr-3 text-xs sm:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3">
            <select
              id="history-filter-business"
              value={filterBusiness}
              onChange={e => setFilterBusiness(e.target.value)}
              className="h-9 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-2.5 text-xs sm:text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer truncate"
            >
              <option value="">All Businesses</option>
              {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select
              id="history-filter-method"
              value={filterMethod}
              onChange={e => setFilterMethod(e.target.value)}
              className="h-9 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-2.5 text-xs sm:text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer truncate"
            >
              <option value="">All Modes</option>
              <option value="cash">💵 Cash</option>
              <option value="upi">📱 UPI</option>
              <option value="credit">⏳ Credit</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-[var(--color-text-muted)] font-medium">From:</span>
              <input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} className="h-7 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-1.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-[var(--color-text-muted)] font-medium">To:</span>
              <input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} className="h-7 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-1.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]" />
            </div>
            {(query || filterBusiness || filterMethod || filterStart || filterEnd) && (
              <button onClick={() => { setQuery(''); setFilterBusiness(''); setFilterMethod(''); setFilterStart(''); setFilterEnd(''); }} className="text-xs text-red-500 hover:underline font-medium ml-1">Clear</button>
            )}
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)] font-medium">{invoices.length} bill{invoices.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Invoice List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 pb-24">
        {invoices.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={48} className="mx-auto mb-4 text-[var(--color-text-muted)]" strokeWidth={1} />
            <div className="text-sm text-[var(--color-text-muted)]">No invoices found</div>
          </div>
        ) : (
          <>
            {invoices.slice(0, displayLimit).map(inv => {
              const biz = businessMap.get(inv.businessId);
              const method = inv.paymentMethod || 'cash';
              return (
                <div key={inv.id} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 p-3 sm:p-3.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl hover:border-[var(--color-primary-300)] hover:shadow-xs transition-all">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: biz?.accentColor ? `${biz.accentColor}20` : 'var(--color-primary-50)' }}>
                      <FileText size={17} style={{ color: biz?.accentColor ?? 'var(--color-primary)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-semibold text-[var(--color-text-primary)] truncate max-w-[130px] sm:max-w-none">{inv.customerName}</span>
                        <Badge className="text-[10px] sm:text-xs shrink-0">{inv.invoiceNumber}</Badge>
                        {biz && <Badge variant="default" className="text-[10px] sm:text-xs truncate max-w-[100px]">{biz.name}</Badge>}
                        <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                          method === 'cash'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : method === 'upi'
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                        }`}>
                          {method}
                        </span>
                        {inv.isPaid ? (
                          <Badge variant="success" className="text-[10px] sm:text-xs shrink-0">Paid</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] sm:text-xs text-[var(--color-text-muted)] shrink-0">Due</Badge>
                        )}
                      </div>
                      <div className="text-[11px] sm:text-xs text-[var(--color-text-muted)] mt-1 flex items-center gap-2">
                        <Calendar size={10} />{formatDate(inv.invoiceDate, dateFormat)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--color-border-light)] shrink-0">
                    <div className="text-sm sm:text-base font-bold text-[var(--color-text-primary)]">{formatINR(inv.grandTotal)}</div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleTogglePaid(inv)} className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${inv.isPaid ? 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 shadow-xs' : 'text-[var(--color-text-muted)] hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950'}`} title={inv.isPaid ? 'Mark as Unpaid' : 'Mark as Paid'}><CheckCircle2 size={14} /></button>
                      <button onClick={() => handleView(inv)} className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-50)] transition-all cursor-pointer" title="View/Edit"><Eye size={14} /></button>
                      <button onClick={() => handleDuplicate(inv)} className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-all cursor-pointer" title="Duplicate"><Copy size={14} /></button>
                      <button onClick={() => handleDelete(inv.id)} className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-all cursor-pointer" title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
            {invoices.length > displayLimit && (
              <div className="text-center pt-2 pb-4">
                <Button variant="secondary" onClick={() => setDisplayLimit(prev => prev + 50)}>
                  Load more invoices ({invoices.length - displayLimit} remaining)
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
