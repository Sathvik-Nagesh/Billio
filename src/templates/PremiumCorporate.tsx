import React from 'react';
import type { TemplateProps } from './types';
import { getLabels } from '@/lib/utils/kannadaLabels';
import { formatNumber, formatINR } from '@/lib/utils/currency';
import { useAppSettingsStore } from '@/stores/useAppSettingsStore';
import { formatDate } from '@/lib/utils/dateFormat';
import { QRCodeSVG } from 'qrcode.react';

export function PremiumCorporate({ invoice, business, items, calculations, language, themeOverrides }: TemplateProps) {
  const L = getLabels(language);
  const accent = themeOverrides?.accentColor ?? business?.accentColor ?? '#6366F1';
  const font = themeOverrides?.fontFamily ?? 'Outfit';
  const logoSize = themeOverrides?.logoSize ?? 'medium';
  const headerLayout = themeOverrides?.headerLayout ?? 'split';
  const borderStyle = themeOverrides?.borderStyle ?? 'lines';
  const logoSizePx = { small: 64, medium: 90, large: 120 }[logoSize];
  const lineHeightVal = { compact: '1.25', normal: '1.5', relaxed: '1.75' }[themeOverrides?.lineSpacing ?? 'normal'];
  const hasIsbn = items.some((i: { isbn?: string; slNo?: string }) => i.isbn);
  const hasSlNo = items.some((i: any) => i.slNo && i.slNo.trim() !== '');
  const hasAuthor = items.some((i: any) => i.author && i.author.trim() !== '');
  const isLastPage = arguments[0].pageNumber === undefined || arguments[0].totalPages === undefined || arguments[0].pageNumber === arguments[0].totalPages;

  // Font weight / size / print helpers
  const fwMap: Record<string, number> = { light: 300, regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 };
  const baseFW = fwMap[themeOverrides?.fontWeight ?? 'regular'];
  const scaleVal = parseInt(themeOverrides?.fontSize ?? '100') / 100;
  const titleScale = parseInt(themeOverrides?.tableTitleFontSize ?? '100') / 100;
  const authorScale = parseInt(themeOverrides?.tableAuthorFontSize ?? '100') / 100;
  const printFriendly = themeOverrides?.printFriendly ?? false;
  const highContrast = themeOverrides?.highContrast ?? false;

  const { dateFormat, documentLabel } = useAppSettingsStore();
  const invoiceLabel = documentLabel === 'bill' ? L.bill : L.invoice;

  return (
    <div
      id="invoice-print-area"
      style={{
        fontFamily: `'${font}', sans-serif`,
        width: '210mm',
        backgroundColor: '#ffffff',
        color: '#1e293b',
        position: 'relative',
        minHeight: '296mm',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        border: borderStyle === 'boxed' ? `2px solid ${accent}` : borderStyle === 'lines' ? (printFriendly ? '1px solid #9ca3af' : '1px solid #e2e8f0') : 'none',
        fontSize: `${11 * scaleVal}px`,
        lineHeight: lineHeightVal,
        fontWeight: baseFW,
      }}
    >
      {/* Watermark */}
      {themeOverrides?.showWatermark && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%) rotate(-35deg)',
          fontSize: '72px', fontWeight: 900, letterSpacing: '8px',
          color: `${accent}10`, pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 50,
        }}>
          {themeOverrides.watermarkText ?? 'ORIGINAL'}
        </div>
      )}

      <div data-measure="header">
      {/* Header Block */}
      <div style={{
        background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`,
        padding: '4mm 6mm',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: '-30px', right: '60px', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.06)' }} />

        <div style={{ display: 'flex', justifyContent: headerLayout === 'split' ? 'space-between' : headerLayout === 'centered' ? 'center' : 'flex-start',
        flexDirection: headerLayout === 'centered' ? 'column' : 'row',
        textAlign: headerLayout === 'centered' ? 'center' : 'left', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
          <div>
            {business?.logoPath ? (
              <img src={business.logoPath} alt="logo" style={{ height: `${logoSizePx}px`, maxWidth: '180px', objectFit: 'contain', marginBottom: '3mm', background: 'rgba(255,255,255,0.9)', padding: '4px 8px', borderRadius: '8px' }} />
            ) : null}
            <div style={{ fontSize: `${22 * scaleVal}px`, fontWeight: highContrast ? 900 : 800, letterSpacing: '-0.5px', marginBottom: '2mm' }}>{business?.name ?? 'Your Business'}</div>
            {business?.logoPath && (
              <div style={{ fontSize: `${18 * scaleVal}px`, fontWeight: highContrast ? 800 : 700 }}>{business.name}</div>
            )}
            {business?.address && <div style={{ opacity: 0.8, fontSize: `${11 * scaleVal}px`, marginTop: '1mm', whiteSpace: 'pre-line' }}>{business.address}</div>}
            {business?.gstin && <div style={{ opacity: 0.7, fontSize: `${11 * scaleVal}px`, marginTop: '1mm' }}>GSTIN: {business.gstin}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 800, fontSize: '11px', marginBottom: '2mm', letterSpacing: '0.5px', color: 'white' }}>CASH / CREDIT</div>
            <div style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '2px', opacity: 0.9, textTransform: 'uppercase' }}>{invoiceLabel}</div>
            <div style={{ fontSize: `${11 * scaleVal}px`, opacity: 0.8, marginTop: '2mm' }}>
              <div><span style={{ opacity: 0.7 }}>{L.invoiceNumber}: </span><strong>{invoice.invoiceNumber ?? '—'}</strong></div>
              <div><span style={{ opacity: 0.7 }}>{L.invoiceDate}: </span><strong>{formatDate(invoice.invoiceDate, dateFormat) || '—'}</strong></div>
              {invoice.dueDate && <div><span style={{ opacity: 0.7 }}>{L.dueDate}: </span><strong>{formatDate(invoice.dueDate, dateFormat) || ''}</strong></div>}
            </div>
          </div>
        </div>
      </div>

      </div>

      {/* Body */}
      <div style={{ padding: '4mm 8mm 0', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Bill To */}
        <div style={{ marginBottom: '1.5mm', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '4mm' }}>
          <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: accent, marginBottom: '2mm' }}>{L.billTo}</div>
          <div style={{ fontSize: '13px', fontWeight: 700 }}>{invoice.customerName ?? 'Customer Name'}</div>
          {invoice.customerAddress && <div style={{ color: '#64748b', fontSize: `${10 * scaleVal}px`, marginTop: '1mm', whiteSpace: 'pre-line' }}>{invoice.customerAddress}</div>}
          {invoice.customerPhone && <div style={{ color: '#64748b', fontSize: `${10 * scaleVal}px` }}>{L.phone}: {invoice.customerPhone}</div>}
          {invoice.customerEmail && <div style={{ color: '#64748b', fontSize: `${10 * scaleVal}px` }}>{L.email}: {invoice.customerEmail}</div>}
          {invoice.customerGstin && <div style={{ color: '#64748b', fontSize: `${10 * scaleVal}px` }}>{L.gstin}: {invoice.customerGstin}</div>}
        </div>

        {/* Items Table */}
        <div style={{ flex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '3mm', fontSize: `${10 * scaleVal}px` }}>
          <thead>
            <tr>
              <th style={{ padding: '1.5mm 2mm', textAlign: 'left', fontWeight: highContrast ? 800 : Math.max(700, baseFW), fontSize: `${11 * scaleVal}px`, borderBottom: `2px solid ${accent}`, width: '5%', textTransform: 'uppercase', letterSpacing: '0.5px', color: accent }}>{L.srNo}</th>
                <th style={{ padding: '1.5mm 2mm', textAlign: 'left', fontWeight: highContrast ? 800 : Math.max(700, baseFW), fontSize: `${11 * scaleVal}px`, borderBottom: `2px solid ${accent}`, width: '6%', textTransform: 'uppercase', letterSpacing: '0.5px', color: accent }}>Sel. No.</th>
              <th style={{ padding: '1.5mm 2mm', textAlign: 'left', fontWeight: highContrast ? 800 : Math.max(700, baseFW), fontSize: `${11 * scaleVal}px`, borderBottom: `2px solid ${accent}`, textTransform: 'uppercase', letterSpacing: '0.5px', color: accent, width: hasSlNo ? '35%' : '40%' }}>{L.description}</th>
              {hasAuthor && (
                <th style={{ padding: '1.5mm 2mm', textAlign: 'left', fontWeight: highContrast ? 800 : Math.max(700, baseFW), fontSize: `${11 * scaleVal}px`, borderBottom: `2px solid ${accent}`, textTransform: 'uppercase', letterSpacing: '0.5px', color: accent, width: '20%' }}>Author</th>
              )}
              {hasIsbn && (
                <th style={{ padding: '1.5mm 2mm', textAlign: 'left', fontWeight: highContrast ? 800 : Math.max(700, baseFW), fontSize: `${11 * scaleVal}px`, borderBottom: `2px solid ${accent}`, width: '12%', textTransform: 'uppercase', letterSpacing: '0.5px', color: accent }}>{L.isbn}</th>
              )}
              <th style={{ padding: '1.5mm 2mm', textAlign: 'right', fontWeight: highContrast ? 800 : Math.max(700, baseFW), fontSize: `${11 * scaleVal}px`, borderBottom: `2px solid ${accent}`, width: '10%', textTransform: 'uppercase', letterSpacing: '0.5px', color: accent }}>{L.unitPrice}</th>
              <th style={{ padding: '1.5mm 2mm', textAlign: 'center', fontWeight: highContrast ? 800 : Math.max(700, baseFW), fontSize: `${11 * scaleVal}px`, borderBottom: `2px solid ${accent}`, width: '6%', textTransform: 'uppercase', letterSpacing: '0.5px', color: accent }}>{L.quantity}</th>
              <th style={{ padding: '1.5mm 2mm', textAlign: 'right', fontWeight: highContrast ? 800 : Math.max(700, baseFW), fontSize: `${11 * scaleVal}px`, borderBottom: `2px solid ${accent}`, width: '12%', textTransform: 'uppercase', letterSpacing: '0.5px', color: accent }}>{L.amount}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: { srNo: number; slNo?: string; productName: string; author?: string; isbn?: string; quantity: number; unitPrice: number; lineTotal: number }, idx: number) => (
              <tr key={idx} data-measure="row" style={{
                borderBottom: printFriendly ? '1px solid #d1d5db' : '1px solid #f1f5f9',
                backgroundColor: 'transparent',
                pageBreakInside: 'avoid',
              }}>
                <td style={{ padding: '1.5mm 2mm', color: printFriendly ? '#1e293b' : (highContrast ? '#0f172a' : '#475569'), fontSize: `${10 * scaleVal}px`, fontWeight: highContrast ? 600 : baseFW }}>{item.srNo}</td>
                {hasSlNo && (
                  <td style={{ padding: '1.5mm 2mm', color: printFriendly ? '#1e293b' : (highContrast ? '#0f172a' : '#475569'), fontFamily: 'monospace', fontSize: `${10 * scaleVal}px`, fontWeight: highContrast ? 600 : baseFW }}>{item.slNo || '—'}</td>
                )}
                <td style={{ padding: '1.5mm 2mm', fontWeight: highContrast ? 700 : Math.max(baseFW, 500), fontSize: `${10 * scaleVal * titleScale}px`, color: printFriendly ? '#0f172a' : '#1e293b' }}>{item.productName || '—'}</td>
                {hasAuthor && (
                  <td style={{ padding: '1.5mm 2mm', color: printFriendly ? '#475569' : '#64748b', fontSize: `${9.5 * scaleVal * authorScale}px` }}>{item.author || '—'}</td>
                )}
                {hasIsbn && (
                  <td style={{ padding: '1.5mm 2mm', color: printFriendly ? '#1e293b' : (highContrast ? '#0f172a' : '#475569'), fontFamily: 'monospace', fontSize: `${10 * scaleVal}px`, fontWeight: highContrast ? 600 : baseFW }}>{item.isbn || '—'}</td>
                )}
                <td style={{ padding: '1.5mm 2mm', textAlign: 'right', color: printFriendly ? '#1e293b' : (highContrast ? '#0f172a' : '#475569'), fontSize: `${10 * scaleVal}px`, fontWeight: highContrast ? 600 : baseFW }}>₹{formatNumber(item.unitPrice)}</td>
                <td style={{ padding: '1.5mm 2mm', textAlign: 'center', color: printFriendly ? '#1e293b' : (highContrast ? '#0f172a' : '#475569'), fontSize: `${10 * scaleVal}px`, fontWeight: highContrast ? 600 : baseFW }}>{item.quantity}</td>
                <td style={{ padding: '1.5mm 2mm', textAlign: 'right', fontWeight: 600, color: accent }}>₹{formatNumber(item.lineTotal)}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '5mm', textAlign: 'center', color: '#94a3b8' }}>No items</td></tr>
            )}
          </tbody>
        </table>
        </div>

        {/* Continuation Notice */}
        {!isLastPage && (
          <div style={{ textAlign: 'center', margin: '4mm 0', fontSize: '11px', color: '#64748b', fontStyle: 'italic', fontWeight: 600 }}>
            Continued on next page...
          </div>
        )}

        {/* Bottom sections (only on last page) */}
        {isLastPage && (
          <div data-measure="footer" style={{ marginTop: 'auto', paddingBottom: '7mm' }}>
            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '3mm' }}>
          <div style={{ minWidth: '68mm' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2mm 3mm', fontSize: `${10 * scaleVal}px` }}>
              <span style={{ color: '#64748b' }}>{L.subtotal}</span>
              <span style={{ fontWeight: 600 }}>₹{formatNumber(calculations.subtotal)}</span>
            </div>
            {calculations.discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2mm 3mm', fontSize: `${10 * scaleVal}px`, color: '#ef4444' }}>
                <span>{L.discount}</span>
                <span>-₹{formatNumber(calculations.discountAmount)}</span>
              </div>
            )}
            {calculations.roundOff !== 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2mm 3mm', fontSize: `${10 * scaleVal}px`, color: '#94a3b8' }}>
                <span>{L.roundOff}</span>
                <span>₹{formatNumber(Math.abs(calculations.roundOff))}</span>
              </div>
            )}
            <div style={{
              display: 'flex', justifyContent: 'space-between', padding: '3.5mm 5mm', marginTop: '2mm',
              background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`,
              color: 'white', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
            }}>
              <span>{L.grandTotal}</span>
              <span>{formatINR(calculations.grandTotal)}</span>
            </div>
            {/* Fixed div nesting — was broken in original (missing closing div) */}
            <div style={{ marginTop: '4mm', padding: '3mm', border: `1px solid ${accent}40`, borderRadius: '4px', backgroundColor: `${accent}05` }}>
              <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', marginBottom: '1mm', fontWeight: 600 }}>{L.amountInWords}</div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b' }}>{calculations.amountInWords}</div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div style={{ display: 'flex', gap: '4mm', marginBottom: '3mm' }}>
          {/* Bank Details */}
          {business?.bankName && (
            <div style={{ flex: 1, fontSize: '11px' }}>
              <div style={{ fontWeight: 800, color: accent, marginBottom: '2mm', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{L.bankDetails}</div>
              <div style={{ backgroundColor: printFriendly ? '#f3f4f6' : '#f8fafc', border: printFriendly ? `2px solid #9ca3af` : `2px solid ${accent}40`, padding: '4mm', borderRadius: '8px' }}>
                <div style={{ marginBottom: '2px' }}><span style={{ color: '#475569', fontWeight: 600 }}>{L.bankName}: </span><strong style={{ color: '#0f172a', fontSize: '12px' }}>{business.bankName}</strong></div>
                {business.bankAccount && <div style={{ marginBottom: '2px' }}><span style={{ color: '#475569', fontWeight: 600 }}>{L.accountNumber}: </span><strong style={{ color: '#0f172a', fontSize: '12px', letterSpacing: '0.5px' }}>{business.bankAccount}</strong></div>}
                {business.bankIfsc && <div style={{ marginBottom: '2px' }}><span style={{ color: '#475569', fontWeight: 600 }}>{L.ifscCode}: </span><strong style={{ color: '#0f172a', fontSize: '12px', letterSpacing: '0.5px' }}>{business.bankIfsc}</strong></div>}
                {business.bankBranch && <div><span style={{ color: '#475569', fontWeight: 600 }}>{L.branch}: </span><strong style={{ color: '#0f172a' }}>{business.bankBranch}</strong></div>}
              </div>
            </div>
          )}

          {/* QR + Signature */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3mm' }}>
            {(business?.upiQrPath || business?.upiId) && (
              <div style={{ textAlign: 'center' }}>
                {business.upiId ? (
                  <QRCodeSVG 
                    value={`upi://pay?pa=${business.upiId}&pn=${encodeURIComponent(business.name)}&am=${calculations.grandTotal}&cu=INR`}
                    size={60}
                    level="M"
                  />
                ) : (
                  <img src={business.upiQrPath} alt="UPI QR" style={{ width: '22mm', height: '22mm', objectFit: 'contain' }} />
                )}
                <div style={{ fontSize: '8px', color: '#94a3b8', marginTop: '1mm' }}>Scan to Pay</div>
              </div>
            )}
            <div style={{ textAlign: 'center', minWidth: '45mm' }}>
              {business?.signaturePath && (
                <img src={business.signaturePath} alt="Signature" style={{ height: '14mm', maxWidth: '44mm', objectFit: 'contain', display: 'block', margin: '0 auto 2mm' }} />
              )}
              <div style={{ borderTop: `2px solid ${accent}`, paddingTop: '2mm', fontSize: '9px', color: '#64748b' }}>{L.authorizedSignatory}</div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#1e293b' }}>{L.forCompany} {business?.name ?? ''}</div>
            </div>
          </div>
        </div>

        {/* Terms */}
        {business?.terms && (
          <div style={{ fontSize: '9px', color: '#94a3b8', borderTop: printFriendly ? '1px solid #9ca3af' : '1px solid #e2e8f0', paddingTop: '3mm' }}>
            <div style={{ fontWeight: 700, color: '#64748b', marginBottom: '1mm', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{L.termsAndConditions}</div>
            <div style={{ whiteSpace: 'pre-line' }}>{business.terms}</div>
          </div>
        )}
          </div>
        )}
      </div>

      {/* Footer bar */}
      <div style={{ height: '6px', background: `linear-gradient(90deg, ${accent} 0%, ${accent}44 100%)` }} />
    </div>
  );
}
