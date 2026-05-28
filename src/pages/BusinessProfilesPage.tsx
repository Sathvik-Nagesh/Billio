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
    <div className="h-full overflow-y-auto p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Business Profiles</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{businesses.length} business{businesses.length !== 1 ? 'es' : ''} set up</p>
        </div>
        <Button id="new-business-btn" onClick={() => navigate('/businesses/new')}>
          <Plus size={14} /> Add Business
        </Button>
      </div>

      {businesses.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 size={48} className="mx-auto mb-4 text-[var(--color-text-muted)]" strokeWidth={1} />
          <div className="text-base font-semibold text-[var(--color-text-primary)] mb-1">No businesses yet</div>
          <div className="text-sm text-[var(--color-text-muted)] mb-6">Add your first business profile to start creating invoices</div>
          <Button id="add-first-business-btn" onClick={() => navigate('/businesses/new')}>
            <Plus size={14} /> Add Business
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {businesses.map(biz => (
            <Card key={biz.id} className={`p-5 transition-all hover:shadow-md ${activeBusiness?.id === biz.id ? 'ring-2 ring-[var(--color-primary)]' : ''}`}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  {biz.logoPath ? (
                    <img src={biz.logoPath} alt="logo" className="w-12 h-12 rounded-xl object-contain bg-gray-50 border border-[var(--color-border)] flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${biz.accentColor ?? '#6366F1'}20` }}>
                      <Building2 size={22} style={{ color: biz.accentColor ?? '#6366F1' }} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-[var(--color-text-primary)] truncate">{biz.name}</div>
                    {biz.isDefault && <Badge variant="success" className="text-xs mt-0.5">Default</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!biz.isDefault && (
                    <button onClick={() => handleSetDefault(biz.id)} className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-amber-500 hover:bg-amber-50 transition-all" title="Set as default"><Star size={14} /></button>
                  )}
                  <button onClick={() => navigate(`/businesses/edit/${biz.id}`)} className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-50)] transition-all" title="Edit"><Pencil size={14} /></button>
                  <button onClick={() => { if(confirm(`Delete "${biz.name}"?`)) deleteBusiness(biz.id); }} className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-all" title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-[var(--color-text-secondary)]">
                {biz.address && <div className="truncate">{biz.address}</div>}
                {biz.gstin && <div>GSTIN: <span className="font-medium">{biz.gstin}</span></div>}
                {biz.phone && <div>{biz.phone}</div>}
                <div className="flex items-center gap-2 pt-1">
                  <div className="w-4 h-4 rounded-full border border-[var(--color-border)]" style={{ backgroundColor: biz.accentColor ?? '#6366F1' }} />
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
