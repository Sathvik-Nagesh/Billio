import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Input, Textarea, FormField, Card, CardHeader, CardTitle, CardContent, Separator } from '@/components/ui';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { previewInvoiceNumber } from '@/lib/utils/invoiceNumber';
import type { Business } from '@/types';
import { Upload, X } from 'lucide-react';

type FormData = Omit<Business, 'id' | 'createdAt' | 'updatedAt'>;

const defaultForm: FormData = {
  name: '',
  logoPath: '',
  address: '',
  gstin: '',
  phone: '',
  email: '',
  bankName: '',
  bankAccount: '',
  bankIfsc: '',
  bankBranch: '',
  upiQrPath: '',
  terms: '',
  signaturePath: '',
  sealPath: '',
  invoicePrefix: '',
  invoiceYearFormat: 'FY',
  invoiceSeparator: '-',
  invoicePadding: 3,
  invoiceStartNumber: 1,
  accentColor: '#6366F1',
  templateId: 'minimal-modern',
  isDefault: false,
};

function ImageUploadField({ label, value, onChange, id }: { label: string; value: string; onChange: (v: string) => void; id: string }) {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</label>
      <div className="mt-1.5 flex items-center gap-3">
        {value ? (
          <div className="relative">
            <img src={value} alt={label} className="h-14 max-w-[120px] object-contain rounded-lg border border-[var(--color-border)] bg-gray-50" />
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
            >
              <X size={10} />
            </button>
          </div>
        ) : null}
        <label id={id} className="flex items-center gap-2 h-9 px-3 rounded-lg border border-dashed border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] cursor-pointer transition-colors">
          <Upload size={13} />
          {value ? 'Change' : 'Upload'}
          <input type="file" accept="image/*" className="sr-only" onChange={handleFile} />
        </label>
      </div>
    </div>
  );
}

