import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Pencil, Trash2, Star, CheckCircle } from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';
import { useBusinessStore } from '@/stores/useBusinessStore';

export function BusinessProfilesPage() {
  const navigate = useNavigate();
  const { businesses, activeBusiness, load, deleteBusiness, updateBusiness } = useBusinessStore();

  useEffect(() => { load(); }, []);

  const handleSetDefault = (id: string) => {
    updateBusiness(id, { isDefault: true });
  };

  return (
    <div className="h-full overflow-y-auto p-3 sm:p-6 animate-fade-in pb-20">
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)]">Business Profiles</h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-0.5">{businesses.length} business{businesses.length !== 1 ? 'es' : ''} set up</p>
        </div>
        <Button id="new-business-btn" size="sm" onClick={() => navigate('/businesses/new')} className="gap-1.5 font-bold h-9">
          <Plus size={15} /> <span className="hidden sm:inline">Add Business</span><span className="sm:hidden">Add</span>
        </Button>
      </div>

      {businesses.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center rounded-2xl">
          <Building2 size={44} className="mx-auto mb-4 text-[var(--color-text-muted)]" strokeWidth={1} />
          <div className="text-base font-semibold text-[var(--color-text-primary)] mb-1">No businesses yet</div>
          <div className="text-xs sm:text-sm text-[var(--color-text-muted)] mb-6">Add your first business profile to start creating invoices</div>
          <Button id="add-first-business-btn" onClick={() => navigate('/businesses/new')}>
            <Plus size={14} /> Add Business
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {businesses.map(biz => (
            <Card key={biz.id} className={`p-4 sm:p-5 rounded-2xl transition-all hover:shadow-md ${activeBusiness?.id === biz.id ? 'ring-2 ring-[var(--color-primary)]' : ''}`}>
              <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  {biz.logoPath ? (
                    <img src={biz.logoPath} alt="logo" className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-contain bg-gray-50 border border-[var(--color-border)] flex-shrink-0" />
                  ) : (
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${biz.accentColor ?? '#6366F1'}20` }}>
                      <Building2 size={20} style={{ color: biz.accentColor ?? '#6366F1' }} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-sm sm:text-base text-[var(--color-text-primary)] truncate">{biz.name}</div>
                    {biz.isDefault && <Badge variant="success" className="text-[10px] sm:text-xs mt-0.5">Default Profile</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!biz.isDefault && (
                    <button onClick={() => handleSetDefault(biz.id)} className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950 transition-all cursor-pointer" title="Set as default"><Star size={15} /></button>
                  )}
                  <button onClick={() => navigate(`/businesses/edit/${biz.id}`)} className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-50)] transition-all cursor-pointer" title="Edit"><Pencil size={15} /></button>
                  <button onClick={() => { if(confirm(`Delete "${biz.name}"?`)) deleteBusiness(biz.id); }} className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-all cursor-pointer" title="Delete"><Trash2 size={15} /></button>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-[var(--color-text-secondary)]">
                {biz.address && <div className="truncate">{biz.address}</div>}
                {biz.gstin && <div>GSTIN: <span className="font-medium">{biz.gstin}</span></div>}
                {biz.phone && <div>{biz.phone}</div>}
                <div className="flex items-center gap-2 pt-1">
                  <div className="w-3.5 h-3.5 rounded-full border border-[var(--color-border)]" style={{ backgroundColor: biz.accentColor ?? '#6366F1' }} />
                  <span className="font-mono text-xs text-[var(--color-text-muted)]">Prefix: {biz.invoicePrefix || '(none)'}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
