import React from 'react';
import type { TemplateProps } from './types';
import { getLabels } from '@/lib/utils/kannadaLabels';
import { formatNumber, formatINR } from '@/lib/utils/currency';
import { useAppSettingsStore } from '@/stores/useAppSettingsStore';
import { formatDate } from '@/lib/utils/dateFormat';
import { QRCodeSVG } from 'qrcode.react';

export function ElegantSerif({ invoice, business, items, calculations, language, themeOverrides, pageNumber = 1, totalPages = 1 }: TemplateProps) {
  const L = getLabels(language);
  const accent = themeOverrides?.accentColor ?? business?.accentColor ?? '#7c2d12';
  const font = themeOverrides?.fontFamily ?? 'Playfair Display';
  const headerLayout = themeOverrides?.headerLayout ?? 'centered';
  const borderStyle = themeOverrides?.borderStyle ?? 'lines';
  const logoSizePx = { small: 56, medium: 75, large: 100 }[themeOverrides?.logoSize ?? 'medium'];
  const lineHeightVal = { compact: '1.25', normal: '1.45', relaxed: '1.65' }[themeOverrides?.lineSpacing ?? 'normal'];
  
  const hasIsbn = items.some((i: any) => i.isbn && i.isbn.trim() !== '');
  const hasAuthor = items.some((i: any) => i.author && i.author.trim() !== '');
  const hasSlNo = items.some((i: any) => i.slNo && i.slNo.trim() !== '');
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
        fontFamily: `'${font}', 'Merriweather', Georgia, serif`,
        width: '100%',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        color: '#1c1917',
        boxSizing: 'border-box',
        border: borderStyle === 'boxed' ? `2px solid ${accent}` : borderStyle === 'lines' ? (printFriendly ? '1px solid #94a3b8' : '1px solid #e7e5e4') : 'none',
        fontSize: `${10.5 * scaleVal}px`,
        lineHeight: lineHeightVal,
        position: 'relative',
        fontWeight: baseFW,
      }}
    >
      {/* Watermark */}
      {themeOverrides?.showWatermark && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%) rotate(-35deg)',
          fontSize: '64px', fontWeight: 900,
          color: `${accent}12`, pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 50,
        }}>
          {themeOverrides.watermarkText ?? 'ORIGINAL'}
        </div>
      )}

      {/* Ornamental top header line */}
      <div style={{ height: '3px', background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />

      <div style={{ padding: '4mm 8mm 6mm', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Header section */}
        <div data-measure="header">
          {isFirstPage ? (
            <>
              {/* Header Box */}
              <div style={{ textAlign: headerLayout === 'split' ? 'left' : 'center', marginBottom: '2.5mm', borderBottom: '1px solid #d6d3d1', paddingBottom: '2.5mm' }}>
                {business?.logoPath && <img src={business.logoPath} alt="logo" style={{ height: `${logoSizePx}px`, maxWidth: '160px', objectFit: 'contain', display: 'block', margin: headerLayout === 'split' ? '0 0 2mm' : '0 auto 2mm' }} />}
                <div style={{ fontSize: `${22 * scaleVal}px`, fontWeight: 800, color: printFriendly ? '#0f172a' : accent, letterSpacing: '0.5px', marginBottom: '1mm' }}>
                  {business?.name ?? 'Your Business'}
                </div>
                {business?.address && <div style={{ fontSize: `${10.5 * scaleVal}px`, color: '#44403c', fontFamily: 'Inter, system-ui, sans-serif', whiteSpace: 'pre-line' }}>{business.address}</div>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3mm', marginTop: '1mm', fontSize: `${9.5 * scaleVal}px`, color: '#57534e', fontFamily: 'Inter, system-ui, sans-serif', justifyContent: headerLayout === 'split' ? 'flex-start' : 'center' }}>
                  {business?.phone && <span>Ph: {business.phone}</span>}
                  {business?.email && <span>Email: {business.email}</span>}
                  {business?.gstin && <span style={{ fontWeight: 700, color: '#1c1917' }}>GSTIN: {business.gstin}</span>}
                </div>
              </div>

              {/* Invoice Title Ribbon */}
              <div style={{ textAlign: 'center', marginBottom: '2.5mm' }}>
                <div style={{ display: 'inline-block', fontSize: '15px', fontWeight: 800, letterSpacing: '3px', textTransform: 'uppercase', color: accent, borderTop: `1px solid ${accent}60`, borderBottom: `1px solid ${accent}60`, padding: '1.5mm 6mm' }}>
                  {invoiceLabel}
                </div>
              </div>

              {/* Bill To & Meta Two Column */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '4mm', marginBottom: '3mm', fontSize: `${10 * scaleVal}px`, fontFamily: 'Inter, system-ui, sans-serif' }}>
                {/* Bill To */}
                <div style={{ flex: 1, backgroundColor: '#fafaf9', padding: '2mm 3.5mm', borderRadius: '4px', border: '1px solid #e7e5e4' }}>
                  <div style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#78716c', marginBottom: '0.5mm' }}>
                    {L.billTo}:
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#1c1917', fontFamily: `'${font}', serif` }}>{invoice.customerName ?? 'Walk-in Customer'}</div>
                  {invoice.customerAddress && <div style={{ color: '#57534e', fontSize: `${9.5 * scaleVal}px`, whiteSpace: 'pre-line' }}>{invoice.customerAddress}</div>}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3mm', marginTop: '0.5mm', fontSize: `${9 * scaleVal}px`, color: '#78716c' }}>
                    {invoice.customerPhone && <span>📞 {invoice.customerPhone}</span>}
                    {invoice.customerGstin && <span style={{ fontWeight: 700, color: '#1c1917' }}>GSTIN: {invoice.customerGstin}</span>}
                  </div>
                </div>

                {/* Invoice Meta */}
                <div style={{ textAlign: 'right', minWidth: '50mm', padding: '2mm 3.5mm', backgroundColor: '#fafaf9', borderRadius: '4px', border: '1px solid #e7e5e4' }}>
                  <div style={{ fontWeight: 800, fontSize: '9px', color: accent, marginBottom: '1mm' }}>CASH / CREDIT</div>
                  <div><span style={{ color: '#78716c' }}>{L.invoiceNumber}:</span> <strong style={{ color: '#1c1917' }}>{invoice.invoiceNumber ?? '—'}</strong></div>
                  <div><span style={{ color: '#78716c' }}>{L.invoiceDate}:</span> <strong>{formatDate(invoice.invoiceDate, dateFormat) || '—'}</strong></div>
                  {invoice.dueDate && <div><span style={{ color: '#78716c' }}>{L.dueDate}:</span> <strong>{formatDate(invoice.dueDate, dateFormat)}</strong></div>}
                </div>
              </div>
            </>
          ) : (
            /* Subsequent Page Header */
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid #d6d3d1`, paddingBottom: '2mm', marginBottom: '3mm', fontSize: `${10 * scaleVal}px`, fontFamily: 'Inter, system-ui, sans-serif' }}>
              <span style={{ fontWeight: 700, color: accent }}>{business?.name} — {invoiceLabel} #{invoice.invoiceNumber}</span>
              <span style={{ color: '#78716c' }}>Page {pageNumber} of {totalPages}</span>
            </div>
          )}
        </div>

        {/* Items Table Container */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: `${10 * scaleVal}px`, tableLayout: 'auto' }}>
            <thead>
              <tr style={{ borderTop: `1px solid #a8a29e`, borderBottom: `1.5px solid #78716c`, fontFamily: 'Inter, system-ui, sans-serif' }}>
                <th style={{ padding: '2mm 2.5mm', textAlign: 'center', fontWeight: 700, color: '#44403c', width: '38px', fontSize: `${9.5 * scaleVal}px` }}>{L.srNo}</th>
                {hasSlNo && <th style={{ padding: '2mm 2mm', textAlign: 'center', fontWeight: 700, color: '#44403c', width: '55px', fontSize: `${9.5 * scaleVal}px` }}>Sel. No.</th>}
                <th style={{ padding: '2mm 2.5mm', textAlign: 'left', fontWeight: 700, color: '#44403c', fontSize: `${9.5 * scaleVal}px` }}>{L.description}</th>
                {hasAuthor && <th style={{ padding: '2mm 2mm', textAlign: 'left', fontWeight: 700, color: '#44403c', width: '110px', fontSize: `${9.5 * scaleVal}px` }}>Author</th>}
                {hasIsbn && <th style={{ padding: '2mm 2mm', textAlign: 'left', fontWeight: 700, color: '#44403c', width: '90px', fontSize: `${9.5 * scaleVal}px` }}>{L.isbn}</th>}
                <th style={{ padding: '2mm 2.5mm', textAlign: 'right', fontWeight: 700, color: '#44403c', width: '75px', fontSize: `${9.5 * scaleVal}px` }}>{L.unitPrice}</th>
                <th style={{ padding: '2mm 2mm', textAlign: 'center', fontWeight: 700, color: '#44403c', width: '45px', fontSize: `${9.5 * scaleVal}px` }}>{L.quantity}</th>
                <th style={{ padding: '2mm 2.5mm', textAlign: 'right', fontWeight: 700, color: '#44403c', width: '85px', fontSize: `${9.5 * scaleVal}px` }}>{L.amount}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, idx: number) => (
                <tr key={idx} data-measure="row" style={{
                  borderBottom: printFriendly ? '1px solid #e7e5e4' : '1px solid #f5f5f4',
                  backgroundColor: 'transparent',
                  pageBreakInside: 'avoid',
                }}>
                  <td style={{ padding: '2mm 2.5mm', textAlign: 'center', color: '#78716c', fontFamily: 'Inter, system-ui, sans-serif' }}>{item.srNo}</td>
                  {hasSlNo && <td style={{ padding: '2mm 2mm', textAlign: 'center', fontFamily: 'monospace', color: '#57534e' }}>{item.slNo || '—'}</td>}
                  <td style={{ padding: '2mm 2.5mm', fontWeight: 600, color: '#1c1917', fontSize: `${10.5 * scaleVal * titleScale}px`, fontFamily: `'${font}', serif` }}>{item.productName || '—'}</td>
                  {hasAuthor && <td style={{ padding: '2mm 2mm', color: '#57534e', fontSize: `${9.5 * scaleVal * authorScale}px`, fontFamily: 'Inter, system-ui, sans-serif' }}>{item.author || '—'}</td>}
                  {hasIsbn && <td style={{ padding: '2mm 2mm', fontFamily: 'monospace', color: '#57534e', fontSize: `${9.5 * scaleVal}px` }}>{item.isbn || '—'}</td>}
                  <td style={{ padding: '2mm 2.5mm', textAlign: 'right', color: '#44403c', fontFamily: 'Inter, system-ui, sans-serif' }}>₹{formatNumber(item.unitPrice)}</td>
                  <td style={{ padding: '2mm 2mm', textAlign: 'center', fontWeight: 600, color: '#1c1917', fontFamily: 'Inter, system-ui, sans-serif' }}>{item.quantity}</td>
                  <td style={{ padding: '2mm 2.5mm', textAlign: 'right', fontWeight: 700, color: '#1c1917', fontFamily: 'Inter, system-ui, sans-serif' }}>₹{formatNumber(item.lineTotal)}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={totalColumns} style={{ padding: '6mm', textAlign: 'center', color: '#a8a29e', fontStyle: 'italic' }}>No items added yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Continuation Notice */}
        {!isLastPage && (
          <div style={{ textAlign: 'center', margin: '3mm 0', fontSize: '10px', color: '#78716c', fontStyle: 'italic', fontWeight: 600 }}>
            Continued on Page {pageNumber + 1}...
          </div>
        )}

        {/* Footer (Only on last page) */}
        {isLastPage && (
          <div data-measure="footer" style={{ marginTop: 'auto', paddingTop: '3mm', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* Totals & Words */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '4mm', marginBottom: '3mm' }}>
              {/* Words */}
              <div style={{ flex: 1, border: '1px solid #e7e5e4', borderRadius: '4px', padding: '2.5mm 3.5mm', backgroundColor: '#fafaf9' }}>
                <div style={{ fontSize: '9px', color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1mm', fontWeight: 700 }}>
                  {L.amountInWords}:
                </div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#1c1917', lineHeight: 1.35, fontFamily: `'${font}', serif` }}>
                  {calculations.amountInWords}
                </div>
                {invoice.customerNotes && (
                  <div style={{ marginTop: '2mm', paddingTop: '1.5mm', borderTop: '1px dashed #d6d3d1', fontSize: '9px', color: '#57534e' }}>
                    <strong>Notes:</strong> {invoice.customerNotes}
                  </div>
                )}
              </div>

              {/* Totals */}
              <div style={{ minWidth: '65mm', border: `1px solid ${accent}40`, borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5mm 3.5mm', fontSize: `${10 * scaleVal}px`, color: '#78716c' }}>
                  <span>{L.subtotal}</span>
                  <span style={{ fontWeight: 600, color: '#1c1917' }}>₹{formatNumber(calculations.subtotal)}</span>
                </div>
                {calculations.discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5mm 3.5mm', fontSize: `${10 * scaleVal}px`, color: '#b91c1c', backgroundColor: '#fef2f2' }}>
                    <span>{L.discount}</span>
                    <span style={{ fontWeight: 700 }}>-₹{formatNumber(calculations.discountAmount)}</span>
                  </div>
                )}
                {calculations.roundOff !== 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5mm 3.5mm', fontSize: `${10 * scaleVal}px`, color: '#78716c' }}>
                    <span>{L.roundOff}</span>
                    <span>{calculations.roundOff > 0 ? '+' : ''}₹{formatNumber(Math.abs(calculations.roundOff))}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2.5mm 3.5mm', backgroundColor: accent, color: '#ffffff', fontSize: '12.5px', fontWeight: 800, fontFamily: `'${font}', serif` }}>
                  <span>{L.grandTotal}</span>
                  <span>{formatINR(calculations.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Bottom: Bank + QR + Signature */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '3mm', borderTop: '1px solid #d6d3d1', paddingTop: '2.5mm' }}>
              {business?.bankName ? (
                <div style={{ flex: 1, fontSize: '9.5px', color: '#44403c', backgroundColor: '#fafaf9', padding: '2mm 3mm', borderRadius: '4px', border: '1px solid #e7e5e4' }}>
                  <div style={{ fontWeight: 800, color: accent, textTransform: 'uppercase', marginBottom: '0.5mm', fontSize: '9px' }}>{L.bankDetails}</div>
                  <div><strong>Bank:</strong> {business.bankName} | <strong>A/C:</strong> {business.bankAccount || '—'}</div>
                  <div><strong>IFSC:</strong> {business.bankIfsc || '—'}{business.bankBranch ? ` | Branch: ${business.bankBranch}` : ''}</div>
                </div>
              ) : <div style={{ flex: 1 }} />}

              {/* Dynamic QR */}
              {(business?.upiQrPath || business?.upiId) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '2mm', padding: '1mm 2.5mm', borderRadius: '4px', border: '1px solid #e7e5e4', backgroundColor: '#ffffff' }}>
                  {business.upiId ? (
                    <QRCodeSVG 
                      value={`upi://pay?pa=${business.upiId}&pn=${encodeURIComponent(business.name)}&am=${calculations.grandTotal}&cu=INR`}
                      size={48}
                      level="M"
                    />
                  ) : (
                    <img src={business.upiQrPath} alt="UPI QR" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                  )}
                  <div style={{ fontSize: '8.5px', color: '#78716c' }}>
                    <div style={{ fontWeight: 700, color: '#1c1917' }}>Scan & Pay</div>
                    <div>UPI QR</div>
                  </div>
                </div>
              )}

              {/* Signature */}
              <div style={{ textAlign: 'center', minWidth: '40mm' }}>
                {business?.signaturePath && (
                  <img src={business.signaturePath} alt="Signature" style={{ height: '12mm', maxWidth: '38mm', objectFit: 'contain', display: 'block', margin: '0 auto 1mm' }} />
                )}
                <div style={{ borderTop: `1px solid ${accent}`, paddingTop: '1mm', fontSize: '9px', color: '#78716c' }}>
                  {L.authorizedSignatory}
                </div>
                <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#1c1917' }}>
                  {L.forCompany} {business?.name ?? ''}
                </div>
              </div>
            </div>

            {/* Terms */}
            {business?.terms && (
              <div style={{ fontSize: '8px', color: '#a8a29e', marginTop: '1.5mm', borderTop: '1px dotted #d6d3d1', paddingTop: '1mm', whiteSpace: 'pre-line' }}>
                <strong>Terms:</strong> {business.terms}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
