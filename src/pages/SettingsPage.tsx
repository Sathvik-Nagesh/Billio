import React from 'react';
import { Moon, Sun, Keyboard, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Switch, Separator } from '@/components/ui';
import { useThemeStore } from '@/stores/useThemeStore';

const SHORTCUTS = [
  { key: 'Ctrl + N', action: 'New Invoice' },
  { key: 'Ctrl + S', action: 'Save & Download PDF' },
  { key: 'Ctrl + P', action: 'Print Invoice' },
];

export function SettingsPage() {
  const { mode, toggleMode } = useThemeStore();

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
              <div className="flex justify-between"><span>Version</span><span className="font-medium">1.0.0</span></div>
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
