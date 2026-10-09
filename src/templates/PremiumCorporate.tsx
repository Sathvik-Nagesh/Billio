import React from 'react';
import type { TemplateProps } from './types';
import { getLabels } from '@/lib/utils/kannadaLabels';
import { formatNumber, formatINR } from '@/lib/utils/currency';
import { useAppSettingsStore } from '@/stores/useAppSettingsStore';
import { formatDate } from '@/lib/utils/dateFormat';
import { QRCodeSVG } from 'qrcode.react';

export function PremiumCorporate({ invoice, business, items, calculations, language, themeOverrides, pageNumber = 1, totalPages = 1 }: TemplateProps) {
  const L = getLabels(language);
  const accent = themeOverrides?.accentColor ?? business?.accentColor ?? '#4F46E5';
  const font = themeOverrides?.fontFamily ?? 'Outfit';
  const logoSize = themeOverrides?.logoSize ?? 'medium';
  const headerLayout = themeOverrides?.headerLayout ?? 'split';
  const borderStyle = themeOverrides?.borderStyle ?? 'lines';
  const logoSizePx = { small: 56, medium: 80, large: 110 }[logoSize];
  const lineHeightVal = { compact: '1.25', normal: '1.45', relaxed: '1.65' }[themeOverrides?.lineSpacing ?? 'normal'];
  
  const hasIsbn = items.some((i: any) => i.isbn && i.isbn.trim() !== '');
  const hasSlNo = items.some((i: any) => i.slNo && i.slNo.trim() !== '');
  const hasAuthor = items.some((i: any) => i.author && i.author.trim() !== '');
  const isFirstPage = pageNumber === 1;
  const isLastPage = pageNumber === totalPages;

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

  const totalColumns = 5 + (hasSlNo ? 1 : 0) + (hasAuthor ? 1 : 0) + (hasIsbn ? 1 : 0);

  return (
    <div
      id="invoice-print-area"
      style={{
        fontFamily: `'${font}', system-ui, sans-serif`,
        width: '100%',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        color: '#0f172a',
        position: 'relative',
        boxSizing: 'border-box',
        border: borderStyle === 'boxed' ? `2px solid ${accent}` : borderStyle === 'lines' ? (printFriendly ? '1px solid #94a3b8' : '1px solid #e2e8f0') : 'none',
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
          color: `${accent}15`, pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 50,
        }}>
          {themeOverrides.watermarkText ?? 'ORIGINAL'}
        </div>
      )}

      {/* Header */}
      <div data-measure="header">
        {isFirstPage ? (
          <>
            {/* Gradient Banner */}
            <div style={{
              background: printFriendly ? '#0f172a' : `linear-gradient(135deg, ${accent} 0%, ${accent}dd 100%)`,
              padding: '5mm 8mm',
              color: '#ffffff',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              justifyContent: headerLayout === 'split' ? 'space-between' : 'center',
              flexDirection: headerLayout === 'centered' ? 'column' : 'row',
              textAlign: headerLayout === 'centered' ? 'center' : 'left',
              alignItems: 'center',
              gap: '4mm',
            }}>
              {/* Business Name & Logo */}
              <div style={{ zIndex: 1, maxWidth: headerLayout === 'split' ? '60%' : '100%' }}>
                {business?.logoPath ? (
                  <img src={business.logoPath} alt="logo" style={{ height: `${logoSizePx}px`, maxWidth: '180px', objectFit: 'contain', marginBottom: '2mm', background: 'rgba(255,255,255,0.95)', padding: '3px 8px', borderRadius: '6px', display: 'block', margin: headerLayout === 'centered' ? '0 auto 2mm' : '0 0 2mm' }} />
                ) : null}
                <div style={{ fontSize: `${22 * scaleVal}px`, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '1mm' }}>
                  {business?.name ?? 'Your Business'}
                </div>
                {business?.address && <div style={{ opacity: 0.9, fontSize: `${10.5 * scaleVal}px`, whiteSpace: 'pre-line' }}>{business.address}</div>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3mm', marginTop: '1mm', fontSize: `${10 * scaleVal}px`, opacity: 0.85, justifyContent: headerLayout === 'centered' ? 'center' : 'flex-start' }}>
                  {business?.phone && <span>📞 {business.phone}</span>}
                  {business?.email && <span>✉ {business.email}</span>}
                  {business?.gstin && <span style={{ fontWeight: 700 }}>GSTIN: {business.gstin}</span>}
                </div>
              </div>

              {/* Title & Invoice Number Badge */}
              <div style={{ zIndex: 1, textAlign: headerLayout === 'centered' ? 'center' : 'right', minWidth: '55mm' }}>
                <div style={{ display: 'inline-block', backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1.5mm' }}>
                  CASH / CREDIT
                </div>
                <div style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '2mm' }}>
                  {invoiceLabel}
                </div>
                <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '2.5mm 3.5mm', borderRadius: '6px', fontSize: `${10 * scaleVal}px`, textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8mm' }}>
                    <span style={{ opacity: 0.8 }}>{L.invoiceNumber}:</span>
                    <strong>{invoice.invoiceNumber ?? '—'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ opacity: 0.8 }}>{L.invoiceDate}:</span>
                    <strong>{formatDate(invoice.invoiceDate, dateFormat) || '—'}</strong>
                  </div>
                  {invoice.dueDate && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.8mm' }}>
                      <span style={{ opacity: 0.8 }}>{L.dueDate}:</span>
                      <strong>{formatDate(invoice.dueDate, dateFormat)}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bill To Details Bar */}
            <div style={{ padding: '3mm 8mm', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4mm' }}>
              <div>
                <div style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: accent, marginBottom: '0.5mm' }}>
                  {L.billTo}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{invoice.customerName ?? 'Walk-in Customer'}</div>
                {invoice.customerAddress && <div style={{ color: '#475569', fontSize: `${10 * scaleVal}px`, whiteSpace: 'pre-line' }}>{invoice.customerAddress}</div>}
              </div>
              <div style={{ fontSize: `${10 * scaleVal}px`, color: '#64748b', textAlign: 'right' }}>
                {invoice.customerPhone && <div>📞 {invoice.customerPhone}</div>}
                {invoice.customerEmail && <div>✉ {invoice.customerEmail}</div>}
                {invoice.customerGstin && <div style={{ fontWeight: 700, color: '#0f172a' }}>GSTIN: {invoice.customerGstin}</div>}
              </div>
            </div>
          </>
        ) : (
          /* Subsequent Page Header */
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3mm 8mm', borderBottom: `2px solid ${accent}`, backgroundColor: '#f8fafc', fontSize: `${10 * scaleVal}px` }}>
            <span style={{ fontWeight: 700, color: accent }}>{business?.name} — {invoiceLabel} #{invoice.invoiceNumber}</span>
            <span style={{ color: '#64748b' }}>Page {pageNumber} of {totalPages}</span>
          </div>
        )}
      </div>

      {/* Items Table Container */}
      <div style={{ padding: '3mm 8mm 0', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, minHeight: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: `${10 * scaleVal}px`, tableLayout: 'auto' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${accent}` }}>
                <th style={{ padding: '2mm 2.5mm', textAlign: 'center', fontWeight: 700, color: accent, width: '38px', textTransform: 'uppercase', fontSize: `${10 * scaleVal}px` }}>{L.srNo}</th>
                {hasSlNo && (
                  <th style={{ padding: '2mm 2mm', textAlign: 'center', fontWeight: 700, color: accent, width: '55px', textTransform: 'uppercase', fontSize: `${10 * scaleVal}px` }}>Sel. No.</th>
                )}
                <th style={{ padding: '2mm 2.5mm', textAlign: 'left', fontWeight: 700, color: accent, textTransform: 'uppercase', fontSize: `${10 * scaleVal}px` }}>{L.description}</th>
                {hasAuthor && (
                  <th style={{ padding: '2mm 2mm', textAlign: 'left', fontWeight: 700, color: accent, width: '110px', textTransform: 'uppercase', fontSize: `${10 * scaleVal}px` }}>Author</th>
                )}
                {hasIsbn && (
                  <th style={{ padding: '2mm 2mm', textAlign: 'left', fontWeight: 700, color: accent, width: '90px', textTransform: 'uppercase', fontSize: `${10 * scaleVal}px` }}>{L.isbn}</th>
                )}
                <th style={{ padding: '2mm 2.5mm', textAlign: 'right', fontWeight: 700, color: accent, width: '75px', textTransform: 'uppercase', fontSize: `${10 * scaleVal}px` }}>{L.unitPrice}</th>
                <th style={{ padding: '2mm 2mm', textAlign: 'center', fontWeight: 700, color: accent, width: '45px', textTransform: 'uppercase', fontSize: `${10 * scaleVal}px` }}>{L.quantity}</th>
                <th style={{ padding: '2mm 2.5mm', textAlign: 'right', fontWeight: 700, color: accent, width: '85px', textTransform: 'uppercase', fontSize: `${10 * scaleVal}px` }}>{L.amount}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, idx: number) => (
                <tr key={idx} data-measure="row" style={{
                  borderBottom: printFriendly ? '1px solid #cbd5e1' : '1px solid #f1f5f9',
                  backgroundColor: idx % 2 === 1 ? '#fcfcfd' : 'transparent',
                  pageBreakInside: 'avoid',
                }}>
                  <td style={{ padding: '2mm 2.5mm', textAlign: 'center', color: '#64748b' }}>{item.srNo}</td>
                  {hasSlNo && (
                    <td style={{ padding: '2mm 2mm', textAlign: 'center', fontFamily: 'monospace', color: '#475569' }}>{item.slNo || '—'}</td>
                  )}
                  <td style={{ padding: '2mm 2.5mm', fontWeight: 600, color: '#0f172a', fontSize: `${10.5 * scaleVal * titleScale}px` }}>{item.productName || '—'}</td>
                  {hasAuthor && (
                    <td style={{ padding: '2mm 2mm', color: '#475569', fontSize: `${9.5 * scaleVal * authorScale}px` }}>{item.author || '—'}</td>
                  )}
                  {hasIsbn && (
                    <td style={{ padding: '2mm 2mm', fontFamily: 'monospace', color: '#475569', fontSize: `${9.5 * scaleVal}px` }}>{item.isbn || '—'}</td>
                  )}
                  <td style={{ padding: '2mm 2.5mm', textAlign: 'right', color: '#334155' }}>₹{formatNumber(item.unitPrice)}</td>
                  <td style={{ padding: '2mm 2mm', textAlign: 'center', fontWeight: 600, color: '#0f172a' }}>{item.quantity}</td>
                  <td style={{ padding: '2mm 2.5mm', textAlign: 'right', fontWeight: 700, color: accent }}>₹{formatNumber(item.lineTotal)}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={totalColumns} style={{ padding: '6mm', textAlign: 'center', color: '#94a3b8' }}>No items added yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Continuation Notice */}
        {!isLastPage && (
          <div style={{ textAlign: 'center', margin: '3mm 0', fontSize: '10px', color: '#64748b', fontStyle: 'italic', fontWeight: 600 }}>
            Continued on Page {pageNumber + 1}...
          </div>
        )}

        {/* Footer (Only on last page) */}
        {isLastPage && (
          <div data-measure="footer" style={{ marginTop: 'auto', paddingTop: '3mm', paddingBottom: '5mm' }}>
            {/* Financial Summary Box */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '4mm', marginBottom: '3mm' }}>
              {/* Amount In Words & Notes */}
              <div style={{ flex: 1, backgroundColor: `${accent}06`, border: `1px solid ${accent}20`, borderRadius: '6px', padding: '2.5mm 3.5mm' }}>
                <div style={{ fontSize: '9px', color: accent, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1mm', fontWeight: 800 }}>
                  {L.amountInWords}
                </div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', lineHeight: 1.35 }}>
                  {calculations.amountInWords}
                </div>
                {invoice.customerNotes && (
                  <div style={{ marginTop: '2mm', paddingTop: '1.5mm', borderTop: '1px dashed #cbd5e1', fontSize: '9.5px', color: '#475569' }}>
                    <strong>Notes:</strong> {invoice.customerNotes}
                  </div>
                )}
              </div>

              {/* Totals Box */}
              <div style={{ minWidth: '68mm', border: `1px solid ${accent}30`, borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5mm 3.5mm', fontSize: `${10 * scaleVal}px`, color: '#64748b' }}>
                  <span>{L.subtotal}</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>₹{formatNumber(calculations.subtotal)}</span>
                </div>
                {calculations.discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5mm 3.5mm', fontSize: `${10 * scaleVal}px`, color: '#ef4444', backgroundColor: '#fef2f2' }}>
                    <span>{L.discount}</span>
                    <span style={{ fontWeight: 600 }}>-₹{formatNumber(calculations.discountAmount)}</span>
                  </div>
                )}
                {calculations.roundOff !== 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5mm 3.5mm', fontSize: `${10 * scaleVal}px`, color: '#64748b' }}>
                    <span>{L.roundOff}</span>
                    <span>{calculations.roundOff > 0 ? '+' : ''}₹{formatNumber(Math.abs(calculations.roundOff))}</span>
                  </div>
                )}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', padding: '2.5mm 3.5mm',
                  background: printFriendly ? '#0f172a' : `linear-gradient(135deg, ${accent} 0%, ${accent}dd 100%)`,
                  color: '#ffffff', fontSize: '13px', fontWeight: 800,
                }}>
                  <span>{L.grandTotal}</span>
                  <span>{formatINR(calculations.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Bottom Bar: Bank Details + QR + Signature */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '3mm', borderTop: '1px solid #e2e8f0', paddingTop: '2.5mm' }}>
              {business?.bankName ? (
                <div style={{ flex: 1, fontSize: '9.5px', color: '#475569', backgroundColor: '#f8fafc', padding: '2mm 3.5mm', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 800, color: accent, textTransform: 'uppercase', marginBottom: '0.5mm', fontSize: '9px' }}>{L.bankDetails}</div>
                  <div><strong>Bank:</strong> {business.bankName} | <strong>A/C:</strong> {business.bankAccount || '—'}</div>
                  <div><strong>IFSC:</strong> {business.bankIfsc || '—'}{business.bankBranch ? ` | Branch: ${business.bankBranch}` : ''}</div>
                </div>
              ) : <div style={{ flex: 1 }} />}

              {/* Dynamic QR */}
              {(business?.upiQrPath || business?.upiId) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '2mm', padding: '1mm 2.5mm', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                  {business.upiId ? (
                    <QRCodeSVG 
                      value={`upi://pay?pa=${business.upiId}&pn=${encodeURIComponent(business.name)}&am=${calculations.grandTotal}&cu=INR`}
                      size={48}
                      level="M"
                    />
                  ) : (
                    <img src={business.upiQrPath} alt="UPI QR" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                  )}
                  <div style={{ fontSize: '8.5px', color: '#64748b' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>Scan & Pay</div>
                    <div>UPI / QR</div>
                  </div>
                </div>
              )}

              {/* Signature */}
              <div style={{ textAlign: 'center', minWidth: '40mm' }}>
                {business?.signaturePath && (
                  <img src={business.signaturePath} alt="Signature" style={{ height: '12mm', maxWidth: '38mm', objectFit: 'contain', display: 'block', margin: '0 auto 1mm' }} />
                )}
                <div style={{ borderTop: `1px solid ${accent}`, paddingTop: '1mm', fontSize: '9px', color: '#64748b' }}>
                  {L.authorizedSignatory}
                </div>
                <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#0f172a' }}>
                  {L.forCompany} {business?.name ?? ''}
                </div>
              </div>
            </div>

            {/* Terms */}
            {business?.terms && (
              <div style={{ fontSize: '8px', color: '#94a3b8', marginTop: '1.5mm', borderTop: '1px dotted #e2e8f0', paddingTop: '1mm', whiteSpace: 'pre-line' }}>
                <strong>Terms:</strong> {business.terms}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
