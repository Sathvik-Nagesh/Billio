import React, { useState } from 'react';
import {
  Zap, Building2, Receipt, BookOpen, Sparkles, ArrowRight, ArrowLeft,
  CheckCircle2, Check, Smartphone, Printer, QrCode, Keyboard, FileText
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { businessRepository } from '@/lib/db/repositories/businessRepository';
import { bookRepository } from '@/lib/db/repositories/bookRepository';
import { Button, Card } from '@/components/ui';
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
  { name: 'Classic Blue', hex: '#3b82f6' },
  { name: 'Emerald Green', hex: '#10b981' },
  { name: 'Indigo Purple', hex: '#6366f1' },
  { name: 'Warm Amber', hex: '#f59e0b' },
  { name: 'Rose Red', hex: '#f43f5e' },
];

export function InteractiveOnboarding() {
  const { user, setOnboardingCompleted } = useAuthStore();
  const { load, setActiveBusiness } = useBusinessStore();

  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Step 1: Store Info
  const [businessName, setBusinessName] = useState(user?.name ? `${user.name}'s Publications` : 'Sri Rama Publications');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [email, setEmail] = useState(user?.email || 'contact@publications.com');
  const [address, setAddress] = useState('Gandhi Bazaar, Basavanagudi, Bengaluru, Karnataka 560004');
  const [gstin, setGstin] = useState('');
  const [accentColor, setAccentColor] = useState('#3b82f6');

  // Step 2: Invoice Defaults
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [defaultTemplate, setDefaultTemplate] = useState('minimal-modern');
  const [primaryLanguage, setPrimaryLanguage] = useState<'en' | 'kn' | 'bilingual'>('bilingual');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'credit'>('cash');

  // Step 3: Catalog Import
  const [loadSampleCatalog, setLoadSampleCatalog] = useState(true);

  const handleFinish = () => {
    // 1. Create or update default business profile
    const existing = businessRepository.getAll();
    let bizId: string;

    if (existing.length > 0) {
      bizId = existing[0].id;
      businessRepository.update(bizId, {
        name: businessName.trim() || 'My Publications',
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        gstin: gstin.trim() || undefined,
        accentColor,
        invoicePrefix: invoicePrefix.trim() || 'INV',
        templateId: defaultTemplate,
        isDefault: true,
      });
    } else {
      const created = businessRepository.create({
        name: businessName.trim() || 'My Publications',
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        gstin: gstin.trim() || undefined,
        accentColor,
        invoicePrefix: invoicePrefix.trim() || 'INV',
        invoiceYearFormat: 'YYYY',
        invoiceSeparator: '-',
        invoicePadding: 3,
        invoiceStartNumber: 1,
        templateId: defaultTemplate,
        isDefault: true,
      });
      bizId = created.id;
    }

    // 2. Pre-populate sample catalog if selected
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

    // 3. Reload store state and mark complete
    load();
    setActiveBusiness(bizId);
    setOnboardingCompleted(true);
    toast.success('Your store is ready for high-speed billing!');
  };

  return (
    <div className="min-h-screen w-full bg-[var(--color-surface-secondary)] flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--color-primary-500)]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Step Indicator */}
      <div className="w-full max-w-4xl mx-auto z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-primary-700)] flex items-center justify-center shadow-md">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-[var(--color-text-primary)] font-display">
                Welcome to Billio
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Step {step} of {totalSteps}
              </p>
            </div>
          </div>

          {/* Step Progress Bar */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'w-8 bg-[var(--color-primary)]'
                    : s < step
                    ? 'w-4 bg-emerald-500'
                    : 'w-4 bg-[var(--color-border)]'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Center Wizard Container */}
      <div className="w-full max-w-4xl mx-auto my-auto z-10 py-4">
        <Card className="p-6 sm:p-8 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl rounded-3xl min-h-[480px] flex flex-col justify-between">
          {/* STEP 1: Store & Business Identity */}
          {step === 1 && (
            <div className="animate-fade-in space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">
                  Let's set up your Publisher / Store Identity
                </h1>
                <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
                  This information will be printed on all your invoices, thermal receipts, and reports.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">
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
                  <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">
                    GSTIN / Tax ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={e => setGstin(e.target.value.toUpperCase())}
                    placeholder="29AAAAA0000A1Z5 (or leave empty)"
                    className="w-full h-10 px-3 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">
                    Official Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full h-10 px-3 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">
                    Store Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="sales@publications.com"
                    className="w-full h-10 px-3 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">
                    Address / Fair Stall Location
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Stall #14, National Book Fair, Bengaluru"
                    className="w-full h-10 px-3 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-2">
                    Brand Accent Color
                  </label>
                  <div className="flex items-center gap-3">
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
              </div>
            </div>
          )}

          {/* STEP 2: Invoicing & Billing Preferences */}
          {step === 2 && (
            <div className="animate-fade-in space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">
                  Invoicing & Fair POS Preferences
                </h1>
                <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
                  Configure sequence prefixes, receipt languages, and default invoice themes.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">
                    Invoice Number Prefix
                  </label>
                  <input
                    type="text"
                    value={invoicePrefix}
                    onChange={e => setInvoicePrefix(e.target.value)}
                    placeholder="INV-2025/"
                    className="w-full h-10 px-3 text-sm font-mono rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                  <span className="text-[11px] text-[var(--color-text-muted)] mt-1 block">
                    Example: {invoicePrefix}001
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">
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
                        className={`h-10 rounded-xl text-xs font-semibold border transition-all ${
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

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">
                    Receipt Language
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'bilingual', label: 'English + ಕನ್ನಡ' },
                      { id: 'kn', label: 'ಕನ್ನಡ ಮಾತ್ರ' },
                      { id: 'en', label: 'English Only' },
                    ].map(l => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setPrimaryLanguage(l.id as any)}
                        className={`h-10 rounded-xl text-xs font-medium border transition-all ${
                          primaryLanguage === l.id
                            ? 'bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)] border-[var(--color-primary)] text-[var(--color-primary)] font-bold'
                            : 'bg-[var(--color-surface-secondary)] border-[var(--color-border)] text-[var(--color-text-secondary)]'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">
                    Default Template Theme
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

          {/* STEP 3: Book Catalog Setup */}
          {step === 3 && (
            <div className="animate-fade-in space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">
                  Instant Product / Book Catalog
                </h1>
                <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
                  Speed-billing is fastest when item names, authors, and prices autocomplete as you type or scan barcodes.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setLoadSampleCatalog(true)}
                  className={`p-5 rounded-2xl border text-left transition-all relative ${
                    loadSampleCatalog
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-50)]/40 dark:bg-[var(--color-primary-950)]/40 shadow-sm'
                      : 'border-[var(--color-border)] bg-[var(--color-surface-secondary)] hover:border-[var(--color-border-hover)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <BookOpen size={24} className="text-[var(--color-primary)]" />
                    {loadSampleCatalog && <CheckCircle2 size={18} className="text-[var(--color-primary)]" />}
                  </div>
                  <div className="font-bold text-sm text-[var(--color-text-primary)]">
                    Load Starter Bestsellers (Recommended)
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] mt-1">
                    Pre-loads 8 classic Kannada & English books with ISBNs, titles, authors, and prices.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setLoadSampleCatalog(false)}
                  className={`p-5 rounded-2xl border text-left transition-all relative ${
                    !loadSampleCatalog
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-50)]/40 dark:bg-[var(--color-primary-950)]/40 shadow-sm'
                      : 'border-[var(--color-border)] bg-[var(--color-surface-secondary)] hover:border-[var(--color-border-hover)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Building2 size={24} className="text-[var(--color-text-secondary)]" />
                    {!loadSampleCatalog && <CheckCircle2 size={18} className="text-[var(--color-primary)]" />}
                  </div>
                  <div className="font-bold text-sm text-[var(--color-text-primary)]">
                    Start with Empty Catalog
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] mt-1">
                    Import your own custom CSV catalog later in the Book Catalog page.
                  </div>
                </button>
              </div>

              {loadSampleCatalog && (
                <div className="p-4 rounded-2xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] max-h-40 overflow-y-auto space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                    Sample Books Included:
                  </div>
                  {SAMPLE_BOOKS.map(b => (
                    <div key={b.isbn} className="flex items-center justify-between text-xs py-1 border-b border-[var(--color-border)] last:border-0">
                      <span className="font-medium text-[var(--color-text-primary)] truncate max-w-[280px]">{b.name}</span>
                      <span className="text-[var(--color-text-muted)] shrink-0">₹{b.price}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Interactive Feature Tour */}
          {step === 4 && (
            <div className="animate-fade-in space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">
                  Speed-Billing Pro Tips
                </h1>
                <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
                  Master these key features to create invoices in under 5 seconds during busy fair rushes.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shrink-0">
                    <Keyboard size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                      Alt+N <span className="text-xs text-[var(--color-text-muted)] font-normal">New Invoice</span>
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      Jump straight into a clean billing form with instant barcode/title autocompletion.
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Receipt size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                      Alt+T <span className="text-xs text-[var(--color-text-muted)] font-normal">Daily Fair Tally</span>
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      Reconcile cash drawer, UPI transactions, and total titles sold at day end with 1 click.
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 shrink-0">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[var(--color-text-primary)]">
                      1-Click WhatsApp Share
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      Send itemized receipts directly to customer WhatsApp without printing paper.
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 shrink-0">
                    <Printer size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[var(--color-text-primary)]">
                      Offline-First & Cloud Sync
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      Works completely offline during fair ground power/network cuts; syncs when online.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-[var(--color-border)] mt-6">
            {step > 1 ? (
              <Button
                variant="outline"
                onClick={() => setStep(prev => prev - 1)}
                className="gap-2"
              >
                <ArrowLeft size={16} /> Back
              </Button>
            ) : <div />}

            {step < totalSteps ? (
              <Button
                onClick={() => setStep(prev => prev + 1)}
                className="gap-2 shadow-md shadow-[var(--color-primary)]/20"
              >
                Continue <ArrowRight size={16} />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
              >
                <CheckCircle2 size={16} /> Finish Setup & Launch
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-[var(--color-text-muted)] z-10">
        You can always customize these preferences later in Settings.
      </div>
    </div>
  );
}
