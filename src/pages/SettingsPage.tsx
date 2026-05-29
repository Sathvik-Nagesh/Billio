import React from 'react';
import { Moon, Sun, Keyboard, Info, Calendar, Printer } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Switch, Separator } from '@/components/ui';
import { useThemeStore } from '@/stores/useThemeStore';
import { useAppSettingsStore } from '@/stores/useAppSettingsStore';
import { DATE_FORMAT_OPTIONS } from '@/lib/utils/dateFormat';

const SHORTCUTS = [
  { key: 'Ctrl + N', action: 'New Invoice' },
  { key: 'Ctrl + S', action: 'Save & Download PDF' },
  { key: 'Ctrl + P', action: 'Print Invoice' },
];

const SELECT_CLS = "h-9 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all";

export function SettingsPage() {
  const { mode, toggleMode } = useThemeStore();
  const { dateFormat, setDateFormat } = useAppSettingsStore();

  return (
    <div className="h-full overflow-y-auto p-6 animate-fade-in">
      <div className="max-w-lg mx-auto space-y-4">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-6">Settings</h2>

        {/* Appearance */}
        <Card>
          <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {mode === 'dark' ? <Moon size={18} className="text-[var(--color-primary)]" /> : <Sun size={18} className="text-amber-500" />}
                <div>
                  <div className="text-sm font-medium text-[var(--color-text-primary)]">Dark Mode</div>
                  <div className="text-xs text-[var(--color-text-muted)]">Toggle between light and dark theme</div>
                </div>
              </div>
              <Switch
                id="settings-dark-mode"
                checked={mode === 'dark'}
                onCheckedChange={(checked) => {
                  if ((checked && mode !== 'dark') || (!checked && mode === 'dark')) toggleMode();
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Date & Regional Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calendar size={14} />Date & Regional Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                Date Format
              </label>
              <select
                id="settings-date-format"
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                className={SELECT_CLS}
              >
                {DATE_FORMAT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="text-xs text-[var(--color-text-muted)] mt-1.5">
                Applies to invoice dates, due dates, history view, and PDF exports.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
              <div className="text-xs text-[var(--color-text-muted)] mb-1">Preview</div>
              <div className="text-sm font-semibold text-[var(--color-text-primary)]">
                {/* Show live preview of today in selected format */}
                {(() => {
                  const today = new Date().toISOString().split('T')[0];
                  const [yyyy, mm, dd] = today.split('-');
                  const yy = yyyy.slice(-2);
                  switch (dateFormat) {
                    case 'DD-MM-YYYY': return `${dd}-${mm}-${yyyy}`;
                    case 'DD-MM-YY':   return `${dd}-${mm}-${yy}`;
                    case 'DD/MM/YYYY': return `${dd}/${mm}/${yyyy}`;
                    case 'DD/MM/YY':   return `${dd}/${mm}/${yy}`;
                    case 'MM-DD-YYYY': return `${mm}-${dd}-${yyyy}`;
                    case 'MM/DD/YYYY': return `${mm}/${dd}/${yyyy}`;
                    case 'YYYY-MM-DD': return `${yyyy}-${mm}-${dd}`;
                    default: return `${dd}-${mm}-${yyyy}`;
                  }
                })()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Keyboard Shortcuts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Keyboard size={14} />Keyboard Shortcuts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {SHORTCUTS.map(s => (
                <div key={s.key} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-[var(--color-text-secondary)]">{s.action}</span>
                  <kbd className="px-2.5 py-1 rounded-md bg-[var(--color-surface-tertiary)] border border-[var(--color-border)] text-xs font-mono font-semibold text-[var(--color-text-primary)]">{s.key}</kbd>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Info size={14} />About Billio</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
              <div className="flex justify-between"><span>Version</span><span className="font-medium">1.1.0</span></div>
              <div className="flex justify-between"><span>Storage</span><span className="font-medium">Local (offline-first)</span></div>
              <div className="flex justify-between"><span>GST Mode</span><span className="font-medium">Display only (books exempt)</span></div>
              <div className="flex justify-between"><span>Languages</span><span className="font-medium">English + Kannada</span></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
