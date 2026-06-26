import React, { useEffect, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { Button, Input, Textarea, Label, Select, Card, CardHeader, CardTitle, CardContent, FormField, Separator } from '@/components/ui';
import { useInvoiceStore } from '@/stores/useInvoiceStore';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { CustomerAutocomplete } from './CustomerAutocomplete';
import { LineItemRow } from './LineItemRow';
import { formatINR, formatNumber } from '@/lib/utils/currency';
import type { Customer } from '@/types';

const TEMPLATES = [
  { id: 'minimal-modern', name: 'Minimal Modern' },
  { id: 'premium-corporate', name: 'Premium Corporate' },
  { id: 'traditional-indian', name: 'Traditional Indian' },
  { id: 'publication-focus', name: 'Publication Focus' },
  { id: 'elegant-serif', name: 'Elegant Serif' },
  { id: 'basic-clean', name: 'Basic Clean' },
];

const FONTS = [
  // — Sans Serif —
  { value: 'Inter',        label: '✦ Inter (Modern Sans)' },
  { value: 'Roboto',       label: '✦ Roboto (Clean)' },
  { value: 'Open Sans',    label: '✦ Open Sans (Friendly)' },
  { value: 'Source Sans 3',label: '✦ Source Sans 3 (Professional)' },
  { value: 'Noto Sans',    label: '✦ Noto Sans (Universal)' },
  { value: 'Lato',         label: '✦ Lato (Elegant)' },
  // — Business / Invoice Style —
  { value: 'Poppins',      label: '✦ Poppins (Bold & Modern)' },
  { value: 'Montserrat',   label: '✦ Montserrat (Premium)' },
  { value: 'Nunito Sans',  label: '✦ Nunito Sans (Rounded)' },
  { value: 'Work Sans',    label: '✦ Work Sans (Technical)' },
  { value: 'Outfit',       label: '✦ Outfit (Display)' },
  // — Serif —
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

export function InvoiceForm() {
  const { form, calculations, updateField, updateTheme, addItem, removeItem, updateItem, toggleShowIsbn, toggleShowSlNo, toggleShowAuthor, setBulkQuantity } = useInvoiceStore();
  const { businesses, activeBusiness, setActiveBusiness } = useBusinessStore();
  const [bulkQty, setBulkQty] = useState('');

  // Sync active business only when form has no business selected yet (new invoice)
  useEffect(() => {
    if (activeBusiness && !form.businessId) {
      updateField('businessId', activeBusiness.id);
    }
  }, [activeBusiness]);

  const handleCustomerSelect = (c: Customer) => {
    updateField('customerName', c.name);
    updateField('customerPhone', c.phone ?? '');
    updateField('customerEmail', c.email ?? '');
    updateField('customerAddress', c.address ?? '');
    updateField('customerGstin', c.gstin ?? '');
    updateField('customerNotes', c.notes ?? '');
  };

  // Fix phone prefix: only add +91 if the value doesn't already start with +
  const handlePhoneChange = (val: string, field: 'customerPhone') => {
    if (val === '') {
      updateField(field, '');
      return;
    }
    // If user is typing from scratch (no + prefix), auto-add +91
    if (!val.startsWith('+')) {
      updateField(field, '+91 ' + val);
    } else {
      updateField(field, val);
    }
  };

  return (
    <div className="h-full overflow-y-auto px-4 py-4 space-y-4">

      {/* Section: Invoice Details */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {/* Business */}
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

            {/* Invoice Number */}
            <FormField label="Invoice Number">
              <Input
                id="form-invoice-number"
                value={form.invoiceNumber}
                onChange={(e) => updateField('invoiceNumber', e.target.value)}
                placeholder="Auto-generated"
              />
            </FormField>

            {/* Date */}
            <FormField label="Invoice Date">
              <Input
                id="form-invoice-date"
                type="date"
                value={form.invoiceDate}
                onChange={(e) => updateField('invoiceDate', e.target.value)}
              />
            </FormField>

            {/* Due Date */}
            <FormField label="Due Date (optional)">
              <Input
                id="form-due-date"
                type="date"
                value={form.dueDate}
                onChange={(e) => updateField('dueDate', e.target.value)}
              />
            </FormField>

            {/* Language */}
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
        </CardContent>
      </Card>

      {/* Section: Customer */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Customer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Customer Name" className="col-span-2">
              <CustomerAutocomplete
                id="form-customer-name"
                value={form.customerName}
                onChange={(v) => updateField('customerName', v)}
                onSelect={handleCustomerSelect}
                placeholder="Customer name"
              />
            </FormField>
            <FormField label="Phone">
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
            <FormField label="Address" className="col-span-2">
              <Textarea
                id="form-customer-address"
                value={form.customerAddress}
                onChange={(e) => updateField('customerAddress', e.target.value)}
                placeholder="Billing address"
                className="min-h-[60px]"
              />
            </FormField>
            <FormField label="GSTIN (optional)">
              <Input
                id="form-customer-gstin"
                value={form.customerGstin}
                onChange={(e) => updateField('customerGstin', e.target.value.toUpperCase())}
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
              />
            </FormField>
            <FormField label="Notes (optional)">
              <Input
                id="form-customer-notes"
                value={form.customerNotes}
                onChange={(e) => updateField('customerNotes', e.target.value)}
                placeholder="Any notes for this customer"
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Section: Items */}
      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle>Items</CardTitle>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 bg-[var(--color-surface-secondary)] p-1 rounded-md border border-[var(--color-border)]">
              <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] px-1">Bulk Qty:</span>
              <input 
                type="number" 
                value={bulkQty} 
                onChange={(e) => setBulkQty(e.target.value)} 
                className="w-12 h-6 text-xs text-center border border-[var(--color-border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                placeholder="0"
                min="1"
              />
              <button 
                type="button" 
                onClick={() => { const q = parseInt(bulkQty); if (!isNaN(q) && q > 0) setBulkQuantity(q); }} 
                className="h-6 px-2 text-xs font-medium bg-[var(--color-primary)] text-white rounded hover:opacity-90"
              >
                Set All
              </button>
            </div>
            <div className="flex items-center gap-2">
            <label
              htmlFor="form-show-isbn"
              className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] cursor-pointer select-none"
            >
              <input
                id="form-show-isbn"
                type="checkbox"
                checked={form.showIsbn}
                onChange={toggleShowIsbn}
                className="w-3.5 h-3.5 accent-[var(--color-primary)] cursor-pointer"
              />
              Show ISBN
            </label>
            <label
              htmlFor="form-show-slno"
              className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] cursor-pointer select-none"
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
            <label
              htmlFor="form-show-author"
              className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] cursor-pointer select-none"
            >
              <input
                id="form-show-author"
                type="checkbox"
                checked={form.showAuthor}
                onChange={toggleShowAuthor}
                className="w-3.5 h-3.5 accent-[var(--color-primary)] cursor-pointer"
              />
              Show Author
            </label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2">
          <div className="overflow-visible">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="py-2 px-2 text-left text-xs font-medium text-[var(--color-text-muted)] w-8">#</th>
                  {form.showSlNo && <th className="py-2 px-1 text-left text-xs font-medium text-[var(--color-text-muted)] w-24">Sel. No.</th>}
                  <th className="py-2 px-1 text-left text-xs font-medium text-[var(--color-text-muted)]">Book / Product</th>
                  {form.showAuthor && <th className="py-2 px-1 text-left text-xs font-medium text-[var(--color-text-muted)] w-36">Author/Translator</th>}
                  {form.showIsbn && <th className="py-2 px-1 text-left text-xs font-medium text-[var(--color-text-muted)] w-20">ISBN</th>}
                  <th className="py-2 px-1 text-left text-xs font-medium text-[var(--color-text-muted)] w-20">Unit Price</th>
                  <th className="py-2 px-1 text-left text-xs font-medium text-[var(--color-text-muted)] w-14">Qty</th>
                  <th className="w-8"></th>
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

          <button
            type="button"
            id="add-line-item-btn"
            onClick={addItem}
            className="mt-3 w-full flex items-center justify-center gap-2 h-8 text-xs font-medium text-[var(--color-primary)] border border-dashed border-[var(--color-primary-300)] rounded-lg hover:bg-[var(--color-primary-50)] dark:hover:bg-[var(--color-primary-900)]/30 transition-colors"
          >
            <Plus size={13} />
            Add Row
          </button>
        </CardContent>
      </Card>

      {/* Section: Totals & Discount */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Discount & Totals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Discount */}
            <div className="flex gap-2">
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
              <FormField label={form.discountType === 'percentage' ? 'Discount (%)' : 'Discount (₹)'} className="flex-1">
                <Input
                  id="form-discount-value"
                  type="number"
                  min="0"
                  max={form.discountType === 'percentage' ? 100 : undefined}
                  step={form.discountType === 'percentage' ? 1 : 0.01}
                  value={form.discountValue || ''}
                  onChange={(e) => updateField('discountValue', parseFloat(e.target.value) || 0)}
                  placeholder={form.discountType === 'percentage' ? 'e.g. 30' : 'e.g. 500'}
                />
              </FormField>
            </div>

            <Separator />

            {/* Summary */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">Subtotal</span>
                <span className="font-medium">₹{formatNumber(calculations.subtotal)}</span>
              </div>
              {calculations.discountAmount > 0 && (
                <div className="flex justify-between text-red-600 dark:text-red-400">
                  <span>Discount ({form.discountType === 'percentage' ? `${form.discountValue}%` : 'flat'})</span>
                  <span>-₹{formatNumber(calculations.discountAmount)}</span>
                </div>
              )}
              {calculations.roundOff !== 0 && (
                <div className="flex justify-between text-[var(--color-text-muted)]">
                  <span>Round Off</span>
                  <span>{calculations.roundOff > 0 ? '+' : ''}₹{formatNumber(Math.abs(calculations.roundOff))}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-[var(--color-border)] text-base font-bold">
                <span>Grand Total</span>
                <span className="text-[var(--color-primary)]">{formatINR(calculations.grandTotal)}</span>
              </div>
              <div className="text-xs text-[var(--color-text-muted)] italic">
                {calculations.amountInWords}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section: Template & Theme */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Template & Theme</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
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

              <FormField label="Font Size">
                <select
                  id="form-font-size"
                  value={form.themeOverrides?.fontSize ?? '100'}
                  onChange={(e) => updateTheme({ fontSize: e.target.value as any })}
                  className="h-9 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                >
                  {FONT_SIZES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Table Title Size">
                <select
                  id="form-table-title-size"
                  value={form.themeOverrides?.tableTitleFontSize ?? '100'}
                  onChange={(e) => updateTheme({ tableTitleFontSize: e.target.value as any })}
                  className="h-9 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                >
                  {FONT_SIZES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Table Author Size">
                <select
                  id="form-table-author-size"
                  value={form.themeOverrides?.tableAuthorFontSize ?? '100'}
                  onChange={(e) => updateTheme({ tableAuthorFontSize: e.target.value as any })}
                  className="h-9 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                >
                  {FONT_SIZES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Logo Size">
                <select
                  id="form-logo-size"
                  value={form.themeOverrides?.logoSize ?? 'medium'}
                  onChange={(e) => updateTheme({ logoSize: e.target.value as 'small' | 'medium' | 'large' })}
                  className="h-9 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </FormField>

              <FormField label="Header Layout">
                <select
                  id="form-header-layout"
                  value={form.themeOverrides?.headerLayout ?? 'split'}
                  onChange={(e) => updateTheme({ headerLayout: e.target.value as 'centered' | 'left' | 'split' })}
                  className="h-9 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                >
                  <option value="split">Split (Logo Left / Info Right)</option>
                  <option value="centered">Centered</option>
                  <option value="left">Left Aligned</option>
                </select>
              </FormField>

              <FormField label="Border Style">
                <select
                  id="form-border-style"
                  value={form.themeOverrides?.borderStyle ?? 'lines'}
                  onChange={(e) => updateTheme({ borderStyle: e.target.value as 'lines' | 'boxed' | 'minimal' | 'none' })}
                  className="h-9 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                >
                  <option value="lines">Lines</option>
                  <option value="boxed">Boxed</option>
                  <option value="minimal">Minimal</option>
                  <option value="none">None</option>
                </select>
              </FormField>

              <FormField label="Line Spacing">
                <select
                  id="form-line-spacing"
                  value={form.themeOverrides?.lineSpacing ?? 'normal'}
                  onChange={(e) => updateTheme({ lineSpacing: e.target.value as 'compact' | 'normal' | 'relaxed' })}
                  className="h-9 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                >
                  <option value="compact">Compact</option>
                  <option value="normal">Normal</option>
                  <option value="relaxed">Relaxed</option>
                </select>
              </FormField>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <div className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1">🖨 Print Optimization</div>
              <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.themeOverrides?.printFriendly ?? false}
                  onChange={(e) => updateTheme({ printFriendly: e.target.checked })}
                  className="w-4 h-4 accent-[var(--color-primary)] rounded"
                  id="form-print-friendly-toggle"
                />
                <div>
                  <div className="font-medium">Print Friendly Mode</div>
                  <div className="text-xs text-[var(--color-text-muted)]">Optimizes colors for B&W laser printers and photocopies</div>
                </div>
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.themeOverrides?.highContrast ?? false}
                  onChange={(e) => updateTheme({ highContrast: e.target.checked })}
                  className="w-4 h-4 accent-[var(--color-primary)] rounded"
                  id="form-high-contrast-toggle"
                />
                <div>
                  <div className="font-medium">High Contrast Mode</div>
                  <div className="text-xs text-[var(--color-text-muted)]">Bolder fonts and stronger borders — great for scanned invoices</div>
                </div>
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.themeOverrides?.showWatermark ?? false}
                  onChange={(e) => updateTheme({ showWatermark: e.target.checked })}
                  className="w-4 h-4 accent-[var(--color-primary)] rounded"
                  id="form-watermark-toggle"
                />
                Show Watermark
              </label>
              {form.themeOverrides?.showWatermark && (
                <Input
                  value={form.themeOverrides?.watermarkText ?? 'ORIGINAL'}
                  onChange={(e) => updateTheme({ watermarkText: e.target.value })}
                  placeholder="Watermark text"
                  className="h-8 text-xs"
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
