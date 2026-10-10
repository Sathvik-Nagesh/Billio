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
  Calculator,
  SlidersHorizontal,
  Phone
} from 'lucide-react';
import { Button, Input, FormField, Separator } from '@/components/ui';
import { useInvoiceStore } from '@/stores/useInvoiceStore';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { CustomerAutocomplete } from './CustomerAutocomplete';
import { LineItemRow, MobileLineItemCard } from './LineItemRow';
import { QuickCatalogModal } from './QuickCatalogModal';
import { DailyFairTallyModal } from './DailyFairTallyModal';
import { formatINR, formatNumber } from '@/lib/utils/currency';
import { formatPhoneDisplay } from '@/lib/utils/phone';
import type { Customer } from '@/types';
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
  const [isCustomerMoreOpen, setIsCustomerMoreOpen] = useState(false);
  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false);
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
    toast.success('Set to Walk-in Customer');
  };

  const handleResetForm = () => {
    if (form.items.some(i => i.productName) || (form.customerName && form.customerName !== 'Walk-in Customer')) {
      if (confirm('Clear this bill and start a new one?')) {
        resetForm();
        toast.info('Form cleared for new bill');
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

  const handlePhoneChange = (val: string) => {
    updateField('customerPhone', formatPhoneDisplay(val));
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
    <div className="h-full overflow-y-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3.5 pb-24">
      {/* 1. Customer Card: Ultra Clean & Fast */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[var(--color-text-primary)]">Customer</span>
            {form.customerName === 'Walk-in Customer' ? (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                <UserCheck size={11} /> Walk-in
              </span>
            ) : form.customerName ? (
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300 px-2 py-0.5 rounded-full">
                {form.customerName}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSetWalkIn}
              className="text-xs font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary-50)] dark:hover:bg-[var(--color-primary-950)] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              + Walk-in
            </button>
            <button
              type="button"
              onClick={handleResetForm}
              className="text-xs font-medium text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 p-1.5 rounded-lg transition-colors cursor-pointer"
              title="Reset Form"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* Name & Phone in 1 clean grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="text-[11px] font-semibold text-[var(--color-text-muted)] block mb-1">
              Customer Name / Organization
            </label>
            <CustomerAutocomplete
              id="form-customer-name"
              value={form.customerName}
              onChange={(v) => updateField('customerName', v)}
              onSelect={handleCustomerSelect}
              placeholder="e.g. Walk-in or Customer Name"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[var(--color-text-muted)] block mb-1 flex items-center gap-1">
              <Phone size={11} className="text-emerald-600" />
              <span>Phone (for WhatsApp Bill)</span>
            </label>
            <Input
              id="form-customer-phone"
              value={form.customerPhone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="+91 XXXXX XXXXX"
              className="h-9"
            />
          </div>
        </div>

        {/* Collapsible extra fields for address, GSTIN, notes */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setIsCustomerMoreOpen(!isCustomerMoreOpen)}
            className="text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>{isCustomerMoreOpen ? '− Less Details' : '+ Add Address, Email, GSTIN (optional)'}</span>
          </button>

          {isCustomerMoreOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2.5 animate-fade-in">
              <div>
                <label className="text-[11px] font-semibold text-[var(--color-text-muted)] block mb-1">Email</label>
                <Input
                  id="form-customer-email"
                  type="email"
                  value={form.customerEmail}
                  onChange={(e) => updateField('customerEmail', e.target.value)}
                  placeholder="email@example.com"
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[var(--color-text-muted)] block mb-1">GSTIN</label>
                <Input
                  id="form-customer-gstin"
                  value={form.customerGstin}
                  onChange={(e) => updateField('customerGstin', e.target.value)}
                  placeholder="29AAAAA0000A1Z5"
                  className="h-9 font-mono uppercase"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-[var(--color-text-muted)] block mb-1">Address</label>
                <Input
                  id="form-customer-address"
                  value={form.customerAddress}
                  onChange={(e) => updateField('customerAddress', e.target.value)}
                  placeholder="City, State or Full Address"
                  className="h-9"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Items Section: Touch Cards on Mobile, Clean Table on Desktop */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[var(--color-text-primary)]">
              Items ({form.items.length})
            </span>
            <button
              type="button"
              onClick={() => setIsCatalogModalOpen(true)}
              className="flex items-center gap-1 text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)] px-2.5 py-1 rounded-lg hover:opacity-85 transition-opacity cursor-pointer"
            >
              <Sparkles size={13} />
              <span>Quick Catalog (Alt+K)</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsTallyModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-emerald-500 hover:text-emerald-600 transition-all cursor-pointer"
              title="Daily Fair Tally (Alt+T)"
            >
              <Receipt size={13} className="text-emerald-600" />
              <span className="hidden sm:inline">Daily Tally</span>
            </button>

            {/* Columns Settings Toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsColumnSettingsOpen(!isColumnSettingsOpen)}
                className="p-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                title="Toggle Columns & Bulk Quantity"
              >
                <SlidersHorizontal size={14} />
              </button>

              {isColumnSettingsOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl p-3 z-50 space-y-2.5 text-xs">
                  <div className="font-bold text-[var(--color-text-primary)] pb-1 border-b border-[var(--color-border)]">
                    Display Columns
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.showAuthor}
                      onChange={toggleShowAuthor}
                      className="w-3.5 h-3.5 accent-[var(--color-primary)]"
                    />
                    <span>Author / Translator</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.showIsbn}
                      onChange={toggleShowIsbn}
                      className="w-3.5 h-3.5 accent-[var(--color-primary)]"
                    />
                    <span>ISBN</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.showSlNo}
                      onChange={toggleShowSlNo}
                      className="w-3.5 h-3.5 accent-[var(--color-primary)]"
                    />
                    <span>Selection No.</span>
                  </label>

                  <div className="pt-2 border-t border-[var(--color-border)]">
                    <div className="font-bold text-[var(--color-text-primary)] mb-1.5">Bulk Quantity</div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        value={bulkQty}
                        onChange={(e) => setBulkQty(e.target.value)}
                        placeholder="Qty"
                        className="w-16 h-7 text-xs text-center border border-[var(--color-border)] bg-[var(--color-surface)] rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const q = parseInt(bulkQty);
                          if (!isNaN(q) && q > 0) {
                            setBulkQuantity(q);
                            toast.success(`Set all quantities to ${q}`);
                          }
                        }}
                        className="h-7 px-2.5 text-xs font-bold bg-[var(--color-primary)] text-white rounded-md hover:opacity-90"
                      >
                        Apply All
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Item Cards View (<640px) */}
        <div className="space-y-2.5 sm:hidden">
          {form.items.map((item, idx) => (
            <MobileLineItemCard
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
        </div>

        {/* Desktop Table View (>=640px) */}
        <div className="hidden sm:block overflow-x-auto pb-1">
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

        {/* Add Row Action */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            id="add-line-item-btn"
            onClick={addItem}
            className="flex-1 flex items-center justify-center gap-2 h-10 text-xs font-bold text-[var(--color-primary)] border-2 border-dashed border-[var(--color-primary-300)] rounded-xl hover:bg-[var(--color-primary-50)] dark:hover:bg-[var(--color-primary-950)]/40 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Item Row (Alt+N)</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCatalogModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 h-10 text-xs font-semibold text-[var(--color-text-secondary)] border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-surface-secondary)] transition-colors whitespace-nowrap cursor-pointer"
          >
            <BookOpen size={14} />
            <span>Catalog</span>
          </button>
        </div>
      </div>

      {/* 3. Discount & Trade Discount Presets */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-primary)]">
            <Zap size={14} className="text-amber-500" />
            <span>Trade Discount</span>
          </div>
          {calculations.discountAmount > 0 && (
            <span className="text-xs font-bold text-red-600 dark:text-red-400">
              -₹{formatNumber(calculations.discountAmount)} Off
            </span>
          )}
        </div>

        {/* Quick Discount Pills */}
        <div className="flex flex-wrap gap-1.5">
          {QUICK_DISCOUNTS.map(pct => {
            const isSelected = form.discountType === 'percentage' && form.discountValue === pct;
            return (
              <button
                key={pct}
                type="button"
                onClick={() => setQuickDiscount(pct)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--color-primary)] text-white shadow-xs scale-105'
                    : 'bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
                }`}
              >
                {pct === 0 ? '0%' : `${pct}%`}
              </button>
            );
          })}
        </div>

        {/* Custom Discount Input */}
        <div className="flex items-center gap-2 pt-1">
          <select
            id="form-discount-type"
            value={form.discountType}
            onChange={(e) => updateField('discountType', e.target.value as 'percentage' | 'flat')}
            className="h-9 w-28 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs font-medium text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          >
            <option value="percentage">Custom %</option>
            <option value="flat">Flat ₹</option>
          </select>
          <Input
            id="form-discount-value"
            type="number"
            min="0"
            max={form.discountType === 'percentage' ? 100 : undefined}
            step={form.discountType === 'percentage' ? 1 : 0.01}
            value={form.discountValue || ''}
            onChange={(e) => updateField('discountValue', parseFloat(e.target.value) || 0)}
            placeholder={form.discountType === 'percentage' ? 'e.g. 33%' : 'e.g. 500'}
            className="h-9 text-xs font-bold"
          />
        </div>
      </div>

      {/* 4. Payment Mode & Speed Cash Calculator */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-2xs">
        <div className="text-xs font-bold text-[var(--color-text-primary)]">
          Payment Method
        </div>

        {/* Payment Tabs: Cash / UPI / Credit */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setPaymentDetails('cash')}
            className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border-2 transition-all cursor-pointer ${
              paymentMethod === 'cash'
                ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-bold shadow-2xs'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]'
            }`}
          >
            <DollarSign size={18} className="mb-1 text-emerald-600 font-bold" strokeWidth={2.5} />
            <span className="text-xs font-bold">{form.invoiceLanguage === 'kn' ? 'ನಗದು (Cash)' : 'Cash'}</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentDetails('upi')}
            className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border-2 transition-all cursor-pointer ${
              paymentMethod === 'upi'
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 font-bold shadow-2xs'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]'
            }`}
          >
            <QrCode size={18} className="mb-1 text-blue-600 font-bold" strokeWidth={2.5} />
            <span className="text-xs font-bold">{form.invoiceLanguage === 'kn' ? 'ಯುಪಿಐ (UPI)' : 'UPI / QR'}</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentDetails('credit')}
            className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border-2 transition-all cursor-pointer ${
              paymentMethod === 'credit'
                ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 font-bold shadow-2xs'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]'
            }`}
          >
            <Clock size={18} className="mb-1 text-amber-600 font-bold" strokeWidth={2.5} />
            <span className="text-xs font-bold">{form.invoiceLanguage === 'kn' ? 'ಉದ್ದರಿ (Due)' : 'Credit'}</span>
          </button>
        </div>

        {/* Cash Calculator & Change Box */}
        {isCash && (
          <div className="p-3 bg-[var(--color-surface-secondary)] rounded-xl border border-[var(--color-border)] space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-primary)]">
                <Calculator size={14} className="text-emerald-600" />
                <span>Cash Received</span>
              </div>
              <button
                type="button"
                onClick={handleSetExactCash}
                className="px-2.5 py-0.5 text-[11px] font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md shadow-2xs cursor-pointer"
              >
                Exact: ₹{formatNumber(calculations.grandTotal)}
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--color-text-muted)]">₹</span>
              <input
                type="number"
                min="0"
                step="1"
                value={receivedAmount || ''}
                onChange={e => handleReceivedCashChange(e.target.value)}
                onFocus={e => e.target.select()}
                placeholder="Enter cash received"
                className="w-full h-10 pl-7 pr-3 text-base font-bold rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Note Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] mr-1">Notes:</span>
              {CASH_DENOMINATIONS.map(denom => (
                <button
                  key={denom}
                  type="button"
                  onClick={() => updateField('receivedAmount', denom)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
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
              <div className={`p-3 rounded-xl border-2 flex items-center justify-between transition-all ${
                isShort
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-950 dark:text-rose-200'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-950 dark:text-emerald-200'
              }`}>
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-secondary)]">
                    {isShort ? 'Short Amount' : 'Change to Return'}
                  </div>
                  <div className="text-xl font-black text-[var(--color-text-primary)]">
                    {isShort ? `Short by ₹${formatNumber(calculations.grandTotal - receivedAmount)}` : `₹${formatNumber(changeToReturn)}`}
                  </div>
                </div>
                {!isShort && changeToReturn > 0 && (
                  <span className="text-xs font-bold bg-emerald-700 text-white px-2.5 py-1 rounded-lg shadow-2xs">
                    Return to customer
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Collapsible Advanced Settings (Date, Language, Business, Templates) */}
      <div className="border border-[var(--color-border)] rounded-2xl overflow-hidden bg-[var(--color-surface)]">
        <button
          type="button"
          onClick={() => setIsDetailsOpen(!isDetailsOpen)}
          className="w-full flex items-center justify-between p-3.5 text-left hover:bg-[var(--color-surface-secondary)] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--color-text-primary)]">Bill Details, Business & Language</span>
            <span className="text-[11px] text-[var(--color-text-muted)] truncate max-w-[150px]">
              ({activeBusiness?.name || 'Default'})
            </span>
          </div>
          {isDetailsOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {isDetailsOpen && (
          <div className="p-3.5 border-t border-[var(--color-border)] bg-[var(--color-surface)] space-y-3 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Active Business" className="sm:col-span-2">
                <select
                  id="form-business-select"
                  value={form.businessId}
                  onChange={(e) => {
                    updateField('businessId', e.target.value);
                    setActiveBusiness(e.target.value);
                  }}
                  className="h-9 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs font-medium text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                >
                  <option value="">Select business...</option>
                  {businesses.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Invoice Date">
                <Input
                  id="form-invoice-date"
                  type="date"
                  value={form.invoiceDate}
                  onChange={(e) => updateField('invoiceDate', e.target.value)}
                  className="h-9 text-xs"
                />
              </FormField>

              <FormField label="Invoice Language">
                <select
                  id="form-language"
                  value={form.invoiceLanguage}
                  onChange={(e) => updateField('invoiceLanguage', e.target.value as 'en' | 'kn')}
                  className="h-9 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs font-medium text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                >
                  <option value="en">English</option>
                  <option value="kn">ಕನ್ನಡ (Kannada)</option>
                </select>
              </FormField>
            </div>
          </div>
        )}
      </div>

      {/* 6. Collapsible Template & Font Styling */}
      <div className="border border-[var(--color-border)] rounded-2xl overflow-hidden bg-[var(--color-surface)]">
        <button
          type="button"
          onClick={() => setIsThemeOpen(!isThemeOpen)}
          className="w-full flex items-center justify-between p-3.5 text-left hover:bg-[var(--color-surface-secondary)] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--color-text-primary)]">Template & Print Font Styling</span>
            <span className="text-[11px] text-[var(--color-text-muted)]">
              ({TEMPLATES.find(t => t.id === form.templateId)?.name || 'Default'})
            </span>
          </div>
          {isThemeOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {isThemeOpen && (
          <div className="p-3.5 border-t border-[var(--color-border)] bg-[var(--color-surface)] space-y-3 animate-fade-in">
            <FormField label="Invoice Template">
              <select
                id="form-template-select"
                value={form.templateId}
                onChange={(e) => updateField('templateId', e.target.value)}
                className="h-9 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs font-medium text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
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
                    className={`w-7 h-7 rounded-full transition-transform hover:scale-110 active:scale-95 cursor-pointer ${
                      (form.themeOverrides?.accentColor ?? activeBusiness?.accentColor ?? '#6366F1') === color
                        ? 'ring-2 ring-offset-2 ring-[var(--color-primary)] scale-110'
                        : ''
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
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
                  className="h-9 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs font-medium text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
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
                  className="h-9 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs font-medium text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
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
