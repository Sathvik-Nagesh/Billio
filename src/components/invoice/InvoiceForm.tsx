import React, { useEffect, useState } from 'react';
import {
  Plus,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  UserCheck,
  BookOpen,
  RotateCcw,
  Zap,
  Sparkles,
  DollarSign,
  QrCode,
  Clock,
  Receipt,
  Calculator
} from 'lucide-react';
import { Button, Input, Textarea, Label, Select, Card, CardHeader, CardTitle, CardContent, FormField, Separator } from '@/components/ui';
import { useInvoiceStore } from '@/stores/useInvoiceStore';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { CustomerAutocomplete } from './CustomerAutocomplete';
import { LineItemRow } from './LineItemRow';
import { QuickCatalogModal } from './QuickCatalogModal';
import { DailyFairTallyModal } from './DailyFairTallyModal';
import { formatINR, formatNumber } from '@/lib/utils/currency';
import type { Customer, Book } from '@/types';
import { toast } from 'sonner';

const TEMPLATES = [
  { id: 'minimal-modern', name: 'Minimal Modern' },
  { id: 'premium-corporate', name: 'Premium Corporate' },
  { id: 'traditional-indian', name: 'Traditional Indian' },
  { id: 'publication-focus', name: 'Publication Focus' },
  { id: 'elegant-serif', name: 'Elegant Serif' },
  { id: 'basic-clean', name: 'Basic Clean' },
];

const FONTS = [
  { value: 'Inter',        label: '✦ Inter (Modern Sans)' },
  { value: 'Roboto',       label: '✦ Roboto (Clean)' },
  { value: 'Open Sans',    label: '✦ Open Sans (Friendly)' },
  { value: 'Source Sans 3',label: '✦ Source Sans 3 (Professional)' },
  { value: 'Noto Sans',    label: '✦ Noto Sans (Universal)' },
  { value: 'Lato',         label: '✦ Lato (Elegant)' },
  { value: 'Poppins',      label: '✦ Poppins (Bold & Modern)' },
  { value: 'Montserrat',   label: '✦ Montserrat (Premium)' },
  { value: 'Nunito Sans',  label: '✦ Nunito Sans (Rounded)' },
  { value: 'Work Sans',    label: '✦ Work Sans (Technical)' },
  { value: 'Outfit',       label: '✦ Outfit (Display)' },
  { value: 'Merriweather',      label: '☞ Merriweather (Traditional)' },
  { value: 'Libre Baskerville', label: '☞ Libre Baskerville (Classic)' },
  { value: 'Playfair Display',  label: '☞ Playfair Display (Elegant)' },
];

const FONT_WEIGHTS = [
  { value: 'light',     label: 'Light (300)' },
  { value: 'regular',   label: 'Regular (400)' },
  { value: 'medium',    label: 'Medium (500)' },
  { value: 'semibold',  label: 'Semi Bold (600)' },
  { value: 'bold',      label: 'Bold (700) — Print Recommended' },
  { value: 'extrabold', label: 'Extra Bold (800)' },
];

const FONT_SIZES = [
  { value: '80',  label: '80% — Compact' },
  { value: '90',  label: '90% — Small' },
  { value: '100', label: '100% — Normal' },
  { value: '110', label: '110% — Large' },
  { value: '120', label: '120% — Extra Large' },
  { value: '130', label: '130% — Maximum' },
];

const ACCENT_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444',
  '#F97316', '#EAB308', '#22C55E', '#14B8A6',
  '#3B82F6', '#0EA5E9', '#1E293B', '#475569',
];

const QUICK_DISCOUNTS = [0, 10, 15, 20, 25, 30, 35, 40, 50];
const CASH_DENOMINATIONS = [100, 200, 500, 1000, 2000];

