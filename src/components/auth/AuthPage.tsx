import React, { useState } from 'react';
import { Zap, Mail, Lock, KeyRound, User, Building, ArrowRight, ShieldCheck, Moon, Sun, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { useTenant } from '@/contexts/TenantContext';
import { Button, Input, Card } from '@/components/ui';
import { toast } from 'sonner';

export function AuthPage() {
  const { login, signup, loginAsCashierPin, loginOffline } = useAuthStore();
  const { mode, toggleMode } = useThemeStore();
  const { branding } = useTenant();

  const [tab, setTab] = useState<'login' | 'signup' | 'pin'>('login');
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupBusiness, setSignupBusiness] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // PIN state
  const [pin, setPin] = useState('');
  const [cashierName, setCashierName] = useState('Counter 1');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!loginEmail.trim()) {
      setErrorMsg('Please enter your email or username');
      return;
    }
    setLoading(true);
    try {
      const res = await login(loginEmail, loginPassword);
      if (!res.success) {
        setErrorMsg(res.error || 'Login failed');
      } else {
        toast.success(`Welcome back, ${loginEmail.split('@')[0]}!`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!signupName.trim() || !signupEmail.trim() || !signupBusiness.trim()) {
      setErrorMsg('Please fill in your name, email, and business name');
      return;
    }
    setLoading(true);
    try {
      const res = await signup({
        name: signupName,
        email: signupEmail,
        businessName: signupBusiness,
        password: signupPassword,
      });
      if (!res.success) {
        setErrorMsg(res.error || 'Signup failed');
      } else {
        toast.success('Account created successfully! Let\'s setup your store.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (pin.length < 4) {
      setErrorMsg('PIN must be at least 4 digits');
      return;
    }
    setLoading(true);
    try {
      const res = await loginAsCashierPin(pin, cashierName);
      if (!res.success) {
        setErrorMsg(res.error || 'Invalid PIN');
      } else {
        toast.success(`Logged in as ${cashierName}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOfflineEntry = () => {
    loginOffline();
    toast.success('Logged in as Offline Store Admin');
  };

  return (
    <div className="min-h-screen w-full bg-[var(--color-surface-secondary)] flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[var(--color-primary-500)]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Brand & Theme Toggle */}
      <div className="flex items-center justify-between w-full max-w-6xl mx-auto z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-primary-700)] flex items-center justify-center shadow-md shadow-[var(--color-primary-500)]/20">
            <Zap size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-bold text-lg text-[var(--color-text-primary)] font-display tracking-tight">
              {branding.brandName || 'Billio'}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-primary)] ml-2 px-2 py-0.5 rounded-full bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)]">
              Pro POS
            </span>
          </div>
        </div>

        <button
          onClick={toggleMode}
          className="h-9 w-9 rounded-xl flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)] shadow-xs transition-all cursor-pointer"
          title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {mode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>

      {/* Main Auth Box */}
      <div className="w-full max-w-md mx-auto my-auto z-10 py-6">
        <Card className="p-6 sm:p-8 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl rounded-3xl backdrop-blur-md">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
              {tab === 'login' && 'Sign in to your store'}
              {tab === 'signup' && 'Create your store account'}
              {tab === 'pin' && 'Quick Cashier PIN'}
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-1.5">
              {tab === 'login' && 'Enter your credentials to access invoices & reports'}
              {tab === 'signup' && 'Get started with fast POS billing and catalog management'}
              {tab === 'pin' && 'Instant access for counter staff and spot billing'}
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-3 p-1 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] mb-6 text-xs font-medium">
            <button
              onClick={() => { setTab('login'); setErrorMsg(''); }}
              className={`py-2 rounded-lg transition-all ${tab === 'login' ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] font-semibold shadow-xs' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}
            >
              Owner Login
            </button>
            <button
              onClick={() => { setTab('pin'); setErrorMsg(''); }}
              className={`py-2 rounded-lg transition-all ${tab === 'pin' ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] font-semibold shadow-xs' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}
            >
              Cashier PIN
            </button>
            <button
              onClick={() => { setTab('signup'); setErrorMsg(''); }}
              className={`py-2 rounded-lg transition-all ${tab === 'signup' ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] font-semibold shadow-xs' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-400 animate-fade-in">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Tab 1: Owner Login */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">
                  Email or Username
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    type="text"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@store.com"
                    className="w-full h-10 pl-9 pr-3 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">
                  Password (optional in local mode)
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 pl-9 pr-3 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl font-semibold mt-2 shadow-md shadow-[var(--color-primary)]/20"
              >
                {loading ? 'Signing in...' : 'Sign In'}
                <ArrowRight size={16} className="ml-1.5" />
              </Button>
            </form>
          )}

          {/* Tab 2: Fast Cashier PIN */}
          {tab === 'pin' && (
            <form onSubmit={handlePinLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">
                  Counter / Cashier Name
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    type="text"
                    value={cashierName}
                    onChange={(e) => setCashierName(e.target.value)}
                    placeholder="Counter 1 / Fair Stall"
                    className="w-full h-10 pl-9 pr-3 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">
                  4-Digit Security PIN
                </label>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    type="password"
                    maxLength={6}
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="1234"
                    className="w-full h-10 pl-9 pr-3 text-sm tracking-widest font-mono text-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
                  />
                </div>
              </div>

              {/* Quick Keypad */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✓'].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      if (k === 'C') setPin('');
                      else if (k === '✓') {
                        if (pin.length >= 4) handlePinLogin({ preventDefault: () => {} } as any);
                      } else if (pin.length < 6) {
                        setPin((prev) => prev + k);
                      }
                    }}
                    className="h-10 rounded-xl bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-tertiary)] border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-primary)] active:scale-95 transition-all"
                  >
                    {k}
                  </button>
                ))}
              </div>

              <Button
                type="submit"
                disabled={loading || pin.length < 4}
                className="w-full h-11 rounded-xl font-semibold mt-2"
              >
                {loading ? 'Verifying PIN...' : 'Start Billing'}
              </Button>
            </form>
          )}

          {/* Tab 3: Sign Up */}
          {tab === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                  Your Full Name
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    type="text"
                    required
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="Sathvik Nagesh"
                    className="w-full h-9 pl-9 pr-3 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                  Business / Store Name
                </label>
                <div className="relative">
                  <Building size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    type="text"
                    required
                    value={signupBusiness}
                    onChange={(e) => setSignupBusiness(e.target.value)}
                    placeholder="Sri Rama Publications"
                    className="w-full h-9 pl-9 pr-3 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="sathvik@publications.com"
                    className="w-full h-9 pl-9 pr-3 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full h-9 pl-9 pr-3 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 rounded-xl font-semibold mt-3 shadow-md shadow-[var(--color-primary)]/20"
              >
                {loading ? 'Creating Store...' : 'Create Account & Setup'}
              </Button>
            </form>
          )}

          {/* Divider & Offline Quick Entry */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--color-border)]" /></div>
            <span className="relative px-3 bg-[var(--color-surface)] text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Or Offline Demo
            </span>
          </div>

          <button
            onClick={handleOfflineEntry}
            className="w-full py-2.5 px-4 rounded-xl bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-tertiary)] border border-[var(--color-border)] flex items-center justify-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all cursor-pointer"
          >
            <ShieldCheck size={16} className="text-emerald-500" />
            Continue in Offline / Standalone Mode
          </button>
        </Card>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-[var(--color-text-muted)] z-10">
        Offline-first POS & Invoicing • Multi-Tenant Ready
      </div>
    </div>
  );
}
