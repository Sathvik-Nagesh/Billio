import React from 'react';
import type { TemplateProps } from './types';
import { getLabels } from '@/lib/utils/kannadaLabels';
import { formatNumber, formatINR } from '@/lib/utils/currency';

export function ElegantSerif({ invoice, business, items, calculations, language, themeOverrides }: TemplateProps) {
  const L = getLabels(language);
  const accent = themeOverrides?.accentColor ?? business?.accentColor ?? '#6366F1';
  const font = themeOverrides?.fontFamily ?? 'Playfair Display';
  const headerLayout = themeOverrides?.headerLayout ?? 'split';
  const borderStyle = themeOverrides?.borderStyle ?? 'lines';
  const logoSizePx = { small: 64, medium: 90, large: 120 }[themeOverrides?.logoSize ?? 'medium'];
  const lineHeightVal = { compact: '1.3', normal: '1.6', relaxed: '1.8' }[themeOverrides?.lineSpacing ?? 'normal'];
  const hasIsbn = items.some((i: { isbn?: string; slNo?: string }) => i.isbn);
  const hasSlNo = items.some((i: any) => i.slNo && i.slNo.trim() !== '');
  const isLastPage = arguments[0].pageNumber === undefined || arguments[0].totalPages === undefined || arguments[0].pageNumber === arguments[0].totalPages;

  return (
    <div
      id="invoice-print-area"
      style={{
        fontFamily: `'${font}', 'Merriweather', serif`,
        width: '210mm',
        backgroundColor: '#fdfcfb', color: '#1a1a1a',
        boxSizing: 'border-box',
        border: borderStyle === 'boxed' ? `2px solid ${accent}` : borderStyle === 'lines' ? '1px solid #e2e8f0' : 'none',
        fontSize: '11px', lineHeight: lineHeightVal, position: 'relative', padding: '0',
      }}
    >
      {themeOverrides?.showWatermark && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%) rotate(-35deg)', fontSize: '64px', fontWeight: 900, color: `${accent}0d`, pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 50 }}>
          {themeOverrides.watermarkText ?? 'ORIGINAL'}
        </div>
      )}

      {/* Ornamental top */}
      <div style={{ height: '3px', background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
      <div style={{ height: '1px', background: `linear-gradient(90deg, transparent, #d4c5a0, transparent)`, margin: '2px 0' }} />

      <div style={{ padding: '8mm 12mm' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '6mm', borderBottom: '1px solid #d4c5a0', paddingBottom: '5mm' }}>
          {business?.logoPath && <img src={business.logoPath} alt="logo" style={{ height: `${logoSizePx}px`, maxWidth: '160px', objectFit: 'contain', display: 'block', margin: '0 auto 3mm' }} />}
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#1a1a1a', letterSpacing: '1px', marginBottom: '1mm' }}>{business?.name ?? 'Your Business'}</div>
          {business?.address && <div style={{ fontSize: '10px', color: '#7a7a7a', fontFamily: 'Inter, sans-serif' }}>{business.address}</div>}
          {business?.phone && <div style={{ fontSize: '10px', color: '#7a7a7a', fontFamily: 'Inter, sans-serif' }}>{business.phone}{business.email ? ` | ${business.email}` : ''}</div>}
          {business?.gstin && <div style={{ fontSize: '9px', color: '#7a7a7a', fontFamily: 'Inter, sans-serif' }}>GSTIN: {business.gstin}</div>}
        </div>

        {/* Invoice title centered */}
        <div style={{ textAlign: 'center', marginBottom: '5mm' }}>
          <div style={{ display: 'inline-block', fontSize: '16px', fontWeight: 700, letterSpacing: '4px', textTransform: 'uppercase', color: accent, borderTop: `1px solid ${accent}55`, borderBottom: `1px solid ${accent}55`, padding: '2mm 6mm' }}>
            {L.invoice}
          </div>
        </div>

        {/* Invoice meta & bill to side by side */}
        <div style={{ display: 'flex', justifyContent: headerLayout === 'split' ? 'space-between' : headerLayout === 'centered' ? 'center' : 'flex-start',
        flexDirection: headerLayout === 'centered' ? 'column' : 'row',
        textAlign: headerLayout === 'centered' ? 'center' : 'left', marginBottom: '5mm', fontSize: '10px', fontFamily: 'Inter, sans-serif' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: '#7a7a7a', marginBottom: '1mm' }}>{L.billTo}</div>
            <div style={{ fontWeight: 700, fontSize: '13px', color: '#1a1a1a', fontFamily: `'${font}', serif` }}>{invoice.customerName ?? '—'}</div>
            {invoice.customerAddress && <div style={{ color: '#555', whiteSpace: 'pre-line' }}>{invoice.customerAddress}</div>}
            {invoice.customerPhone && <div style={{ color: '#555' }}>{invoice.customerPhone}</div>}
            {invoice.customerGstin && <div style={{ color: '#555' }}>GSTIN: {invoice.customerGstin}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div><span style={{ color: '#7a7a7a' }}>{L.invoiceNumber}: </span><strong>{invoice.invoiceNumber ?? '—'}</strong></div>
            <div><span style={{ color: '#7a7a7a' }}>{L.invoiceDate}: </span><strong>{invoice.invoiceDate ?? '—'}</strong></div>
            {invoice.dueDate && <div><span style={{ color: '#7a7a7a' }}>{L.dueDate}: </span><strong>{invoice.dueDate}</strong></div>}
          </div>
        </div>

        {/* Items */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '5mm', fontSize: '10px', fontFamily: 'Inter, sans-serif' }}>
          <thead>
            <tr style={{ borderTop: `1px solid #d4c5a0`, borderBottom: `1px solid #d4c5a0` }}>
              <th style={{ padding: '2mm 2mm', textAlign: 'left', fontWeight: 700, fontSize: '9px', color: '#7a7a7a', letterSpacing: '0.5px', width: '7%' }}>{L.srNo}</th>
              {hasSlNo && (
                <th style={{ padding: '2mm 2mm', textAlign: 'left', fontWeight: 700, fontSize: '9px', color: '#7a7a7a', letterSpacing: '0.5px', width: '12%' }}>Sel. No.</th>
              )}
               <th style={{ padding: '2mm 2mm', textAlign: 'left', fontWeight: 700, fontSize: '9px', color: '#7a7a7a', letterSpacing: '0.5px' }}>{L.description}</th>
              {hasIsbn && (
                <th style={{ padding: '2mm 2mm', textAlign: 'left', fontWeight: 700, fontSize: '9px', color: '#7a7a7a', letterSpacing: '0.5px', width: '16%' }}>{L.isbn}</th>
              )}
              <th style={{ padding: '2mm 2mm', textAlign: 'right', fontWeight: 700, fontSize: '9px', color: '#7a7a7a', letterSpacing: '0.5px', width: '14%' }}>{L.unitPrice}</th>
              <th style={{ padding: '2mm 2mm', textAlign: 'center', fontWeight: 700, fontSize: '9px', color: '#7a7a7a', letterSpacing: '0.5px', width: '8%' }}>{L.quantity}</th>
              <th style={{ padding: '2mm 2mm', textAlign: 'right', fontWeight: 700, fontSize: '9px', color: '#7a7a7a', letterSpacing: '0.5px', width: '14%' }}>{L.amount}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: { srNo: number; slNo?: string; productName: string; isbn?: string; quantity: number; unitPrice: number; lineTotal: number }, idx: number) => (
              <tr key={idx} style={{ borderBottom: '1px solid #ede8df', pageBreakInside: 'avoid' }}>
                <td style={{ padding: '1.5mm 2mm', color: '#aaa' }}>{item.srNo}</td>
                {hasSlNo && (
                  <td style={{ padding: '1.5mm 2mm', fontFamily: 'monospace', fontSize: '9px', color: '#aaa' }}>{item.slNo || '—'}</td>
                )}
                <td style={{ padding: '1.5mm 2mm', fontFamily: `'${font}', serif` }}>{item.productName || '—'}</td>
                {hasIsbn && (
                  <td style={{ padding: '1.5mm 2mm', fontFamily: 'monospace', fontSize: '9px', color: '#777' }}>{item.isbn || '—'}</td>
                )}
                <td style={{ padding: '1.5mm 2mm', textAlign: 'right' }}>₹{formatNumber(item.unitPrice)}</td>
                <td style={{ padding: '1.5mm 2mm', textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ padding: '1.5mm 2mm', textAlign: 'right', fontWeight: 600 }}>₹{formatNumber(item.lineTotal)}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '5mm', textAlign: 'center', color: '#aaa', fontStyle: 'italic' }}>No items added yet</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Bottom sections (only on last page) */}
        {isLastPage && (
          <>
            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '5mm', fontFamily: 'Inter, sans-serif' }}>
          <div style={{ minWidth: '64mm' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2mm 0', fontSize: '10px', borderBottom: '1px solid #ede8df' }}>
              <span style={{ color: '#7a7a7a' }}>{L.subtotal}</span>
              <span style={{ fontWeight: 600 }}>₹{formatNumber(calculations.subtotal)}</span>
            </div>
            {calculations.discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2mm 0', fontSize: '10px', color: '#ef4444', borderBottom: '1px solid #ede8df' }}>
                <span>{L.discount}</span>
                <span>-₹{formatNumber(calculations.discountAmount)}</span>
              </div>
            )}
            {calculations.roundOff !== 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2mm 0', fontSize: '10px', color: '#aaa', borderBottom: '1px solid #ede8df' }}>
                <span>{L.roundOff}</span>
                <span>{calculations.roundOff > 0 ? '+' : ''}₹{formatNumber(Math.abs(calculations.roundOff))}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3mm 4mm', marginTop: '2mm', backgroundColor: accent, color: 'white', fontSize: '13px', fontWeight: 700, fontFamily: `'${font}', serif` }}>
              <span>{L.grandTotal}</span>
              <span>{formatINR(calculations.grandTotal)}</span>
            </div>
            {/* Fixed div nesting — amountInWords is now a sibling of grandTotal box, not nested inside it */}
            <div style={{ marginTop: '4mm', padding: '3mm', border: `1px solid ${accent}40`, borderRadius: '4px', backgroundColor: `${accent}05` }}>
              <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', marginBottom: '1mm', fontWeight: 600 }}>{L.amountInWords}</div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#1a1a1a' }}>{calculations.amountInWords}</div>
            </div>
          </div>
        </div>

        {/* Bank & Signature */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '5mm', marginBottom: '5mm', fontFamily: 'Inter, sans-serif' }}>
          {business?.bankName && (
            <div style={{ fontSize: '11px', flex: 1 }}>
              <div style={{ fontWeight: 800, color: '#5a5a5a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2mm' }}>{L.bankDetails}</div>
              <div style={{ border: '2px solid #d4c5a0', padding: '4mm', backgroundColor: '#fdfcfb', borderRadius: '4px' }}>
                <div style={{ marginBottom: '2px' }}><span style={{ fontWeight: 600, color: '#5a5a5a' }}>{L.bankName}: </span><strong style={{ fontSize: '12px', color: '#1a1a1a' }}>{business.bankName}</strong></div>
                {business.bankAccount && <div style={{ marginBottom: '2px' }}><span style={{ fontWeight: 600, color: '#5a5a5a' }}>{L.accountNumber}: </span><strong style={{ fontSize: '12px', color: '#1a1a1a', letterSpacing: '0.5px' }}>{business.bankAccount}</strong></div>}
                {business.bankIfsc && <div style={{ marginBottom: '2px' }}><span style={{ fontWeight: 600, color: '#5a5a5a' }}>{L.ifscCode}: </span><strong style={{ fontSize: '12px', color: '#1a1a1a', letterSpacing: '0.5px' }}>{business.bankIfsc}</strong></div>}
                {business.bankBranch && <div><span style={{ fontWeight: 600, color: '#5a5a5a' }}>{L.branch}: </span><strong style={{ color: '#1a1a1a' }}>{business.bankBranch}</strong></div>}
              </div>
            </div>
          )}
          <div style={{ textAlign: 'center', minWidth: '45mm' }}>
            {business?.upiQrPath && (
              <div style={{ marginBottom: '3mm' }}>
                <img src={business.upiQrPath} alt="UPI QR" style={{ width: '20mm', height: '20mm', objectFit: 'contain' }} />
                <div style={{ fontSize: '8px', color: '#aaa' }}>Scan to Pay</div>
              </div>
            )}
            {business?.signaturePath && <img src={business.signaturePath} alt="Signature" style={{ height: '14mm', maxWidth: '44mm', objectFit: 'contain', display: 'block', margin: '0 auto 2mm' }} />}
            <div style={{ borderTop: `1px solid ${accent}`, paddingTop: '2mm', fontSize: '9px', color: '#7a7a7a' }}>
              {L.authorizedSignatory}
            </div>
            <div style={{ fontSize: '10px', fontWeight: 700, fontFamily: `'${font}', serif` }}>{L.forCompany} {business?.name ?? ''}</div>
          </div>
        </div>

        {/* Terms */}
        {business?.terms && (
          <div style={{ fontSize: '9px', color: '#aaa', borderTop: '1px solid #d4c5a0', paddingTop: '3mm', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ fontWeight: 700, color: '#7a7a7a', marginBottom: '1mm', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{L.termsAndConditions}</div>
            <div style={{ whiteSpace: 'pre-line' }}>{business.terms}</div>
          </div>
        )}
          </>
        )}
      </div>

      {/* Elegant bottom edge */}
      <div style={{ height: '1px', background: `linear-gradient(90deg, transparent, #d4c5a0, transparent)`, margin: '2px 0' }} />
      <div style={{ height: '3px', background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
    </div>
  );
}
