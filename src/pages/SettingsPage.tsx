import React from 'react';
import { Moon, Sun, Keyboard, Info, Calendar, Printer } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Switch, Separator, Button } from '@/components/ui';
import { useThemeStore } from '@/stores/useThemeStore';
import { useAppSettingsStore } from '@/stores/useAppSettingsStore';
import { DATE_FORMAT_OPTIONS } from '@/lib/utils/dateFormat';
import { createBackup, parseBackup, restoreBackup } from '@/lib/backup';
import type { RestorePreview } from '@/lib/backup';
import { updater } from '@/lib/updater';
import { Download, Upload, AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const SHORTCUTS = [
  { key: 'Ctrl + N', action: 'New Invoice' },
  { key: 'Ctrl + S', action: 'Save & Download PDF' },
  { key: 'Ctrl + P', action: 'Print Invoice' },
];

const SELECT_CLS = "h-9 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all";

export function SettingsPage() {
  const { mode, toggleMode } = useThemeStore();
  const { dateFormat, setDateFormat, documentLabel, setDocumentLabel } = useAppSettingsStore();
  
  // Backup state
  const [isRestoreOpen, setIsRestoreOpen] = React.useState(false);
  const [restorePreview, setRestorePreview] = React.useState<RestorePreview | null>(null);
  const [restoreData, setRestoreData] = React.useState<{db: any, settings: any} | null>(null);
  const [autoBackupFirst, setAutoBackupFirst] = React.useState(true);
  
  // Updater state
  const [updateStatus, setUpdateStatus] = React.useState<string>('idle');
  const [updateInfo, setUpdateInfo] = React.useState<any>(null);
  const [updateProgress, setUpdateProgress] = React.useState<number>(0);
  const [appVersion, setAppVersion] = React.useState<string>('1.1.0');

  React.useEffect(() => {
    updater.getVersion().then(setAppVersion);
    
    const unsubs = [
      updater.on('updater:checking', () => setUpdateStatus('checking')),
      updater.on('updater:available', (info) => {
        setUpdateStatus('available');
        setUpdateInfo(info);
      }),
      updater.on('updater:not-available', () => setUpdateStatus('up-to-date')),
      updater.on('updater:progress', (prog: any) => {
        setUpdateStatus('downloading');
        setUpdateProgress(prog.percent);
      }),
      updater.on('updater:downloaded', () => setUpdateStatus('downloaded')),
      updater.on('updater:error', (err) => {
        setUpdateStatus('error');
        toast.error(`Updater error: ${err}`);
      })
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  const handleBackup = async () => {
    toast.loading('Creating backup...', { id: 'backup' });
    const res = await createBackup();
    if (res.success) {
      toast.success(`Backup saved successfully`, { id: 'backup' });
    } else {
      toast.error(res.error, { id: 'backup' });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    toast.loading('Validating backup...', { id: 'restore' });
    const res = await parseBackup(file);
    if (res.success) {
      toast.dismiss('restore');
      setRestorePreview(res.preview);
      setRestoreData({ db: res.dbData, settings: res.settings });
      setIsRestoreOpen(true);
    } else {
      toast.error(res.error, { id: 'restore' });
    }
    e.target.value = '';
  };

  const handleRestore = async () => {
    if (!restoreData) return;
    setIsRestoreOpen(false);
    toast.loading('Restoring data...', { id: 'restore' });
    const res = await restoreBackup(restoreData.db, restoreData.settings, autoBackupFirst);
    if (!res.success) {
      toast.error(res.error, { id: 'restore' });
    }
    // Success will reload the window automatically
  };

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
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                Document Label
              </label>
              <select
                id="settings-document-label"
                value={documentLabel}
                onChange={(e) => setDocumentLabel(e.target.value as 'invoice' | 'bill')}
                className={SELECT_CLS}
              >
                <option value="invoice">Invoice</option>
                <option value="bill">Bill</option>
              </select>
              <p className="text-xs text-[var(--color-text-muted)] mt-1.5">
                Choose whether your generated PDFs are titled "Invoice" or "Bill".
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

        {/* Data & Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Download size={14} />Data & Backup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[var(--color-text-primary)]">Create Backup</div>
                <div className="text-xs text-[var(--color-text-muted)]">Save all your invoices, businesses, and settings to a ZIP file.</div>
              </div>
              <Button onClick={handleBackup} size="sm" variant="outline" className="gap-2">
                <Download size={14} /> Backup
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[var(--color-text-primary)]">Restore Backup</div>
                <div className="text-xs text-[var(--color-text-muted)]">Restore your data from a previous backup file.</div>
              </div>
              <div className="relative">
                <input type="file" id="restore-file" accept=".zip" className="hidden" onChange={handleFileSelect} />
                <Button size="sm" variant="outline" className="gap-2" onClick={() => document.getElementById('restore-file')?.click()}>
                  <Upload size={14} /> Restore
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Updates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><RefreshCw size={14} />App Updates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[var(--color-text-primary)]">Current Version</div>
                <div className="text-xs text-[var(--color-text-muted)]">v{appVersion}</div>
              </div>
              
              {updateStatus === 'idle' || updateStatus === 'error' ? (
                <Button onClick={() => updater.checkForUpdates()} size="sm" variant="outline" className="gap-2">
                  <RefreshCw size={14} /> Check for Updates
                </Button>
              ) : updateStatus === 'checking' ? (
                <Button disabled size="sm" variant="outline" className="gap-2">
                  <RefreshCw size={14} className="animate-spin" /> Checking...
                </Button>
              ) : updateStatus === 'up-to-date' ? (
                <div className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={14} /> Up to date
                </div>
              ) : updateStatus === 'available' ? (
                <Button onClick={() => updater.downloadUpdate()} size="sm" variant="default" className="gap-2">
                  <Download size={14} /> Download Update
                </Button>
              ) : updateStatus === 'downloading' ? (
                <div className="flex items-center gap-2 w-32">
                  <div className="h-1.5 flex-1 bg-[var(--color-surface-tertiary)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--color-primary)] transition-all duration-300" style={{ width: `${updateProgress}%` }} />
                  </div>
                  <span className="text-xs font-mono">{Math.round(updateProgress)}%</span>
                </div>
              ) : updateStatus === 'downloaded' ? (
                <Button onClick={() => updater.installUpdate()} size="sm" variant="default" className="bg-emerald-600 hover:bg-emerald-700">
                  Restart & Install
                </Button>
              ) : null}
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
              <div className="flex justify-between"><span>Version</span><span className="font-medium">{appVersion}</span></div>
              <div className="flex justify-between"><span>Storage</span><span className="font-medium">Local (offline-first)</span></div>
              <div className="flex justify-between"><span>GST Mode</span><span className="font-medium">Display only (books exempt)</span></div>
              <div className="flex justify-between"><span>Languages</span><span className="font-medium">English + Kannada</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Restore Confirmation Modal */}
      {isRestoreOpen && restorePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
          <div className="bg-[var(--color-surface)] rounded-xl shadow-xl w-full max-w-md p-6 m-4">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2 mb-4">
              <AlertTriangle className="text-amber-500" />
              Restore Backup
            </h3>
            
            <div className="space-y-3 mb-6">
              <p className="text-sm text-[var(--color-text-secondary)]">
                You are about to restore a backup created on <strong className="text-[var(--color-text-primary)]">{new Date(restorePreview.createdAt).toLocaleString()}</strong>.
              </p>
              
              <div className="bg-[var(--color-surface-secondary)] p-3 rounded-lg border border-[var(--color-border)] grid grid-cols-2 gap-2 text-sm">
                <div>Businesses: <strong>{restorePreview.businessCount}</strong></div>
                <div>Invoices: <strong>{restorePreview.invoiceCount}</strong></div>
                <div>Customers: <strong>{restorePreview.customerCount}</strong></div>
                <div>Books: <strong>{restorePreview.bookCount}</strong></div>
              </div>
              
              <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-200 dark:border-red-900 text-sm text-red-800 dark:text-red-400">
                <strong>Warning:</strong> This will completely overwrite all your current data. This action cannot be undone.
              </div>

              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={autoBackupFirst} 
                  onChange={(e) => setAutoBackupFirst(e.target.checked)} 
                  className="rounded border-gray-300" 
                />
                <span className="text-sm font-medium">Create an automatic backup before restoring</span>
              </label>
            </div>
            
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setIsRestoreOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleRestore}>Confirm Restore</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
