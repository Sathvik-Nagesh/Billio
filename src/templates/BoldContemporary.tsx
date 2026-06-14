import React from 'react';
import type { TemplateProps } from './types';
import { getLabels } from '@/lib/utils/kannadaLabels';
import { formatNumber, formatINR } from '@/lib/utils/currency';
import { useAppSettingsStore } from '@/stores/useAppSettingsStore';
import { formatDate } from '@/lib/utils/dateFormat';
import { QRCodeSVG } from 'qrcode.react';

export function BoldContemporary({ invoice, business, items, calculations, language, themeOverrides }: TemplateProps) {
  const L = getLabels(language);
  const accent = themeOverrides?.accentColor ?? business?.accentColor ?? '#6366F1';
  const font = themeOverrides?.fontFamily ?? 'Outfit';
  const headerLayout = themeOverrides?.headerLayout ?? 'split';
  const borderStyle = themeOverrides?.borderStyle ?? 'lines';
  const logoSizePx = { small: 64, medium: 90, large: 120 }[themeOverrides?.logoSize ?? 'medium'];
  const lineHeightVal = { compact: '1.25', normal: '1.5', relaxed: '1.75' }[themeOverrides?.lineSpacing ?? 'normal'];
  const hasIsbn = items.some((i: { isbn?: string; slNo?: string }) => i.isbn);
  const hasSlNo = items.some((i: any) => i.slNo && i.slNo.trim() !== '');
  const hasAuthor = items.some((i: any) => i.author && i.author.trim() !== '');
  const isLastPage = arguments[0].pageNumber === undefined || arguments[0].totalPages === undefined || arguments[0].pageNumber === arguments[0].totalPages;

  // Font weight / size / print helpers
  const fwMap: Record<string, number> = { light: 300, regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 };
  const baseFW = fwMap[themeOverrides?.fontWeight ?? 'regular'];
  const scaleVal = parseInt(themeOverrides?.fontSize ?? '100') / 100;
  // Note: BoldContemporary is a dark theme; printFriendly and highContrast have limited effect
  // on backgrounds but still improve text legibility settings
  const printFriendly = themeOverrides?.printFriendly ?? false;
  const highContrast = themeOverrides?.highContrast ?? false;

  const { dateFormat } = useAppSettingsStore();

  return (
    <div
      id="invoice-print-area"
      style={{
        fontFamily: `'${font}', sans-serif`,
        width: '210mm',
        backgroundColor: '#0f0e1a', color: '#f8fafc',
        boxSizing: 'border-box',
        border: borderStyle === 'boxed' ? `2px solid ${accent}` : borderStyle === 'lines' ? '1px solid #e2e8f0' : 'none',
        fontSize: `${11 * scaleVal}px`, lineHeight: lineHeightVal, position: 'relative',
        fontWeight: baseFW,
      }}
    >
      {themeOverrides?.showWatermark && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%) rotate(-35deg)', fontSize: '64px', fontWeight: 900, color: 'rgba(255,255,255,0.04)', pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 50 }}>
          {themeOverrides.watermarkText ?? 'ORIGINAL'}
        </div>
      )}

      {/* Top accent bar */}
      <div style={{ height: '6px', background: `linear-gradient(90deg, ${accent}, ${accent}88)` }} />

      {/* Header */}
      <div style={{ padding: '7mm 10mm', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: headerLayout === 'split' ? 'space-between' : headerLayout === 'centered' ? 'center' : 'flex-start',
        flexDirection: headerLayout === 'centered' ? 'column' : 'row',
        textAlign: headerLayout === 'centered' ? 'center' : 'left', alignItems: 'center' }}>
        <div>
          {business?.logoPath ? <img src={business.logoPath} alt="logo" style={{ height: `${logoSizePx}px`, maxWidth: '180px', objectFit: 'contain', marginBottom: '2mm', background: 'rgba(255,255,255,0.9)', padding: '4px 8px', borderRadius: '8px', display: 'block' }} /> : null}
          {!business?.logoPath ? (
            <div style={{ fontSize: `${22 * scaleVal}px`, fontWeight: highContrast ? 900 : 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: '2mm' }}>{business?.name ?? 'Your Business'}</div>
          ) : (
            <div style={{ fontSize: `${18 * scaleVal}px`, fontWeight: highContrast ? 800 : 700, color: '#fff' }}>{business?.name ?? 'Your Business'}</div>
          )}
          {business?.address && <div style={{ fontSize: `${11 * scaleVal}px`, color: 'rgba(255,255,255,0.6)', marginTop: '1mm', whiteSpace: 'pre-line', fontWeight: highContrast ? 500 : baseFW }}>{business.address}</div>}
          {business?.gstin && <div style={{ fontSize: `${11 * scaleVal}px`, color: 'rgba(255,255,255,0.5)', fontWeight: highContrast ? 500 : baseFW }}>GSTIN: {business.gstin}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '40px', fontWeight: 900, color: accent, letterSpacing: '-2px', lineHeight: 1, textTransform: 'uppercase' }}>{L.invoice}</div>
          <div style={{ fontSize: `${11 * scaleVal}px`, color: 'rgba(255,255,255,0.6)', marginTop: '3mm' }}>
            <div><strong style={{ color: '#fff' }}>#{invoice.invoiceNumber ?? '—'}</strong></div>
            <div>{formatDate(invoice.invoiceDate, dateFormat) || '—'}</div>
            {invoice.dueDate && <div style={{ color: 'rgba(255,255,255,0.5)' }}>{L.dueDate}: {formatDate(invoice.dueDate, dateFormat) || ''}</div>}
          </div>
        </div>
      </div>

      {/* Bill to */}
      <div style={{ padding: '5mm 10mm', display: 'flex', gap: '5mm', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4mm', borderLeft: `3px solid ${accent}` }}>
          <div style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: accent, marginBottom: '2mm' }}>{L.billTo}</div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>{invoice.customerName ?? '—'}</div>
          {invoice.customerAddress && <div style={{ fontSize: `${10 * scaleVal}px`, color: 'rgba(255,255,255,0.6)', whiteSpace: 'pre-line' }}>{invoice.customerAddress}</div>}
          {invoice.customerPhone && <div style={{ fontSize: `${10 * scaleVal}px`, color: 'rgba(255,255,255,0.6)' }}>{invoice.customerPhone}</div>}
          {invoice.customerGstin && <div style={{ fontSize: `${10 * scaleVal}px`, color: 'rgba(255,255,255,0.5)' }}>GSTIN: {invoice.customerGstin}</div>}
        </div>
      </div>

      {/* Items Table */}
      <div style={{ padding: '5mm 10mm' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '5mm', fontSize: `${10 * scaleVal}px` }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${accent}` }}>
              <th style={{ padding: '2mm 2mm', textAlign: 'left', fontWeight: highContrast ? 800 : Math.max(700, baseFW), fontSize: `${11 * scaleVal}px`, color: 'rgba(255,255,255,0.5)', letterSpacing: '1.5px', textTransform: 'uppercase', width: '8%' }}>{L.srNo}</th>
              {hasSlNo && <th style={{ padding: '2mm 2mm', textAlign: 'left', fontWeight: highContrast ? 800 : Math.max(700, baseFW), fontSize: `${11 * scaleVal}px`, color: 'rgba(255,255,255,0.5)', letterSpacing: '1.5px', textTransform: 'uppercase', width: '12%' }}>Sel. No.</th>}
              <th style={{ padding: '2mm 2mm', textAlign: 'left', fontWeight: highContrast ? 800 : Math.max(700, baseFW), fontSize: `${11 * scaleVal}px`, color: 'rgba(255,255,255,0.5)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>{L.description}</th>
              {hasAuthor && <th style={{ padding: '2mm 2mm', textAlign: 'left', fontWeight: highContrast ? 800 : Math.max(700, baseFW), fontSize: `${11 * scaleVal}px`, color: 'rgba(255,255,255,0.5)', letterSpacing: '1.5px', textTransform: 'uppercase', width: '12%' }}>Author</th>}
              {hasIsbn && <th style={{ padding: '2mm 2mm', textAlign: 'left', fontWeight: highContrast ? 800 : Math.max(700, baseFW), fontSize: `${11 * scaleVal}px`, color: 'rgba(255,255,255,0.5)', letterSpacing: '1.5px', textTransform: 'uppercase', width: '15%' }}>ISBN</th>}
              <th style={{ padding: '2mm 2mm', textAlign: 'right', fontWeight: highContrast ? 800 : Math.max(700, baseFW), fontSize: `${11 * scaleVal}px`, color: 'rgba(255,255,255,0.5)', letterSpacing: '1.5px', textTransform: 'uppercase', width: '11%' }}>{L.unitPrice}</th>
              <th style={{ padding: '2mm 2mm', textAlign: 'center', fontWeight: highContrast ? 800 : Math.max(700, baseFW), fontSize: `${11 * scaleVal}px`, color: 'rgba(255,255,255,0.5)', letterSpacing: '1.5px', textTransform: 'uppercase', width: '8%' }}>{L.quantity}</th>
              <th style={{ padding: '2mm 2mm', textAlign: 'right', fontWeight: highContrast ? 800 : Math.max(700, baseFW), fontSize: `${11 * scaleVal}px`, color: 'rgba(255,255,255,0.5)', letterSpacing: '1.5px', textTransform: 'uppercase', width: '15%' }}>{L.amount}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: { srNo: number; slNo?: string; productName: string; author?: string; isbn?: string; quantity: number; unitPrice: number; lineTotal: number }, idx: number) => (
              <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.03)', pageBreakInside: 'avoid' }}>
                <td style={{ padding: '1.5mm 2mm', color: 'rgba(255,255,255,0.4)', fontSize: `${10 * scaleVal}px`, fontWeight: highContrast ? 600 : baseFW }}>{item.srNo}</td>
                {hasSlNo && <td style={{ padding: '1.5mm 2mm', fontFamily: 'monospace', fontSize: `${10 * scaleVal}px`, color: 'rgba(255,255,255,0.4)', fontWeight: highContrast ? 600 : baseFW }}>{item.slNo || '—'}</td>}
                <td style={{ padding: '1.5mm 2mm', fontWeight: highContrast ? 700 : Math.max(baseFW, 500), fontSize: `${10 * scaleVal}px`, color: '#f0f0f0' }}>{item.productName || '—'}</td>
                {hasAuthor && <td style={{ padding: '1.5mm 2mm', color: '#a0a0a0', fontSize: `${9.5 * scaleVal}px` }}>{item.author || '—'}</td>}
                {hasIsbn && <td style={{ padding: '1.5mm 2mm', fontFamily: 'monospace', fontSize: `${10 * scaleVal}px`, color: 'rgba(255,255,255,0.4)', fontWeight: highContrast ? 600 : baseFW }}>{item.isbn || '—'}</td>}
                <td style={{ padding: '1.5mm 2mm', textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: `${10 * scaleVal}px`, fontWeight: highContrast ? 600 : baseFW }}>₹{formatNumber(item.unitPrice)}</td>
                <td style={{ padding: '1.5mm 2mm', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: `${10 * scaleVal}px`, fontWeight: highContrast ? 600 : baseFW }}>{item.quantity}</td>
                <td style={{ padding: '1.5mm 2mm', textAlign: 'right', fontWeight: 800, color: accent, fontSize: '11px' }}>₹{formatNumber(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Bottom sections (only on last page) */}
        {isLastPage && (
          <>
            {/* Total box */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '5mm' }}>
          <div style={{ minWidth: '65mm', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2mm 4mm', fontSize: `${10 * scaleVal}px`, borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
              <span>{L.subtotal}</span><span>₹{formatNumber(calculations.subtotal)}</span>
            </div>
            {calculations.discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2mm 4mm', fontSize: `${10 * scaleVal}px`, borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#fc8181' }}>
                <span>{L.discount}</span><span>-₹{formatNumber(calculations.discountAmount)}</span>
              </div>
            )}
            {calculations.roundOff !== 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2mm 4mm', fontSize: `${10 * scaleVal}px`, borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
                <span>{L.roundOff}</span><span>₹{formatNumber(Math.abs(calculations.roundOff))}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4mm', backgroundColor: accent, fontSize: '15px', fontWeight: 900, color: 'white' }}>
              <span>{L.grandTotal}</span><span>{formatINR(calculations.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Amount in Words — fixed text color (was dark text on dark background = invisible) */}
        <div style={{ marginBottom: '5mm', padding: '3mm', border: `1px solid ${accent}66`, borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '1mm', fontWeight: 600 }}>{L.amountInWords}</div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{calculations.amountInWords}</div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '5mm', paddingTop: '4mm', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {business?.bankName && (
            <div style={{ flex: 1, fontSize: '11px' }}>
              <div style={{ fontWeight: 800, color: accent, marginBottom: '2mm', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{L.bankDetails}</div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '4mm', borderRadius: '8px', border: `1px solid ${accent}66` }}>
                <div style={{ marginBottom: '2px' }}><span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{L.bankName}: </span><strong style={{ color: '#ffffff', fontSize: '12px' }}>{business.bankName}</strong></div>
                {business.bankAccount && <div style={{ marginBottom: '2px' }}><span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{L.accountNumber}: </span><strong style={{ color: '#ffffff', fontSize: '12px', letterSpacing: '0.5px' }}>{business.bankAccount}</strong></div>}
                {business.bankIfsc && <div style={{ marginBottom: '2px' }}><span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{L.ifscCode}: </span><strong style={{ color: '#ffffff', fontSize: '12px', letterSpacing: '0.5px' }}>{business.bankIfsc}</strong></div>}
                {business.bankBranch && <div><span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{L.branch}: </span><strong style={{ color: '#ffffff' }}>{business.bankBranch}</strong></div>}
              </div>
            </div>
          )}
          
          {(business?.upiQrPath || business?.upiId) && (
            <div style={{ flex: '0 0 auto', textAlign: 'center', alignSelf: 'center', padding: '0 4mm' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, color: accent, marginBottom: '2mm', textTransform: 'uppercase' }}>Scan to Pay</div>
              <div style={{ background: '#fff', padding: '4px', borderRadius: '4px', display: 'inline-block' }}>
                {business.upiId ? (
                  <QRCodeSVG 
                    value={`upi://pay?pa=${business.upiId}&pn=${encodeURIComponent(business.name)}&am=${calculations.grandTotal}&cu=INR`}
                    size={60}
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                ) : (
                  <img src={business.upiQrPath} alt="UPI QR" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
                )}
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center', minWidth: '45mm' }}>
            {business?.signaturePath && <img src={business.signaturePath} alt="sig" style={{ height: '14mm', maxWidth: '44mm', objectFit: 'contain', display: 'block', margin: '0 auto 2mm', filter: 'brightness(0) invert(1)' }} />}
            <div style={{ borderTop: `1px solid ${accent}`, paddingTop: '2mm', fontSize: '9px', color: 'rgba(255,255,255,0.5)' }}>{L.authorizedSignatory}</div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#fff' }}>{business?.name ?? ''}</div>
            {business?.terms && <div style={{ marginTop: '4mm', fontSize: '9px', color: 'rgba(255,255,255,0.3)', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '3mm' }}><strong style={{ color: 'rgba(255,255,255,0.5)' }}>{L.termsAndConditions}:</strong> {business.terms}</div>}
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
