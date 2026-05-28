import React from 'react';
import type { TemplateProps } from './types';
import { getLabels } from '@/lib/utils/kannadaLabels';
import { formatNumber, formatINR } from '@/lib/utils/currency';

export function MinimalModern({ invoice, business, items, calculations, language, themeOverrides }: TemplateProps) {
  const L = getLabels(language);
  const accent = themeOverrides?.accentColor ?? business?.accentColor ?? '#6366F1';
  const font = themeOverrides?.fontFamily ?? 'Inter';
  const logoSize = themeOverrides?.logoSize ?? 'medium';
  const headerLayout = themeOverrides?.headerLayout ?? 'split';
  const borderStyle = themeOverrides?.borderStyle ?? 'lines';
  const logoSizePx = { small: 64, medium: 90, large: 120 }[logoSize];
  const lineHeightVal = { compact: '1.25', normal: '1.5', relaxed: '1.75' }[themeOverrides?.lineSpacing ?? 'normal'];

  return (
    <div
      id="invoice-print-area"
      style={{
        fontFamily: `'${font}', sans-serif`,
        width: '210mm',
        minHeight: '297mm',
        backgroundColor: '#ffffff',
        color: '#1e293b',
        position: 'relative',
        padding: '12mm 14mm',
        boxSizing: 'border-box',
        border: borderStyle === 'boxed' ? `2px solid ${accent}` : borderStyle === 'lines' ? '1px solid #e2e8f0' : 'none',
        fontSize: '11px',
        lineHeight: lineHeightVal,
      }}
    >
      {/* Watermark */}
      {themeOverrides?.showWatermark && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%) rotate(-35deg)',
          fontSize: '72px', fontWeight: 900, letterSpacing: '8px',
          color: `${accent}12`, pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 50,
        }}>
          {themeOverrides.watermarkText ?? 'ORIGINAL'}
        </div>
      )}

      {/* Accent top bar */}
      <div style={{ height: '4px', backgroundColor: accent, marginBottom: '8mm', borderRadius: '2px' }} />

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: headerLayout === 'centered' ? 'center' : 'flex-start',
        justifyContent: headerLayout === 'split' ? 'space-between' : headerLayout === 'centered' ? 'center' : 'flex-start',
        flexDirection: headerLayout === 'centered' ? 'column' : 'row',
        gap: '6mm',
        marginBottom: '8mm',
      }}>
        {/* Business Info */}
        <div style={{ flex: headerLayout === 'split' ? 1 : 'none', textAlign: headerLayout === 'centered' ? 'center' : 'left' }}>
          {business?.logoPath ? (
            <img src={business.logoPath} alt="logo" style={{ height: `${logoSizePx}px`, maxWidth: '180px', objectFit: 'contain', marginBottom: '3mm', display: 'block' }} />
          ) : (
            <div style={{ fontSize: '20px', fontWeight: 800, color: accent, marginBottom: '2mm', letterSpacing: '-0.5px' }}>
              {business?.name ?? 'Your Business'}
            </div>
          )}
          {business?.logoPath && (
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>{business.name}</div>
          )}
          {business?.address && <div style={{ color: '#64748b', fontSize: '10px', marginTop: '1mm', whiteSpace: 'pre-line' }}>{business.address}</div>}
          {business?.phone && <div style={{ color: '#64748b', fontSize: '10px' }}>📞 {business.phone}</div>}
          {business?.email && <div style={{ color: '#64748b', fontSize: '10px' }}>✉ {business.email}</div>}
          {business?.gstin && <div style={{ color: '#64748b', fontSize: '10px' }}>GSTIN: {business.gstin}</div>}
        </div>

        {/* Invoice Info Box */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: `1px solid ${accent}30`,
          borderRadius: '8px',
          padding: '5mm',
          minWidth: '55mm',
        }}>
          <div style={{ fontSize: '18px', fontWeight: 800, color: accent, letterSpacing: '-0.5px', marginBottom: '3mm' }}>
            {L.invoice}
          </div>
          <table style={{ width: '100%', fontSize: '10px' }}>
            <tbody>
              <tr>
                <td style={{ color: '#64748b', paddingBottom: '1mm', paddingRight: '3mm', whiteSpace: 'nowrap' }}>{L.invoiceNumber}</td>
                <td style={{ fontWeight: 600, textAlign: 'right' }}>{invoice.invoiceNumber ?? '-'}</td>
              </tr>
              <tr>
                <td style={{ color: '#64748b', paddingBottom: '1mm', paddingRight: '3mm' }}>{L.invoiceDate}</td>
                <td style={{ fontWeight: 600, textAlign: 'right' }}>{invoice.invoiceDate ?? '-'}</td>
              </tr>
              {invoice.dueDate && (
                <tr>
                  <td style={{ color: '#64748b', paddingRight: '3mm' }}>{L.dueDate}</td>
                  <td style={{ fontWeight: 600, textAlign: 'right' }}>{invoice.dueDate}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill To */}
      <div style={{
        backgroundColor: '#f8fafc',
        borderLeft: `3px solid ${accent}`,
        borderRadius: '0 6px 6px 0',
        padding: '4mm 5mm',
        marginBottom: '6mm',
      }}>
        <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '1px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2mm' }}>
          {L.billTo}
        </div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>{invoice.customerName ?? 'Customer Name'}</div>
        {invoice.customerAddress && <div style={{ color: '#64748b', fontSize: '10px', marginTop: '1mm', whiteSpace: 'pre-line' }}>{invoice.customerAddress}</div>}
        {invoice.customerPhone && <div style={{ color: '#64748b', fontSize: '10px' }}>{L.phone}: {invoice.customerPhone}</div>}
        {invoice.customerEmail && <div style={{ color: '#64748b', fontSize: '10px' }}>{L.email}: {invoice.customerEmail}</div>}
        {invoice.customerGstin && <div style={{ color: '#64748b', fontSize: '10px' }}>{L.gstin}: {invoice.customerGstin}</div>}
      </div>

      {/* Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6mm', fontSize: '10px' }}>
        <thead>
          <tr style={{ backgroundColor: accent, color: 'white' }}>
            <th style={{ padding: '3mm 4mm', textAlign: 'left', fontWeight: 600, width: '8%', borderRadius: '4px 0 0 4px' }}>{L.srNo}</th>
            <th style={{ padding: '3mm 4mm', textAlign: 'left', fontWeight: 600 }}>{L.description}</th>
            {items.some((i: { isbn?: string }) => i.isbn) && (
              <th style={{ padding: '3mm 4mm', textAlign: 'left', fontWeight: 600, width: '15%' }}>{L.isbn}</th>
            )}
            <th style={{ padding: '3mm 4mm', textAlign: 'center', fontWeight: 600, width: '8%' }}>{L.quantity}</th>
            <th style={{ padding: '3mm 4mm', textAlign: 'right', fontWeight: 600, width: '15%' }}>{L.unitPrice}</th>
            <th style={{ padding: '3mm 4mm', textAlign: 'right', fontWeight: 600, width: '15%', borderRadius: '0 4px 4px 0' }}>{L.amount}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item: { srNo: number; productName: string; isbn?: string; quantity: number; unitPrice: number; lineTotal: number }, idx: number) => (
            <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
              <td style={{ padding: '2.5mm 4mm', color: '#94a3b8' }}>{item.srNo}</td>
              <td style={{ padding: '2.5mm 4mm', fontWeight: 500 }}>{item.productName || '—'}</td>
              {items.some((i: { isbn?: string }) => i.isbn) && (
                <td style={{ padding: '2.5mm 4mm', color: '#64748b', fontFamily: 'monospace' }}>{item.isbn || '—'}</td>
              )}
              <td style={{ padding: '2.5mm 4mm', textAlign: 'center' }}>{item.quantity}</td>
              <td style={{ padding: '2.5mm 4mm', textAlign: 'right' }}>₹{formatNumber(item.unitPrice)}</td>
              <td style={{ padding: '2.5mm 4mm', textAlign: 'right', fontWeight: 600 }}>₹{formatNumber(item.lineTotal)}</td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: '5mm', textAlign: 'center', color: '#94a3b8' }}>No items added yet</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6mm' }}>
        <div style={{ minWidth: '64mm' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2mm 0', fontSize: '10px', color: '#64748b' }}>
            <span>{L.subtotal}</span>
            <span style={{ fontWeight: 600, color: '#1e293b' }}>₹{formatNumber(calculations.subtotal)}</span>
          </div>
          {calculations.discountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2mm 0', fontSize: '10px', color: '#ef4444' }}>
              <span>{L.discount}</span>
              <span>-₹{formatNumber(calculations.discountAmount)}</span>
            </div>
          )}
          {calculations.roundOff !== 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2mm 0', fontSize: '10px', color: '#94a3b8' }}>
              <span>{L.roundOff}</span>
              <span>{calculations.roundOff > 0 ? '+' : ''}₹{formatNumber(Math.abs(calculations.roundOff))}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3mm 4mm', marginTop: '2mm', backgroundColor: accent, color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
            <span>{L.grandTotal}</span>
            <span>{formatINR(calculations.grandTotal)}</span>
          </div>
          <div style={{ marginTop: '4mm', padding: '3mm', border: `1px solid ${accent}40`, borderRadius: '4px', backgroundColor: `${accent}05` }}>
            <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', marginBottom: '1mm', fontWeight: 600 }}>{L.amountInWords}</div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b' }}>{calculations.amountInWords}</div>
          </div>
        </div>
      </div>

      {/* Bank Details & QR */}
      {(business?.bankName || business?.upiQrPath) && (
        <div style={{ display: 'flex', gap: '6mm', marginBottom: '6mm' }}>
          {business?.bankName && (
            <div style={{ flex: 1, fontSize: '11px' }}>
              <div style={{ fontWeight: 800, color: accent, marginBottom: '2mm', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{L.bankDetails}</div>
              <div style={{ backgroundColor: '#f8fafc', border: `2px solid ${accent}40`, padding: '4mm', borderRadius: '8px' }}>
                <div style={{ marginBottom: '2px' }}><span style={{ color: '#475569', fontWeight: 600 }}>{L.bankName}: </span><strong style={{ color: '#0f172a', fontSize: '12px' }}>{business.bankName}</strong></div>
                {business.bankAccount && <div style={{ marginBottom: '2px' }}><span style={{ color: '#475569', fontWeight: 600 }}>{L.accountNumber}: </span><strong style={{ color: '#0f172a', fontSize: '12px', letterSpacing: '0.5px' }}>{business.bankAccount}</strong></div>}
                {business.bankIfsc && <div style={{ marginBottom: '2px' }}><span style={{ color: '#475569', fontWeight: 600 }}>{L.ifscCode}: </span><strong style={{ color: '#0f172a', fontSize: '12px', letterSpacing: '0.5px' }}>{business.bankIfsc}</strong></div>}
                {business.bankBranch && <div><span style={{ color: '#475569', fontWeight: 600 }}>{L.branch}: </span><strong style={{ color: '#0f172a' }}>{business.bankBranch}</strong></div>}
              </div>
            </div>
          )}
          {business?.upiQrPath && (
            <div style={{ textAlign: 'center', fontSize: '9px', color: '#64748b' }}>
              <img src={business.upiQrPath} alt="UPI QR" style={{ width: '20mm', height: '20mm', objectFit: 'contain' }} />
              <div style={{ marginTop: '1mm' }}>Scan to Pay</div>
            </div>
          )}
        </div>
      )}

      {/* Terms */}
      {business?.terms && (
        <div style={{ fontSize: '9px', color: '#94a3b8', marginBottom: '6mm', borderTop: '1px solid #e2e8f0', paddingTop: '3mm' }}>
          <div style={{ fontWeight: 700, color: '#64748b', marginBottom: '1mm', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{L.termsAndConditions}</div>
          <div style={{ whiteSpace: 'pre-line' }}>{business.terms}</div>
        </div>
      )}

      {/* Signature */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6mm' }}>
        <div style={{ textAlign: 'center', minWidth: '45mm' }}>
          {business?.signaturePath && (
            <img src={business.signaturePath} alt="Signature" style={{ height: '14mm', maxWidth: '44mm', objectFit: 'contain', display: 'block', margin: '0 auto 2mm' }} />
          )}
          <div style={{ borderTop: `1px solid ${accent}`, paddingTop: '2mm', fontSize: '9px', color: '#64748b' }}>
            {L.authorizedSignatory}
          </div>
          <div style={{ fontSize: '10px', fontWeight: 600, color: '#1e293b' }}>
            {L.forCompany} {business?.name ?? ''}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ height: '3px', backgroundColor: accent, marginTop: '8mm', borderRadius: '2px', opacity: 0.4 }} />
    </div>
  );
}
