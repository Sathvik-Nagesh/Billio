import React from 'react';
import type { TemplateProps } from './types';
import { getLabels } from '@/lib/utils/kannadaLabels';
import { formatNumber, formatINR } from '@/lib/utils/currency';

export function TraditionalIndian({ invoice, business, items, calculations, language, themeOverrides }: TemplateProps) {
  const L = getLabels(language);
  const accent = themeOverrides?.accentColor ?? business?.accentColor ?? '#6366F1';
  const font = themeOverrides?.fontFamily ?? 'Roboto';
  const headerLayout = themeOverrides?.headerLayout ?? 'split';
  const borderStyle = themeOverrides?.borderStyle ?? 'lines';
  const logoSizePx = { small: 64, medium: 90, large: 120 }[themeOverrides?.logoSize ?? 'medium'];
  const lineHeightVal = { compact: '1.25', normal: '1.5', relaxed: '1.75' }[themeOverrides?.lineSpacing ?? 'normal'];

  const tdStyle: React.CSSProperties = { border: `1px solid ${accent}55`, padding: '2.5mm 3mm', fontSize: '10px' };
  const thStyle: React.CSSProperties = { ...tdStyle, backgroundColor: accent, color: 'white', fontWeight: 700, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.3px' };

  return (
    <div
      id="invoice-print-area"
      style={{
        fontFamily: `'${font}', sans-serif`,
        width: '210mm',
        minHeight: '297mm',
        backgroundColor: '#ffffff',
        color: '#1a1a1a',
        boxSizing: 'border-box',
        border: borderStyle === 'boxed' ? `2px solid ${accent}` : borderStyle === 'lines' ? '1px solid #e2e8f0' : 'none',
        fontSize: '11px',
        lineHeight: lineHeightVal,
        position: 'relative',
      }}
    >
      {themeOverrides?.showWatermark && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%) rotate(-35deg)', fontSize: '64px', fontWeight: 900, letterSpacing: '8px', color: `${accent}10`, pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 50 }}>
          {themeOverrides.watermarkText ?? 'ORIGINAL'}
        </div>
      )}

      {/* Header */}
      <div style={{ borderBottom: `2px solid ${accent}`, padding: '5mm 6mm', display: 'flex', justifyContent: headerLayout === 'split' ? 'space-between' : headerLayout === 'centered' ? 'center' : 'flex-start',
        flexDirection: headerLayout === 'centered' ? 'column' : 'row',
        textAlign: headerLayout === 'centered' ? 'center' : 'left', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4mm' }}>
          {business?.logoPath && <img src={business.logoPath} alt="logo" style={{ height: `${logoSizePx}px`, maxWidth: '120px', objectFit: 'contain' }} />}
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: accent }}>{business?.name ?? 'Business Name'}</div>
            {business?.address && <div style={{ fontSize: '9px', color: '#555', whiteSpace: 'pre-line' }}>{business.address}</div>}
            {business?.phone && <div style={{ fontSize: '9px', color: '#555' }}>Ph: {business.phone}</div>}
            {business?.email && <div style={{ fontSize: '9px', color: '#555' }}>{business.email}</div>}
            {business?.gstin && <div style={{ fontSize: '9px', fontWeight: 600 }}>GSTIN: {business.gstin}</div>}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '22px', fontWeight: 900, color: accent, letterSpacing: '2px', textTransform: 'uppercase', border: `3px double ${accent}`, padding: '2mm 5mm', borderRadius: '4px' }}>
            {L.invoice}
          </div>
        </div>
      </div>

      {/* Invoice Meta Table */}
      <div style={{ borderBottom: `1px solid ${accent}55`, padding: '3mm 6mm' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
          <tbody>
            <tr>
              <td style={{ width: '50%', verticalAlign: 'top', paddingRight: '4mm' }}>
                <div style={{ fontWeight: 700, color: accent, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1mm' }}>{L.billTo}</div>
                <div style={{ fontWeight: 700, fontSize: '12px' }}>{invoice.customerName ?? '—'}</div>
                {invoice.customerAddress && <div style={{ color: '#555', whiteSpace: 'pre-line', fontSize: '9px' }}>{invoice.customerAddress}</div>}
                {invoice.customerPhone && <div style={{ fontSize: '9px', color: '#555' }}>{L.phone}: {invoice.customerPhone}</div>}
                {invoice.customerGstin && <div style={{ fontSize: '9px', fontWeight: 600 }}>{L.gstin}: {invoice.customerGstin}</div>}
              </td>
              <td style={{ verticalAlign: 'top' }}>
                <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr><td style={{ ...tdStyle, fontWeight: 600 }}>{L.invoiceNumber}</td><td style={tdStyle}>{invoice.invoiceNumber ?? '—'}</td></tr>
                    <tr><td style={{ ...tdStyle, fontWeight: 600 }}>{L.invoiceDate}</td><td style={tdStyle}>{invoice.invoiceDate ?? '—'}</td></tr>
                    {invoice.dueDate && <tr><td style={{ ...tdStyle, fontWeight: 600 }}>{L.dueDate}</td><td style={tdStyle}>{invoice.dueDate}</td></tr>}
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Items Table */}
      <div style={{ padding: '3mm 6mm' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4mm' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: '8%' }}>{L.srNo}</th>
              <th style={{ ...thStyle, textAlign: 'left' }}>{L.description}</th>
              {items.some((i: { isbn?: string }) => i.isbn) && <th style={{ ...thStyle, width: '14%', textAlign: 'left' }}>{L.isbn}</th>}
              <th style={{ ...thStyle, width: '8%' }}>{L.quantity}</th>
              <th style={{ ...thStyle, width: '14%', textAlign: 'right' }}>{L.unitPrice}</th>
              <th style={{ ...thStyle, width: '14%', textAlign: 'right' }}>{L.amount}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: { srNo: number; productName: string; isbn?: string; quantity: number; unitPrice: number; lineTotal: number }, idx: number) => (
              <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : `${accent}08` }}>
                <td style={{ ...tdStyle, textAlign: 'center', color: '#888' }}>{item.srNo}</td>
                <td style={{ ...tdStyle }}>{item.productName || '—'}</td>
                {items.some((i: { isbn?: string }) => i.isbn) && <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '9px', color: '#555' }}>{item.isbn || '—'}</td>}
                <td style={{ ...tdStyle, textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>₹{formatNumber(item.unitPrice)}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>₹{formatNumber(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4mm' }}>
          <table style={{ fontSize: '10px', borderCollapse: 'collapse', minWidth: '65mm' }}>
            <tbody>
              <tr><td style={tdStyle}>{L.subtotal}</td><td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>₹{formatNumber(calculations.subtotal)}</td></tr>
              {calculations.discountAmount > 0 && <tr><td style={{ ...tdStyle, color: '#ef4444' }}>{L.discount}</td><td style={{ ...tdStyle, textAlign: 'right', color: '#ef4444', fontWeight: 600 }}>-₹{formatNumber(calculations.discountAmount)}</td></tr>}
              {calculations.roundOff !== 0 && <tr><td style={{ ...tdStyle, color: '#888' }}>{L.roundOff}</td><td style={{ ...tdStyle, textAlign: 'right', color: '#888' }}>₹{formatNumber(Math.abs(calculations.roundOff))}</td></tr>}
              <tr><td style={{ ...thStyle, fontSize: '11px' }}>{L.grandTotal}</td><td style={{ ...thStyle, textAlign: 'right', fontSize: '12px' }}>{formatINR(calculations.grandTotal)}</td></tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '4mm', padding: '3mm', border: `1px solid ${accent}40`, borderRadius: '4px', backgroundColor: `${accent}05` }}>
            <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', marginBottom: '1mm', fontWeight: 600 }}>{L.amountInWords}</div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b' }}>{calculations.amountInWords}</div>
          </div>

        {/* Bank & Signature */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4mm', marginBottom: '4mm' }}>
          {business?.bankName && (
            <div style={{ fontSize: '11px', flex: 1 }}>
              <div style={{ fontWeight: 800, color: accent, fontSize: '10px', textTransform: 'uppercase', marginBottom: '2mm' }}>{L.bankDetails}</div>
              <div style={{ border: `2px solid ${accent}`, padding: '3.5mm', backgroundColor: '#fafafa' }}>
                <div style={{ marginBottom: '2px' }}><span style={{ color: '#444', fontWeight: 600 }}>{L.bankName}: </span><strong style={{ color: '#000', fontSize: '12px' }}>{business.bankName}</strong></div>
                {business.bankAccount && <div style={{ marginBottom: '2px' }}><span style={{ color: '#444', fontWeight: 600 }}>{L.accountNumber}: </span><strong style={{ color: '#000', fontSize: '12px', letterSpacing: '0.5px' }}>{business.bankAccount}</strong></div>}
                {business.bankIfsc && <div style={{ marginBottom: '2px' }}><span style={{ color: '#444', fontWeight: 600 }}>{L.ifscCode}: </span><strong style={{ color: '#000', fontSize: '12px', letterSpacing: '0.5px' }}>{business.bankIfsc}</strong></div>}
                {business.bankBranch && <div><span style={{ color: '#444', fontWeight: 600 }}>{L.branch}: </span><strong style={{ color: '#000' }}>{business.bankBranch}</strong></div>}
              </div>
            </div>
          )}
          <div style={{ textAlign: 'center', minWidth: '45mm' }}>
            {business?.signaturePath && <img src={business.signaturePath} alt="sig" style={{ height: '14mm', maxWidth: '44mm', objectFit: 'contain', display: 'block', margin: '0 auto 2mm' }} />}
            <div style={{ borderTop: `2px solid ${accent}`, paddingTop: '2mm', fontSize: '9px', color: '#555' }}>{L.authorizedSignatory}</div>
            <div style={{ fontSize: '10px', fontWeight: 700 }}>{L.forCompany} {business?.name ?? ''}</div>
          </div>
        </div>

        {business?.terms && (
          <div style={{ borderTop: `1px solid ${accent}55`, paddingTop: '3mm', fontSize: '9px', color: '#888' }}>
            <strong style={{ color: '#555' }}>{L.termsAndConditions}: </strong>
            <span style={{ whiteSpace: 'pre-line' }}>{business.terms}</span>
          </div>
        )}
      </div>
    </div>
  );
}
