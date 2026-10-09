import React from 'react';
import type { TemplateProps } from './types';
import { getLabels } from '@/lib/utils/kannadaLabels';
import { formatNumber, formatINR } from '@/lib/utils/currency';
import { useAppSettingsStore } from '@/stores/useAppSettingsStore';
import { formatDate } from '@/lib/utils/dateFormat';
import { QRCodeSVG } from 'qrcode.react';

export function TraditionalIndian({ invoice, business, items, calculations, language, themeOverrides, pageNumber = 1, totalPages = 1 }: TemplateProps) {
  const L = getLabels(language);
  const accent = themeOverrides?.accentColor ?? business?.accentColor ?? '#1e3a8a';
  const font = themeOverrides?.fontFamily ?? 'Roboto';
  const headerLayout = themeOverrides?.headerLayout ?? 'split';
  const borderStyle = themeOverrides?.borderStyle ?? 'lines';
  const logoSizePx = { small: 56, medium: 75, large: 100 }[themeOverrides?.logoSize ?? 'medium'];
  const lineHeightVal = { compact: '1.2', normal: '1.4', relaxed: '1.6' }[themeOverrides?.lineSpacing ?? 'normal'];
  
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
  const tableBorderColor = printFriendly ? '#64748b' : `${accent}70`;

  const tdStyle: React.CSSProperties = {
    border: `1px solid ${tableBorderColor}`,
    padding: '2mm 2.5mm',
    fontSize: `${10 * scaleVal}px`,
  };

  const thStyle: React.CSSProperties = {
    ...tdStyle,
    backgroundColor: printFriendly ? '#f1f5f9' : accent,
    color: printFriendly ? '#0f172a' : '#ffffff',
    fontWeight: 700,
    fontSize: `${10.5 * scaleVal}px`,
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  };

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
        padding: '5mm 7mm',
        boxSizing: 'border-box',
        border: borderStyle === 'boxed' ? `2px solid ${accent}` : borderStyle === 'lines' ? `1px solid ${tableBorderColor}` : 'none',
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
          fontSize: '64px', fontWeight: 900, letterSpacing: '8px',
          color: `${accent}12`, pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 50,
        }}>
          {themeOverrides.watermarkText ?? 'ORIGINAL'}
        </div>
      )}

      {/* Header section */}
      <div data-measure="header">
        {isFirstPage ? (
          <>
            {/* Top Bar: GST / Supply Header */}
            <div style={{ borderBottom: `2px solid ${accent}`, paddingBottom: '3mm', marginBottom: '2.5mm' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2mm' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  || SHRI ||
                </span>
                <span style={{ fontSize: '15px', fontWeight: 900, color: accent, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: `1.5px solid ${accent}`, paddingBottom: '1px' }}>
                  {invoiceLabel} / CASH BILL
                </span>
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#64748b' }}>
                  ORIGINAL FOR RECIPIENT
                </span>
              </div>

              {/* Main Business Details Header */}
              <div style={{ display: 'flex', justifyContent: headerLayout === 'split' ? 'space-between' : 'center', flexDirection: headerLayout === 'centered' ? 'column' : 'row', alignItems: 'center', gap: '3mm' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3mm', textAlign: headerLayout === 'centered' ? 'center' : 'left' }}>
                  {business?.logoPath && <img src={business.logoPath} alt="logo" style={{ height: `${logoSizePx}px`, maxWidth: '120px', objectFit: 'contain' }} />}
                  <div>
                    <div style={{ fontSize: `${20 * scaleVal}px`, fontWeight: 800, color: accent, letterSpacing: '-0.3px', marginBottom: '1mm' }}>
                      {business?.name ?? 'Business Name'}
                    </div>
                    {business?.address && <div style={{ fontSize: `${10 * scaleVal}px`, color: '#334155', whiteSpace: 'pre-line' }}>{business.address}</div>}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3mm', marginTop: '0.8mm', fontSize: `${9.5 * scaleVal}px`, color: '#475569' }}>
                      {business?.phone && <span>Ph: <strong>{business.phone}</strong></span>}
                      {business?.email && <span>Email: {business.email}</span>}
                      {business?.gstin && <span>GSTIN: <strong>{business.gstin}</strong></span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bill To & Invoice Meta Two-Column Box */}
            <div style={{ border: `1px solid ${tableBorderColor}`, borderRadius: '4px', marginBottom: '3mm', overflow: 'hidden' }}>
              <div style={{ display: 'flex' }}>
                {/* Left: Customer Details */}
                <div style={{ flex: 1, padding: '2.5mm 3.5mm', borderRight: `1px solid ${tableBorderColor}` }}>
                  <div style={{ fontWeight: 800, color: accent, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1mm' }}>
                    {L.billTo}:
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '12px', color: '#0f172a' }}>{invoice.customerName ?? 'Walk-in Customer'}</div>
                  {invoice.customerAddress && <div style={{ color: '#475569', fontSize: `${9.5 * scaleVal}px`, marginTop: '0.5mm', whiteSpace: 'pre-line' }}>{invoice.customerAddress}</div>}
                  {invoice.customerPhone && <div style={{ fontSize: `${9.5 * scaleVal}px`, color: '#475569', marginTop: '0.5mm' }}>Ph: {invoice.customerPhone}</div>}
                  {invoice.customerGstin && <div style={{ fontSize: `${9.5 * scaleVal}px`, fontWeight: 700, color: '#0f172a', marginTop: '0.5mm' }}>GSTIN: {invoice.customerGstin}</div>}
                </div>

                {/* Right: Invoice Meta Grid */}
                <div style={{ width: '45%', padding: '2mm 3mm', backgroundColor: '#fcfcfd' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: `${9.5 * scaleVal}px` }}>
                    <tbody>
                      <tr>
                        <td style={{ color: '#64748b', padding: '1mm 0', fontWeight: 600 }}>{L.invoiceNumber}:</td>
                        <td style={{ fontWeight: 700, textAlign: 'right', color: '#0f172a' }}>{invoice.invoiceNumber ?? '—'}</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#64748b', padding: '1mm 0', fontWeight: 600 }}>{L.invoiceDate}:</td>
                        <td style={{ fontWeight: 600, textAlign: 'right', color: '#0f172a' }}>{formatDate(invoice.invoiceDate, dateFormat) || '—'}</td>
                      </tr>
                      {invoice.dueDate && (
                        <tr>
                          <td style={{ color: '#64748b', padding: '1mm 0', fontWeight: 600 }}>{L.dueDate}:</td>
                          <td style={{ fontWeight: 600, textAlign: 'right', color: '#0f172a' }}>{formatDate(invoice.dueDate, dateFormat)}</td>
                        </tr>
                      )}
                      <tr>
                        <td style={{ color: '#64748b', padding: '1mm 0', fontWeight: 600 }}>Payment Mode:</td>
                        <td style={{ fontWeight: 600, textAlign: 'right', color: '#0f172a' }}>CASH / CREDIT</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Subsequent Page Header */
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${accent}`, paddingBottom: '2mm', marginBottom: '3mm', fontSize: `${10 * scaleVal}px` }}>
            <span style={{ fontWeight: 700, color: accent }}>{business?.name} — {invoiceLabel} #{invoice.invoiceNumber}</span>
            <span style={{ color: '#64748b' }}>Page {pageNumber} of {totalPages}</span>
          </div>
        )}
      </div>

      {/* Items Table with Full Grid Borders */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: `${10 * scaleVal}px`, tableLayout: 'auto' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: '38px', textAlign: 'center' }}>{L.srNo}</th>
              {hasSlNo && <th style={{ ...thStyle, width: '55px', textAlign: 'center' }}>Sel. No.</th>}
              <th style={{ ...thStyle, textAlign: 'left' }}>{L.description}</th>
              {hasAuthor && <th style={{ ...thStyle, width: '110px', textAlign: 'left' }}>Author</th>}
              {hasIsbn && <th style={{ ...thStyle, width: '90px', textAlign: 'left' }}>{L.isbn}</th>}
              <th style={{ ...thStyle, width: '75px', textAlign: 'right' }}>{L.unitPrice}</th>
              <th style={{ ...thStyle, width: '45px', textAlign: 'center' }}>{L.quantity}</th>
              <th style={{ ...thStyle, width: '85px', textAlign: 'right' }}>{L.amount}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, idx: number) => (
              <tr key={idx} data-measure="row" style={{
                backgroundColor: idx % 2 === 1 ? '#fbfcfe' : 'transparent',
                pageBreakInside: 'avoid',
              }}>
                <td style={{ ...tdStyle, textAlign: 'center', color: '#64748b' }}>{item.srNo}</td>
                {hasSlNo && <td style={{ ...tdStyle, textAlign: 'center', fontFamily: 'monospace' }}>{item.slNo || '—'}</td>}
                <td style={{ ...tdStyle, fontWeight: 600, color: '#0f172a', fontSize: `${10 * scaleVal * titleScale}px` }}>{item.productName || '—'}</td>
                {hasAuthor && <td style={{ ...tdStyle, color: '#475569', fontSize: `${9.5 * scaleVal * authorScale}px` }}>{item.author || '—'}</td>}
                {hasIsbn && <td style={{ ...tdStyle, fontFamily: 'monospace', color: '#475569', fontSize: `${9.5 * scaleVal}px` }}>{item.isbn || '—'}</td>}
                <td style={{ ...tdStyle, textAlign: 'right', color: '#334155' }}>₹{formatNumber(item.unitPrice)}</td>
                <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: '#0f172a' }}>{item.quantity}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>₹{formatNumber(item.lineTotal)}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={totalColumns} style={{ ...tdStyle, padding: '6mm', textAlign: 'center', color: '#94a3b8' }}>No items added yet</td>
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
        <div data-measure="footer" style={{ marginTop: 'auto', paddingTop: '3mm' }}>
          {/* Totals and Amount In Words Grid */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '3mm', marginBottom: '2.5mm' }}>
            {/* Amount In Words & Notes */}
            <div style={{ flex: 1, border: `1px solid ${tableBorderColor}`, borderRadius: '4px', padding: '2.5mm 3.5mm', backgroundColor: '#fcfcfd' }}>
              <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.8mm' }}>
                {L.amountInWords}:
              </div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', lineHeight: 1.35 }}>
                {calculations.amountInWords}
              </div>
              {invoice.customerNotes && (
                <div style={{ marginTop: '2mm', paddingTop: '1.5mm', borderTop: '1px dashed #cbd5e1', fontSize: '9px', color: '#475569' }}>
                  <strong>Notes:</strong> {invoice.customerNotes}
                </div>
              )}
            </div>

            {/* Totals Table Box */}
            <div style={{ minWidth: '65mm' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: `${10 * scaleVal}px` }}>
                <tbody>
                  <tr>
                    <td style={tdStyle}>{L.subtotal}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>₹{formatNumber(calculations.subtotal)}</td>
                  </tr>
                  {calculations.discountAmount > 0 && (
                    <tr>
                      <td style={{ ...tdStyle, color: '#ef4444' }}>{L.discount}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: '#ef4444', fontWeight: 700 }}>-₹{formatNumber(calculations.discountAmount)}</td>
                    </tr>
                  )}
                  {calculations.roundOff !== 0 && (
                    <tr>
                      <td style={{ ...tdStyle, color: '#64748b' }}>{L.roundOff}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{calculations.roundOff > 0 ? '+' : ''}₹{formatNumber(Math.abs(calculations.roundOff))}</td>
                    </tr>
                  )}
                  <tr style={{ backgroundColor: printFriendly ? '#0f172a' : accent, color: '#ffffff' }}>
                    <td style={{ ...thStyle, fontSize: '11px', backgroundColor: printFriendly ? '#0f172a' : accent, color: '#ffffff' }}>{L.grandTotal}</td>
                    <td style={{ ...thStyle, textAlign: 'right', fontSize: '12px', backgroundColor: printFriendly ? '#0f172a' : accent, color: '#ffffff' }}>{formatINR(calculations.grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Bank & Signature Grid */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '3mm', borderTop: `1px solid ${tableBorderColor}`, paddingTop: '2.5mm' }}>
            {business?.bankName ? (
              <div style={{ flex: 1, fontSize: '9.5px', color: '#334155', border: `1px solid ${tableBorderColor}`, padding: '2mm 3mm', borderRadius: '4px', backgroundColor: '#fcfcfd' }}>
                <div style={{ fontWeight: 800, color: accent, fontSize: '9px', textTransform: 'uppercase', marginBottom: '0.5mm' }}>{L.bankDetails}</div>
                <div><strong>Bank:</strong> {business.bankName} | <strong>A/C:</strong> {business.bankAccount || '—'}</div>
                <div><strong>IFSC:</strong> {business.bankIfsc || '—'}{business.bankBranch ? ` | Branch: ${business.bankBranch}` : ''}</div>
              </div>
            ) : <div style={{ flex: 1 }} />}

            {/* Dynamic UPI QR */}
            {(business?.upiQrPath || business?.upiId) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '2mm', padding: '1mm 2mm', border: `1px solid ${tableBorderColor}`, borderRadius: '4px', backgroundColor: '#ffffff' }}>
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
                  <div>UPI QR Code</div>
                </div>
              </div>
            )}

            {/* Signature Box */}
            <div style={{ textAlign: 'center', minWidth: '45mm', border: `1px solid ${tableBorderColor}`, padding: '2mm 3mm', borderRadius: '4px', backgroundColor: '#ffffff' }}>
              {business?.signaturePath ? (
                <img src={business.signaturePath} alt="Signature" style={{ height: '12mm', maxWidth: '38mm', objectFit: 'contain', display: 'block', margin: '0 auto 1mm' }} />
              ) : <div style={{ height: '12mm' }} />}
              <div style={{ borderTop: `1px solid ${tableBorderColor}`, paddingTop: '1mm', fontSize: '8.5px', color: '#64748b' }}>
                {L.authorizedSignatory}
              </div>
              <div style={{ fontSize: '9px', fontWeight: 700, color: '#0f172a' }}>
                {L.forCompany} {business?.name ?? ''}
              </div>
            </div>
          </div>

          {/* Terms */}
          {business?.terms && (
            <div style={{ fontSize: '8px', color: '#64748b', marginTop: '1.5mm', borderTop: '1px dotted #cbd5e1', paddingTop: '1mm', whiteSpace: 'pre-line' }}>
              <strong>Terms & Conditions:</strong> {business.terms}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