export function BusinessFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { businesses, createBusiness, updateBusiness, load } = useBusinessStore();
  const [form, setForm] = useState<FormData>(defaultForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  useEffect(() => {
    if (id) {
      const biz = businesses.find(b => b.id === id);
      if (biz) {
        const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = biz;
        setForm(rest);
      }
    }
  }, [id, businesses]);

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!form.name.trim()) errs.name = 'Business name is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (id) {
      updateBusiness(id, form);
    } else {
      createBusiness(form);
    }
    navigate('/businesses');
  };

  const invoicePreview = previewInvoiceNumber(form, form.invoiceStartNumber);

  return (
    <form onSubmit={handleSubmit} className="h-full overflow-y-auto p-6 animate-fade-in">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{id ? 'Edit Business' : 'New Business Profile'}</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Fill in your business details</p>
          </div>
        </div>

        {/* Basic Info */}
        <Card>
          <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              <FormField label="Business Name *" error={errors.name}>
                <Input id="biz-name" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. ABC Publications" />
              </FormField>
              <ImageUploadField label="Logo" value={form.logoPath ?? ''} onChange={v => set('logoPath', v)} id="biz-logo-upload" />
              <FormField label="Address">
                <Textarea id="biz-address" value={form.address ?? ''} onChange={e => set('address', e.target.value)} placeholder="Full business address" className="min-h-[70px]" />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="GSTIN">
                  <Input id="biz-gstin" value={form.gstin ?? ''} onChange={e => set('gstin', e.target.value.toUpperCase())} placeholder="22AAAAA0000A1Z5" maxLength={15} />
                </FormField>
                <FormField label="Phone">
                  <Input id="biz-phone" value={form.phone ?? ''} onChange={e => {
                    let val = e.target.value;
                    if (val === '+91' || val === '+91 ') val = '';
                    else if (val.length > 0 && !val.startsWith('+')) val = '+91 ' + val;
                    set('phone', val);
                  }} placeholder="+91 XXXXX XXXXX" />
                </FormField>
                <FormField label="Email">
                  <Input id="biz-email" type="email" value={form.email ?? ''} onChange={e => set('email', e.target.value)} placeholder="email@business.com" />
                </FormField>
                <FormField label="Accent Color">
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.accentColor} onChange={e => set('accentColor', e.target.value)} className="w-9 h-9 rounded-lg border border-[var(--color-border)] cursor-pointer p-0.5 shrink-0" id="biz-accent-color" />
                    <Input value={form.accentColor} onChange={e => set('accentColor', e.target.value)} className="flex-1 font-mono text-xs uppercase" />
                    <button
                      type="button"
                      onClick={() => {
                        const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
                        set('accentColor', randomColor);
                      }}
                      className="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90 active:scale-95 transition-all shrink-0"
                      title="Random color"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.13 15.57a9 9 0 1 0 3.84-10.36l-5.69 2.72"/></svg>
                    </button>
                  </div>
                </FormField>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card>
          <CardHeader><CardTitle>Bank Details</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Bank Name" className="col-span-2">
                <Input id="biz-bank-name" value={form.bankName ?? ''} onChange={e => set('bankName', e.target.value)} placeholder="e.g. State Bank of India" />
              </FormField>
              <FormField label="Account Number">
                <Input id="biz-bank-account" value={form.bankAccount ?? ''} onChange={e => set('bankAccount', e.target.value)} placeholder="Account number" />
              </FormField>
              <FormField label="IFSC Code">
                <Input id="biz-bank-ifsc" value={form.bankIfsc ?? ''} onChange={e => set('bankIfsc', e.target.value.toUpperCase())} placeholder="SBIN0000000" />
              </FormField>
              <FormField label="Branch" className="col-span-2">
                <Input id="biz-bank-branch" value={form.bankBranch ?? ''} onChange={e => set('bankBranch', e.target.value)} placeholder="Branch name" />
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Numbering */}
        <Card>
          <CardHeader><CardTitle>Invoice Numbering</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Invoice Prefix">
                <Input id="biz-prefix" value={form.invoicePrefix ?? ''} onChange={e => set('invoicePrefix', e.target.value)} placeholder="e.g. ABC, XYZ" />
              </FormField>
              <FormField label="Year Format">
                <select id="biz-year-format" value={form.invoiceYearFormat} onChange={e => set('invoiceYearFormat', e.target.value as Business['invoiceYearFormat'])} className="h-9 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent">
                  <option value="FY">FY (2526 = 2025-26)</option>
                  <option value="YYYY">YYYY (2026)</option>
                  <option value="YY">YY (26)</option>
                  <option value="none">None</option>
                </select>
              </FormField>
              <FormField label="Separator">
                <select id="biz-separator" value={form.invoiceSeparator} onChange={e => set('invoiceSeparator', e.target.value)} className="h-9 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent">
                  <option value="-">Dash (-)</option>
                  <option value="/">Slash (/)</option>
                  <option value="">None</option>
                </select>
              </FormField>
              <FormField label="Padding (digits)">
                <select id="biz-padding" value={form.invoicePadding} onChange={e => set('invoicePadding', parseInt(e.target.value))} className="h-9 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent">
                  <option value={1}>1 (1, 2, 3...)</option>
                  <option value={2}>2 (01, 02...)</option>
                  <option value={3}>3 (001, 002...)</option>
                  <option value={4}>4 (0001, 0002...)</option>
                </select>
              </FormField>
              <FormField label="Starting Number">
                <Input id="biz-start-num" type="number" min={1} value={form.invoiceStartNumber} onChange={e => set('invoiceStartNumber', parseInt(e.target.value) || 1)} />
              </FormField>
              <FormField label="Preview">
                <div className="h-9 px-3 flex items-center rounded-lg bg-[var(--color-surface-tertiary)] border border-[var(--color-border)] font-mono text-sm font-semibold text-[var(--color-primary)]">
                  {invoicePreview}
                </div>
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader><CardTitle>Images & Documents</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <ImageUploadField label="UPI QR Code" value={form.upiQrPath ?? ''} onChange={v => set('upiQrPath', v)} id="biz-upi-upload" />
              <ImageUploadField label="Signature" value={form.signaturePath ?? ''} onChange={v => set('signaturePath', v)} id="biz-sig-upload" />
              <ImageUploadField label="Company Seal (optional)" value={form.sealPath ?? ''} onChange={v => set('sealPath', v)} id="biz-seal-upload" />
            </div>
          </CardContent>
        </Card>

        {/* Terms */}
        <Card>
          <CardHeader><CardTitle>Terms & Conditions</CardTitle></CardHeader>
          <CardContent>
            <Textarea
              id="biz-terms"
              value={form.terms ?? ''}
              onChange={e => set('terms', e.target.value)}
              placeholder="Enter your standard terms and conditions..."
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 pb-6">
          <Button type="button" variant="outline" onClick={() => navigate('/businesses')} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" id="biz-submit-btn" className="flex-1">
            {id ? 'Update Business' : 'Create Business'}
          </Button>
        </div>
      </div>
    </form>
  );
}
