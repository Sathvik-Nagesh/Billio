import React, { useState } from 'react';
import {
  Building2, Receipt, BookOpen, Sparkles, ArrowRight, ArrowLeft,
  CheckCircle2, Check, Smartphone, Printer, Keyboard, Upload, Edit3, X, Image as ImageIcon
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { businessRepository } from '@/lib/db/repositories/businessRepository';
import { bookRepository } from '@/lib/db/repositories/bookRepository';
import { Button, Card } from '@/components/ui';
import { SignatureEditorModal } from '@/components/common/SignatureEditorModal';
import { formatPhoneDisplay } from '@/lib/utils/phone';
import { TEMPLATE_LIST } from '@/templates';
import { toast } from 'sonner';

const SAMPLE_BOOKS = [
  { name: 'Kanooru Heggadithi (ಕಾನೂರು ಹೆಗ್ಗಡಿತಿ)', author: 'Kuvempu (ಕುವೆಂಪು)', isbn: '978-81-7001-001-2', price: 350 },
  { name: 'Mookajjiya Kanasugalu (ಮೂಕಜ್ಜಿಯ ಕನಸುಗಳು)', author: 'K. Shivaram Karanth (ಶಿವರಾಮ ಕಾರಂತ)', isbn: '978-81-7001-002-9', price: 280 },
  { name: 'Chidambara Rahasya (ಚಿದಂಬರ ರಹಸ್ಯ)', author: 'Poornachandra Tejaswi (ಪೂರ್ಣಚಂದ್ರ ತೇಜಸ್ವಿ)', isbn: '978-81-7001-003-6', price: 220 },
  { name: 'Karvalo (ಕರ್ವಾಲೋ)', author: 'Poornachandra Tejaswi (ಪೂರ್ಣಚಂದ್ರ ತೇಜಸ್ವಿ)', isbn: '978-81-7001-004-3', price: 160 },
  { name: 'Parva (ಪರ್ವ)', author: 'S. L. Bhyrappa (ಎಸ್. ಎಲ್. ಭೈರಪ್ಪ)', isbn: '978-81-7001-005-0', price: 450 },
  { name: 'Vamshavruksha (ವಂಶವೃಕ್ಷ)', author: 'S. L. Bhyrappa (ಎಸ್. ಎಲ್. ಭೈರಪ್ಪ)', isbn: '978-81-7001-006-7', price: 320 },
  { name: 'Malgudi Days', author: 'R. K. Narayan', isbn: '978-81-7001-007-4', price: 250 },
  { name: 'Wings of Fire', author: 'Dr. A. P. J. Abdul Kalam', isbn: '978-81-7001-008-1', price: 395 },
];

const ACCENT_COLORS = [
  { name: 'Indigo Purple', hex: '#6366f1' },
  { name: 'Emerald Green', hex: '#10b981' },
  { name: 'Classic Blue', hex: '#3b82f6' },
  { name: 'Warm Amber', hex: '#f59e0b' },
  { name: 'Rose Red', hex: '#f43f5e' },
];

export function InteractiveOnboarding() {
  const { user, setOnboardingCompleted } = useAuthStore();
  const { load, setActiveBusiness } = useBusinessStore();

  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Step 1: Store & Logo
  const [businessName, setBusinessName] = useState(user?.name ? `${user.name}'s Publications` : 'Sri Rama Publications');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [email, setEmail] = useState(user?.email || 'contact@publications.com');
  const [address, setAddress] = useState('Gandhi Bazaar, Basavanagudi, Bengaluru, Karnataka 560004');
  const [gstin, setGstin] = useState('');
  const [upiId, setUpiId] = useState('');
  const [logoPath, setLogoPath] = useState('');
  const [accentColor, setAccentColor] = useState('#6366f1');

  // Step 2: Signature & Seal
  const [signaturePath, setSignaturePath] = useState('');
  const [sealPath, setSealPath] = useState('');
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isSealModalOpen, setIsSealModalOpen] = useState(false);

  // Step 3: Invoicing Preferences
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [defaultTemplate, setDefaultTemplate] = useState('minimal-modern');
  const [primaryLanguage, setPrimaryLanguage] = useState<'en' | 'kn' | 'bilingual'>('bilingual');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'credit'>('cash');

  // Step 4: Starter Catalog
  const [loadSampleCatalog, setLoadSampleCatalog] = useState(true);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { optimizeImage } = await import('@/lib/utils/imageOptimizer');
      const optimized = await optimizeImage(file, { maxWidth: 400, maxHeight: 400, quality: 0.88, preserveTransparency: true });
      setLogoPath(optimized);
    } catch {
      const reader = new FileReader();
      reader.onload = (ev) => setLogoPath(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFinish = () => {
    const existing = businessRepository.getAll();
    let bizId: string;

    const payload = {
      name: businessName.trim() || 'My Publications',
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      gstin: gstin.trim() || undefined,
      upiId: upiId.trim() || undefined,
      logoPath: logoPath || undefined,
      signaturePath: signaturePath || undefined,
      sealPath: sealPath || undefined,
      accentColor,
      invoicePrefix: invoicePrefix.trim() || 'INV',
      invoiceYearFormat: 'YYYY' as const,
      invoiceSeparator: '-',
      invoicePadding: 3,
      invoiceStartNumber: 1,
      templateId: defaultTemplate,
      isDefault: true,
    };

    if (existing.length > 0) {
      bizId = existing[0].id;
      businessRepository.update(bizId, payload);
    } else {
      const created = businessRepository.create(payload);
      bizId = created.id;
    }

    if (loadSampleCatalog) {
      const currentBooks = bookRepository.getAll();
      if (currentBooks.length === 0) {
        bookRepository.upsertMany(
          SAMPLE_BOOKS.map(b => ({
            name: b.name,
            author: b.author,
            unitPrice: b.price,
          }))
        );
      }
    }

    load();
    setActiveBusiness(bizId);
    setOnboardingCompleted(true);
    toast.success('Your business is set up and ready for instant billing!');
  };

  return (
    <div className="min-h-screen w-full bg-[var(--color-surface-secondary)] flex flex-col justify-between p-3 sm:p-6 relative overflow-x-hidden">
      {/* Glow backgrounds */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[var(--color-primary)]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="w-full max-w-3xl mx-auto z-10 pt-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-700)] flex items-center justify-center text-white shadow-md">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg text-[var(--color-text-primary)] font-display">
                Quick Store Setup
              </h2>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                Step {step} of {totalSteps}
              </p>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'w-7 bg-[var(--color-primary)]'
                    : s < step
                    ? 'w-3.5 bg-emerald-500'
                    : 'w-3.5 bg-[var(--color-border)]'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Center Wizard Container */}
      <div className="w-full max-w-3xl mx-auto my-auto z-10 py-2">
        <Card className="p-4 sm:p-7 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl rounded-3xl min-h-[460px] flex flex-col justify-between">
          {/* STEP 1: Business Identity & Logo */}
          {step === 1 && (
            <div className="animate-fade-in space-y-4">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)]">
                  Store / Publisher Details & Logo
                </h1>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  This will be shown on all printed and digital WhatsApp bills.
                </p>
              </div>

              {/* Logo Upload Box */}
              <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
                <div className="relative w-16 h-16 rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center overflow-hidden flex-shrink-0">
                  {logoPath ? (
                    <>
                      <img src={logoPath} alt="Store Logo" className="w-full h-full object-contain p-1" />
                      <button
                        type="button"
                        onClick={() => setLogoPath('')}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow"
                      >
                        <X size={10} />
                      </button>
                    </>
                  ) : (
                    <ImageIcon size={22} className="text-[var(--color-text-muted)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-[var(--color-text-primary)]">Store Logo</div>
                  <div className="text-[11px] text-[var(--color-text-muted)] mb-1.5 truncate">
                    PNG / JPG format (printed on header)
                  </div>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-primary)] cursor-pointer shadow-2xs">
                    <Upload size={12} />
                    <span>{logoPath ? 'Change Logo' : 'Upload Logo'}</span>
                    <input type="file" accept="image/*" className="sr-only" onChange={handleLogoUpload} />
                  </label>
                </div>
              </div>

              {/* Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                    Business / Publication Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    placeholder="Sri Rama Publications"
                    className="w-full h-10 px-3 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                    Phone / WhatsApp Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={e => setPhone(formatPhoneDisplay(e.target.value))}
                    placeholder="+91 98765 43210"
                    className="w-full h-10 px-3 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                    UPI ID (for auto-generated QR code)
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    placeholder="yourstore@okhdfcbank"
                    className="w-full h-10 px-3 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                    GSTIN (Optional)
                  </label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={e => setGstin(e.target.value.toUpperCase())}
                    placeholder="29AAAAA0000A1Z5"
                    className="w-full h-10 px-3 text-sm font-mono uppercase rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                    Store Address / Fair Stall Location
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="City, State or Stall # at Book Fair"
                    className="w-full h-10 px-3 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Signature & Stamp with Smart Contrast */}
          {step === 2 && (
            <div className="animate-fade-in space-y-4">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)]">
                  Authorized Signature & Stamp
                </h1>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Sign directly on screen with your finger or upload a photo of your paper signature with smart auto-contrast.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Signature Box */}
                <div className="p-4 rounded-2xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-[var(--color-text-primary)]">Authorized Signature</span>
                      {signaturePath && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                          ✓ Ready
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      Draw with finger or upload a photo with auto background removal.
                    </p>
                  </div>

                  <div className="h-28 rounded-xl border border-[var(--color-border)] bg-white flex items-center justify-center p-2 relative overflow-hidden">
                    {signaturePath ? (
                      <>
                        <img src={signaturePath} alt="Signature" className="max-h-full max-w-full object-contain" />
                        <button
                          type="button"
                          onClick={() => setSignaturePath('')}
                          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow"
                        >
                          <X size={10} />
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400 font-medium">No signature configured</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsSignatureModalOpen(true)}
                    className="w-full h-9 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-bold text-[var(--color-primary)] hover:border-[var(--color-primary)] flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Edit3 size={13} />
                    <span>{signaturePath ? 'Edit Signature & Contrast' : 'Draw or Upload Signature'}</span>
                  </button>
                </div>

                {/* Company Seal Box */}
                <div className="p-4 rounded-2xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-[var(--color-text-primary)]">Official Stamp / Seal (Optional)</span>
                      {sealPath && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                          ✓ Ready
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      Upload photo of your rubber stamp seal.
                    </p>
                  </div>

                  <div className="h-28 rounded-xl border border-[var(--color-border)] bg-white flex items-center justify-center p-2 relative overflow-hidden">
                    {sealPath ? (
                      <>
                        <img src={sealPath} alt="Seal" className="max-h-full max-w-full object-contain" />
                        <button
                          type="button"
                          onClick={() => setSealPath('')}
                          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow"
                        >
                          <X size={10} />
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400 font-medium">Optional company seal</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsSealModalOpen(true)}
                    className="w-full h-9 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Upload size={13} />
                    <span>{sealPath ? 'Edit Stamp' : 'Upload Stamp Photo'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Invoice Theme & Language (Vyapar Style) */}
          {step === 3 && (
            <div className="animate-fade-in space-y-4">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)]">
                  Billing Theme & Language
                </h1>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Select your invoice format and brand color scheme.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                    Invoice Prefix
                  </label>
                  <input
                    type="text"
                    value={invoicePrefix}
                    onChange={e => setInvoicePrefix(e.target.value)}
                    placeholder="INV-"
                    className="w-full h-10 px-3 text-sm font-mono rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                  <span className="text-[11px] text-[var(--color-text-muted)] mt-1 block">
                    Format: {invoicePrefix}2026-001
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                    Default Payment Mode
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'cash', label: '💵 Cash' },
                      { id: 'upi', label: '📱 UPI' },
                      { id: 'credit', label: '⏳ Credit' },
                    ].map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPaymentMode(p.id as any)}
                        className={`h-10 rounded-xl text-xs font-bold border transition-all ${
                          paymentMode === p.id
                            ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-xs'
                            : 'bg-[var(--color-surface-secondary)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">
                    Brand Accent Color
                  </label>
                  <div className="flex items-center gap-2.5">
                    {ACCENT_COLORS.map(c => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setAccentColor(c.hex)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                          accentColor === c.hex ? 'ring-2 ring-offset-2 ring-[var(--color-primary)] scale-110' : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      >
                        {accentColor === c.hex && <Check size={16} className="text-white drop-shadow" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                    Invoice Template
                  </label>
                  <select
                    value={defaultTemplate}
                    onChange={e => setDefaultTemplate(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    {TEMPLATE_LIST.map(t => (
                      <option key={t.id} value={t.id}>{t.name} — {t.description}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Starter Catalog & Quick Launch */}
          {step === 4 && (
            <div className="animate-fade-in space-y-4">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)]">
                  Starter Catalog & Ready to Bill!
                </h1>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Pre-load popular bestseller titles for instant autocompletion.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => setLoadSampleCatalog(true)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    loadSampleCatalog
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-50)]/40 dark:bg-[var(--color-primary-950)]/40 shadow-xs'
                      : 'border-[var(--color-border)] bg-[var(--color-surface-secondary)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <BookOpen size={20} className="text-[var(--color-primary)]" />
                    {loadSampleCatalog && <CheckCircle2 size={16} className="text-[var(--color-primary)]" />}
                  </div>
                  <div className="font-bold text-xs sm:text-sm text-[var(--color-text-primary)]">
                    Load Bestseller Catalog (Recommended)
                  </div>
                  <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                    Pre-loads 8 classic titles with ISBNs & prices for instant fast billing.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setLoadSampleCatalog(false)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    !loadSampleCatalog
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-50)]/40 dark:bg-[var(--color-primary-950)]/40 shadow-xs'
                      : 'border-[var(--color-border)] bg-[var(--color-surface-secondary)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <Building2 size={20} className="text-[var(--color-text-secondary)]" />
                    {!loadSampleCatalog && <CheckCircle2 size={16} className="text-[var(--color-primary)]" />}
                  </div>
                  <div className="font-bold text-xs sm:text-sm text-[var(--color-text-primary)]">
                    Start Empty Catalog
                  </div>
                  <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                    You can type books directly or import CSV catalog later.
                  </div>
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-3">
                <Sparkles size={20} className="text-emerald-600 flex-shrink-0" />
                <div className="text-xs text-emerald-950 dark:text-emerald-200">
                  <strong className="font-bold">Auto-Seeding Active:</strong> Whenever you type or scan any new book during billing, it will automatically save into your database!
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-5 border-t border-[var(--color-border)] mt-4">
            {step > 1 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep(prev => prev - 1)}
                className="gap-1.5"
              >
                <ArrowLeft size={14} /> Back
              </Button>
            ) : <div />}

            {step < totalSteps ? (
              <Button
                size="sm"
                onClick={() => setStep(prev => prev + 1)}
                className="gap-1.5 font-bold shadow-md shadow-[var(--color-primary)]/20"
              >
                Continue <ArrowRight size={14} />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleFinish}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20"
              >
                <CheckCircle2 size={14} /> Finish & Start Billing
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Signature Editor Modal */}
      <SignatureEditorModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={(dataUrl) => setSignaturePath(dataUrl)}
        initialValue={signaturePath}
        title="Signature Studio"
      />

      {/* Seal Editor Modal */}
      <SignatureEditorModal
        isOpen={isSealModalOpen}
        onClose={() => setIsSealModalOpen(false)}
        onSave={(dataUrl) => setSealPath(dataUrl)}
        initialValue={sealPath}
        title="Official Stamp Studio"
      />

      {/* Footer */}
      <div className="text-center text-[11px] text-[var(--color-text-muted)] z-10 py-1">
        You can always update store profile and signatures in Settings.
      </div>
    </div>
  );
}