export function InvoiceForm() {
  const {
    form,
    calculations,
    updateField,
    updateTheme,
    setPaymentDetails,
    addItem,
    addBookItem,
    addMultipleBooks,
    removeItem,
    updateItem,
    toggleShowIsbn,
    toggleShowSlNo,
    toggleShowAuthor,
    setBulkQuantity,
    setQuickDiscount,
    resetForm,
  } = useInvoiceStore();

  const { businesses, activeBusiness, setActiveBusiness } = useBusinessStore();
  const [bulkQty, setBulkQty] = useState('');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isTallyModalOpen, setIsTallyModalOpen] = useState(false);

  // Sync active business only when form has no business selected yet
  useEffect(() => {
    if (activeBusiness && !form.businessId) {
      updateField('businessId', activeBusiness.id);
    }
  }, [activeBusiness]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        handleSetWalkIn();
      } else if (e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCatalogModalOpen(prev => !prev);
      } else if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setIsTallyModalOpen(prev => !prev);
      } else if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        addItem();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSetWalkIn = () => {
    updateField('customerName', 'Walk-in Customer');
    updateField('customerPhone', '');
    updateField('customerAddress', '');
    updateField('customerGstin', '');
    toast.success('Set to Walk-in Customer (Alt+W)');
  };

  const handleResetForm = () => {
    if (form.items.some(i => i.productName) || form.customerName) {
      if (confirm('Are you sure you want to reset this invoice?')) {
        resetForm();
        toast.info('Form cleared');
      }
    } else {
      resetForm();
    }
  };

  const handleCustomerSelect = (c: Customer) => {
    updateField('customerName', c.name);
    updateField('customerPhone', c.phone ?? '');
    updateField('customerEmail', c.email ?? '');
    updateField('customerAddress', c.address ?? '');
    updateField('customerGstin', c.gstin ?? '');
    updateField('customerNotes', c.notes ?? '');
  };

  const handlePhoneChange = (val: string, field: 'customerPhone') => {
    if (val === '') {
      updateField(field, '');
      return;
    }
    if (!val.startsWith('+')) {
      updateField(field, '+91 ' + val);
    } else {
      updateField(field, val);
    }
  };

  const handleReceivedCashChange = (val: string) => {
    const num = parseFloat(val);
    const amount = isNaN(num) ? 0 : Math.max(0, num);
    updateField('receivedAmount', amount);
  };

  const handleSetExactCash = () => {
    updateField('receivedAmount', calculations.grandTotal);
  };

  const paymentMethod = form.paymentMethod || 'cash';
  const receivedAmount = form.receivedAmount || 0;
  const isCash = paymentMethod === 'cash';
  const changeToReturn = form.changeAmount || 0;
  const isShort = isCash && receivedAmount > 0 && receivedAmount < calculations.grandTotal;

  return (
    <div className="h-full overflow-y-auto px-4 py-4 space-y-4">
      {/* Fast Action Shortcuts Ribbon */}
      <div className="flex items-center justify-between gap-2 p-2 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-xl flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleSetWalkIn}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all shadow-xs"
            title="Shortcut: Alt+W"
          >
            <UserCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>Walk-in Customer</span>
            <span className="text-[10px] text-[var(--color-text-muted)] font-mono">Alt+W</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCatalogModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 transition-all shadow-xs"
            title="Shortcut: Alt+K"
          >
            <BookOpen size={14} />
            <span>Quick Catalog</span>
            <span className="text-[10px] opacity-80 font-mono">Alt+K</span>
          </button>

          <button
            type="button"
            onClick={() => setIsTallyModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shadow-xs"
            title="Shortcut: Alt+T"
          >
            <Receipt size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>Daily Fair Tally</span>
            <span className="text-[10px] text-[var(--color-text-muted)] font-mono">Alt+T</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleResetForm}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
          title="Clear form and start new invoice"
        >
          <RotateCcw size={13} />
          <span>New Bill</span>
        </button>
      </div>

      {/* Section: Customer Details (Primary Front & Center) */}
      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle>Customer Details</CardTitle>
          {form.customerName && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
              ✓ Ready
            </span>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Customer Name" className="col-span-2">
              <div className="flex gap-2">
                <div className="flex-1">
                  <CustomerAutocomplete
                    id="form-customer-name"
                    value={form.customerName}
                    onChange={(v) => updateField('customerName', v)}
                    onSelect={handleCustomerSelect}
                    placeholder="Customer / Organization Name"
                  />
                </div>
                {!form.customerName && (
                  <button
                    type="button"
                    onClick={handleSetWalkIn}
                    className="px-2.5 text-xs font-medium text-[var(--color-primary)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface-secondary)] transition-colors whitespace-nowrap"
                  >
                    + Walk-in
                  </button>
                )}
              </div>
            </FormField>
            <FormField label="Phone (for WhatsApp)">
              <Input
                id="form-customer-phone"
                value={form.customerPhone}
                onChange={(e) => handlePhoneChange(e.target.value, 'customerPhone')}
                placeholder="+91 XXXXX XXXXX"
              />
            </FormField>
            <FormField label="Email (optional)">
              <Input
                id="form-customer-email"
                type="email"
                value={form.customerEmail}
                onChange={(e) => updateField('customerEmail', e.target.value)}
                placeholder="email@example.com"
              />
            </FormField>
            <FormField label="Address (optional)" className="col-span-2">
              <Input
                id="form-customer-address"
                value={form.customerAddress}
                onChange={(e) => updateField('customerAddress', e.target.value)}
                placeholder="City, State or Full Address"
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Section: Items Table */}
      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <CardTitle>Items ({form.items.length})</CardTitle>
            <button
              type="button"
              onClick={() => setIsCatalogModalOpen(true)}
              className="flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)] px-2 py-0.5 rounded-md hover:opacity-80 transition-opacity"
            >
              <Sparkles size={12} />
              <span>Catalog Picker</span>
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1 bg-[var(--color-surface-secondary)] p-1 rounded-md border border-[var(--color-border)]">
              <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] px-1">Bulk Qty:</span>
              <input 
                type="number" 
                value={bulkQty} 
                onChange={(e) => setBulkQty(e.target.value)} 
                className="w-10 h-6 text-xs text-center border border-[var(--color-border)] bg-[var(--color-surface)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                placeholder="0"
                min="1"
              />
              <button 
                type="button" 
                onClick={() => { const q = parseInt(bulkQty); if (!isNaN(q) && q > 0) setBulkQuantity(q); }} 
                className="h-6 px-2 text-xs font-medium bg-[var(--color-primary)] text-white rounded hover:opacity-90"
              >
                Set
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="form-show-author"
                className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] cursor-pointer select-none"
              >
                <input
                  id="form-show-author"
                  type="checkbox"
                  checked={form.showAuthor}
                  onChange={toggleShowAuthor}
                  className="w-3.5 h-3.5 accent-[var(--color-primary)] cursor-pointer"
                />
                Author
              </label>
              <label
                htmlFor="form-show-isbn"
                className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] cursor-pointer select-none"
              >
                <input
                  id="form-show-isbn"
                  type="checkbox"
                  checked={form.showIsbn}
                  onChange={toggleShowIsbn}
                  className="w-3.5 h-3.5 accent-[var(--color-primary)] cursor-pointer"
                />
                ISBN
              </label>
              <label
                htmlFor="form-show-slno"
                className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] cursor-pointer select-none"
              >
                <input
                  id="form-show-slno"
                  type="checkbox"
                  checked={form.showSlNo}
                  onChange={toggleShowSlNo}
                  className="w-3.5 h-3.5 accent-[var(--color-primary)] cursor-pointer"
                />
                Sel. No.
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2">
          <div className="table-responsive-container overflow-x-auto pb-1">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="py-2 px-1 text-center text-xs font-semibold text-[var(--color-text-muted)] w-7">#</th>
                  {form.showSlNo && <th className="py-2 px-1 text-left text-xs font-semibold text-[var(--color-text-muted)] w-20">Sel. No.</th>}
                  <th className="py-2 px-1 text-left text-xs font-semibold text-[var(--color-text-muted)]">Book / Product Name</th>
                  {form.showAuthor && <th className="py-2 px-1 text-left text-xs font-semibold text-[var(--color-text-muted)] w-32">Author</th>}
                  {form.showIsbn && <th className="py-2 px-1 text-left text-xs font-semibold text-[var(--color-text-muted)] w-24">ISBN</th>}
                  <th className="py-2 px-1 text-right text-xs font-semibold text-[var(--color-text-muted)] w-24">Price (₹)</th>
                  <th className="py-2 px-1 text-center text-xs font-semibold text-[var(--color-text-muted)] w-28">Qty</th>
                  <th className="py-2 px-1 text-right text-xs font-semibold text-[var(--color-text-muted)] w-20">Total</th>
                  <th className="w-7"></th>
                </tr>
              </thead>
              <tbody>
                {form.items.map((item, idx) => (
                  <LineItemRow
                    key={item.id}
                    item={item}
                    onUpdate={(k, v) => updateItem(item.id, k, v)}
                    onRemove={() => removeItem(item.id)}
                    showIsbn={form.showIsbn}
                    showSlNo={form.showSlNo}
                    showAuthor={form.showAuthor}
                    isLast={idx === form.items.length - 1}
                    onEnterAtEnd={addItem}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              id="add-line-item-btn"
              onClick={addItem}
              className="flex-1 flex items-center justify-center gap-2 h-9 text-xs font-bold text-[var(--color-primary)] border border-dashed border-[var(--color-primary-300)] rounded-xl hover:bg-[var(--color-primary-50)] dark:hover:bg-[var(--color-primary-900)]/30 transition-colors shadow-2xs"
            >
              <Plus size={14} />
              Add Row (Enter / Alt+N)
            </button>
            <button
              type="button"
              onClick={() => setIsCatalogModalOpen(true)}
              className="flex items-center gap-1.5 px-4 h-9 text-xs font-semibold text-[var(--color-text-secondary)] border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-surface-secondary)] transition-colors whitespace-nowrap"
            >
              <BookOpen size={14} />
              Open Catalog
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Section: Totals & Quick Discounts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Discount & Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Quick Discount Presets */}
            <div>
              <div className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 flex items-center gap-1">
                <Zap size={12} className="text-amber-500" />
                <span>Quick Trade Discount:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_DISCOUNTS.map(pct => {
                  const isSelected = form.discountType === 'percentage' && form.discountValue === pct;
                  return (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setQuickDiscount(pct)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                        isSelected
                          ? 'bg-[var(--color-primary)] text-white shadow-xs scale-105'
                          : 'bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
                      }`}
                    >
                      {pct === 0 ? 'No Disc' : `${pct}%`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Discount Field */}
            <div className="flex gap-2 pt-1">
              <FormField label="Discount Type" className="w-36 flex-shrink-0">
                <select
                  id="form-discount-type"
                  value={form.discountType}
                  onChange={(e) => updateField('discountType', e.target.value as 'percentage' | 'flat')}
                  className="h-9 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                >
                  <option value="percentage">Percentage %</option>
                  <option value="flat">Flat ₹</option>
                </select>
              </FormField>
              <FormField label={form.discountType === 'percentage' ? 'Custom %' : 'Discount (₹)'} className="flex-1">
                <Input
                  id="form-discount-value"
                  type="number"
                  min="0"
                  max={form.discountType === 'percentage' ? 100 : undefined}
                  step={form.discountType === 'percentage' ? 1 : 0.01}
                  value={form.discountValue || ''}
                  onChange={(e) => updateField('discountValue', parseFloat(e.target.value) || 0)}
                  placeholder={form.discountType === 'percentage' ? 'e.g. 33' : 'e.g. 500'}
                />
              </FormField>
            </div>

            <Separator />

            {/* Bill Summary */}
            <div className="space-y-2 text-sm bg-[var(--color-surface-secondary)]/50 p-3 rounded-xl border border-[var(--color-border-light)]">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">Subtotal ({form.items.reduce((acc, i) => acc + (i.quantity || 1), 0)} items)</span>
                <span className="font-semibold">₹{formatNumber(calculations.subtotal)}</span>
              </div>
              {calculations.discountAmount > 0 && (
                <div className="flex justify-between text-red-600 dark:text-red-400 font-medium">
                  <span>Discount ({form.discountType === 'percentage' ? `${form.discountValue}%` : 'flat'})</span>
                  <span>-₹{formatNumber(calculations.discountAmount)}</span>
                </div>
              )}
              {calculations.roundOff !== 0 && (
                <div className="flex justify-between text-[var(--color-text-muted)] text-xs">
                  <span>Round Off</span>
                  <span>{calculations.roundOff > 0 ? '+' : ''}₹{formatNumber(Math.abs(calculations.roundOff))}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-[var(--color-border)] text-base font-extrabold text-[var(--color-text-primary)]">
                <span>Grand Total</span>
                <span className="text-[var(--color-primary)] text-lg">{formatINR(calculations.grandTotal)}</span>
              </div>
              <div className="text-xs text-[var(--color-text-muted)] italic font-serif">
                {calculations.amountInWords}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section: POS Payment Mode & Cash Change Calculator */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Payment & Speed Tally</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Payment Mode Selector Tabs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentDetails('cash')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer ${
                  paymentMethod === 'cash'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]'
                }`}
              >
                <DollarSign size={20} className="mb-1 text-emerald-600 font-bold" strokeWidth={2.5} />
                <span className="text-xs font-bold text-[var(--color-text-primary)]">Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentDetails('upi')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer ${
                  paymentMethod === 'upi'
                    ? 'border-blue-600 bg-blue-50 text-blue-950 font-bold shadow-xs'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]'
                }`}
              >
                <QrCode size={20} className="mb-1 text-blue-600 font-bold" strokeWidth={2.5} />
                <span className="text-xs font-bold text-[var(--color-text-primary)]">UPI / GPay</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentDetails('credit')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer ${
                  paymentMethod === 'credit'
                    ? 'border-amber-600 bg-amber-50 text-amber-950 font-bold shadow-xs'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]'
                }`}
              >
                <Clock size={20} className="mb-1 text-amber-600 font-bold" strokeWidth={2.5} />
                <span className="text-xs font-bold text-[var(--color-text-primary)]">Credit / Due</span>
              </button>
            </div>

            {/* Cash Calculator Box */}
            {isCash && (
              <div className="p-3.5 bg-[var(--color-surface-secondary)] rounded-xl border border-[var(--color-border)] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-primary)]">
                    <Calculator size={15} className="text-emerald-600" />
                    <span>Cash Received & Change Calculator</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSetExactCash}
                    className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    Exact: ₹{formatNumber(calculations.grandTotal)}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--color-text-muted)]">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={receivedAmount || ''}
                      onChange={e => handleReceivedCashChange(e.target.value)}
                      onFocus={e => e.target.select()}
                      placeholder={`Enter cash (e.g. 500)`}
                      className="w-full h-10 pl-7 pr-3 text-base font-bold rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Quick Denomination Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] mr-1">Notes:</span>
                  {CASH_DENOMINATIONS.map(denom => (
                    <button
                      key={denom}
                      type="button"
                      onClick={() => updateField('receivedAmount', denom)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        receivedAmount === denom
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs scale-105'
                          : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-emerald-600'
                      }`}
                    >
                      ₹{denom}
                    </button>
                  ))}
                </div>

                {/* Return Change Banner */}
                {receivedAmount > 0 && (
                  <div className={`p-3.5 rounded-xl border-2 flex items-center justify-between transition-all ${
                    isShort
                      ? 'bg-rose-50 border-rose-400 text-rose-950'
                      : 'bg-emerald-50 border-emerald-400 text-emerald-950'
                  }`}>
                    <div>
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-text-secondary)]">
                        {isShort ? 'Short Amount' : 'Change to Return'}
                      </div>
                      <div className="text-2xl font-black text-[var(--color-text-primary)]">
                        {isShort ? `Short by ₹${formatNumber(calculations.grandTotal - receivedAmount)}` : `₹${formatNumber(changeToReturn)}`}
                      </div>
                    </div>
                    {!isShort && changeToReturn > 0 && (
                      <span className="text-xs font-bold bg-emerald-700 text-white px-3 py-1.5 rounded-lg shadow-2xs">
                        Return to customer
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* UPI Confirmation Prompt */}
            {paymentMethod === 'upi' && (
              <div className="p-3.5 bg-blue-50/90 rounded-xl border border-blue-200 text-xs text-blue-950 font-medium flex items-center gap-2.5">
                <QrCode size={18} className="text-blue-600 flex-shrink-0" />
                <span>Customer pays via UPI QR Code. Invoice will be recorded as <strong className="font-bold text-blue-900">Paid via UPI</strong>.</span>
              </div>
            )}

            {/* Credit Prompt */}
            {paymentMethod === 'credit' && (
              <div className="p-3.5 bg-amber-50/90 rounded-xl border border-amber-200 text-xs text-amber-950 font-medium flex items-center gap-2.5">
                <Clock size={18} className="text-amber-600 flex-shrink-0" />
                <span>Marked as <strong className="font-bold text-amber-900">Payment Due / Credit</strong>. You can track this in Sales History and send WhatsApp payment reminders.</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Collapsible Section: Invoice Meta & Settings */}
      <div className="border border-[var(--color-border)] rounded-xl overflow-hidden bg-[var(--color-surface)]">
        <button
          type="button"
          onClick={() => setIsDetailsOpen(!isDetailsOpen)}
          className="w-full flex items-center justify-between p-3.5 text-left hover:bg-[var(--color-surface-secondary)] transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[var(--color-text-primary)]">Invoice Details & Business</span>
            <span className="text-xs text-[var(--color-text-muted)]">
              ({activeBusiness?.name || 'No business'} • {form.invoiceLanguage === 'kn' ? 'Kannada' : 'English'})
            </span>
          </div>
          {isDetailsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {isDetailsOpen && (
          <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)] space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Business" className="col-span-2">
                <select
                  id="form-business-select"
                  value={form.businessId}
                  onChange={(e) => {
                    updateField('businessId', e.target.value);
                    setActiveBusiness(e.target.value);
                  }}
                  className="h-9 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                >
                  <option value="">Select business...</option>
                  {businesses.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Invoice Number">
                <Input
                  id="form-invoice-number"
                  value={form.invoiceNumber}
                  onChange={(e) => updateField('invoiceNumber', e.target.value)}
                  placeholder="Auto-generated"
                />
              </FormField>

              <FormField label="Invoice Date">
                <Input
                  id="form-invoice-date"
                  type="date"
                  value={form.invoiceDate}
                  onChange={(e) => updateField('invoiceDate', e.target.value)}
                />
              </FormField>

              <FormField label="Due Date (optional)">
                <Input
                  id="form-due-date"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => updateField('dueDate', e.target.value)}
                />
              </FormField>

              <FormField label="Invoice Language">
                <select
                  id="form-language"
                  value={form.invoiceLanguage}
                  onChange={(e) => updateField('invoiceLanguage', e.target.value as 'en' | 'kn')}
                  className="h-9 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                >
                  <option value="en">English</option>
                  <option value="kn">ಕನ್ನಡ (Kannada)</option>
                </select>
              </FormField>
            </div>
          </div>
        )}
      </div>

      {/* Collapsible Section: Template & Theme Customization */}
      <div className="border border-[var(--color-border)] rounded-xl overflow-hidden bg-[var(--color-surface)]">
        <button
          type="button"
          onClick={() => setIsThemeOpen(!isThemeOpen)}
          className="w-full flex items-center justify-between p-3.5 text-left hover:bg-[var(--color-surface-secondary)] transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[var(--color-text-primary)]">Template & Styling</span>
            <span className="text-xs text-[var(--color-text-muted)]">
              ({TEMPLATES.find(t => t.id === form.templateId)?.name || 'Default'})
            </span>
          </div>
          {isThemeOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {isThemeOpen && (
          <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)] space-y-3">
            <FormField label="Invoice Template">
              <select
                id="form-template-select"
                value={form.templateId}
                onChange={(e) => updateField('templateId', e.target.value)}
                className="h-9 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              >
                {TEMPLATES.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Accent Color">
              <div className="flex flex-wrap items-center gap-2">
                {ACCENT_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => updateTheme({ accentColor: color })}
                    className={`w-7 h-7 rounded-full transition-transform hover:scale-110 active:scale-95 ${
                      (form.themeOverrides?.accentColor ?? activeBusiness?.accentColor ?? '#6366F1') === color
                        ? 'ring-2 ring-offset-2 ring-[var(--color-primary)] scale-110'
                        : ''
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
                    updateTheme({ accentColor: randomColor });
                  }}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white hover:scale-110 active:scale-95 transition-transform"
                  title="Random color"
                >
                  <RefreshCw size={12} />
                </button>
                <input
                  type="color"
                  value={form.themeOverrides?.accentColor ?? activeBusiness?.accentColor ?? '#6366F1'}
                  onChange={(e) => updateTheme({ accentColor: e.target.value })}
                  className="w-7 h-7 rounded-full cursor-pointer border-2 border-[var(--color-border)] ml-1"
                  title="Custom color"
                />
              </div>
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Font Family">
                <select
                  id="form-font-family"
                  value={form.themeOverrides?.fontFamily ?? 'Inter'}
                  onChange={(e) => updateTheme({ fontFamily: e.target.value })}
                  className="h-9 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                >
                  {FONTS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Font Weight">
                <select
                  id="form-font-weight"
                  value={form.themeOverrides?.fontWeight ?? 'regular'}
                  onChange={(e) => updateTheme({ fontWeight: e.target.value as any })}
                  className="h-9 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                >
                  {FONT_WEIGHTS.map(w => (
                    <option key={w.value} value={w.value}>{w.label}</option>
                  ))}
                </select>
              </FormField>
            </div>
          </div>
        )}
      </div>

      {/* Quick Catalog Modal */}
      <QuickCatalogModal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        onAddBook={(book) => addBookItem(book)}
        onAddMultiple={(books) => addMultipleBooks(books)}
      />

      {/* Daily Fair Tally Modal */}
      <DailyFairTallyModal
        isOpen={isTallyModalOpen}
        onClose={() => setIsTallyModalOpen(false)}
      />
    </div>
  );
}
