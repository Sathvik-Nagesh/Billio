import React from 'react';
import type { TemplateProps } from './types';
import { getLabels } from '@/lib/utils/kannadaLabels';
import { formatNumber, formatINR } from '@/lib/utils/currency';
import { useAppSettingsStore } from '@/stores/useAppSettingsStore';
import { formatDate } from '@/lib/utils/dateFormat';
import { QRCodeSVG } from 'qrcode.react';

export function BasicClean({ invoice, business, items, calculations, language, themeOverrides, pageNumber = 1, totalPages = 1 }: TemplateProps) {
  const L = getLabels(language);
  const accent = themeOverrides?.accentColor ?? business?.accentColor ?? '#0f172a';
  const font = themeOverrides?.fontFamily ?? 'Inter';
  const headerLayout = themeOverrides?.headerLayout ?? 'centered';
  const borderStyle = themeOverrides?.borderStyle ?? 'lines';
  const logoSizePx = { small: 48, medium: 65, large: 90 }[themeOverrides?.logoSize ?? 'medium'];
  const lineHeightVal = { compact: '1.2', normal: '1.4', relaxed: '1.6' }[themeOverrides?.lineSpacing ?? 'normal'];
  
  const hasIsbn = items.some((i: any) => i.isbn && i.isbn.trim() !== '');
  const hasAuthor = items.some((i: any) => i.author && i.author.trim() !== '');
  const hasSlNo = items.some((i: any) => i.slNo && i.slNo.trim() !== '');
  const isFirstPage = pageNumber === 1;
  const isLastPage = pageNumber === totalPages;

  const fwMap: Record<string, number> = { light: 300, regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 };
  const baseFW = fwMap[themeOverrides?.fontWeight ?? 'regular'];
  const scaleVal = parseInt(themeOverrides?.fontSize ?? '100') / 100;
  const titleScale = parseInt(themeOverrides?.tableTitleFontSize ?? '100') / 100;
  const authorScale = parseInt(themeOverrides?.tableAuthorFontSize ?? '100') / 100;
  const printFriendly = themeOverrides?.printFriendly ?? false;
  const highContrast = themeOverrides?.highContrast ?? false;

  const { dateFormat, documentLabel } = useAppSettingsStore();
  const invoiceLabel = documentLabel === 'bill' ? L.bill : L.invoice;

  const borderColor = printFriendly ? '#94a3b8' : '#cbd5e1';
  const labelColor = highContrast ? '#0f172a' : '#64748b';
  const textColor = highContrast ? '#000000' : '#0f172a';

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
        color: textColor,
        boxSizing: 'border-box',
        border: borderStyle === 'boxed' ? `2px solid ${accent}` : borderStyle === 'lines' ? `1px solid ${borderColor}` : 'none',
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

      {/* Header section */}
      <div data-measure="header">
        {/* Top meta row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5mm 6mm', borderBottom: `1px solid ${borderColor}`, fontSize: `${9 * scaleVal}px`, color: labelColor }}>
          <span>Page {pageNumber} of {totalPages}</span>
          <span style={{ fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: textColor }}>{invoiceLabel} / CASH BILL OF SUPPLY</span>
          <span>ORIGINAL</span>
        </div>

        {isFirstPage && (
          <>
            {/* Header: Logo + Biz Name + Contact */}
            <div style={{
              textAlign: headerLayout === 'split' ? 'left' : 'center',
              padding: '3mm 6mm',
              borderBottom: `1px solid ${borderColor}`,
              display: 'flex',
              flexDirection: headerLayout === 'split' ? 'row' : 'column',
              alignItems: 'center',
              justifyContent: headerLayout === 'split' ? 'space-between' : 'center',
              gap: '3mm',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3mm', justifyContent: headerLayout === 'centered' ? 'center' : 'flex-start' }}>
                {business?.logoPath && (
                  <img src={business.logoPath} alt="logo" style={{ height: `${logoSizePx}px`, maxWidth: '120px', objectFit: 'contain', display: 'block' }} />
                )}
                <div style={{ textAlign: headerLayout === 'centered' ? 'center' : 'left' }}>
                  <div style={{ fontSize: `${18 * scaleVal}px`, fontWeight: 800, color: printFriendly ? '#0f172a' : accent, letterSpacing: '-0.3px' }}>
                    {business?.name ?? 'Company Name'}
                  </div>
                  {business?.address && (
                    <div style={{ fontSize: `${10 * scaleVal}px`, color: labelColor, marginTop: '0.5mm', whiteSpace: 'pre-line' }}>
                      {business.address}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3mm', marginTop: '0.5mm', fontSize: `${9.5 * scaleVal}px`, color: labelColor, justifyContent: headerLayout === 'centered' ? 'center' : 'flex-start' }}>
                    {business?.phone && <span>Ph: {business.phone}</span>}
                    {business?.email && <span>✉ {business.email}</span>}
                    {business?.gstin && <span>GSTIN: <strong>{business.gstin}</strong></span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Bill To + Invoice Meta */}
            <div style={{ display: 'flex', padding: '2.5mm 6mm', borderBottom: `1px solid ${borderColor}`, gap: '4mm', fontSize: `${10 * scaleVal}px`, backgroundColor: '#fcfcfd' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: `${9 * scaleVal}px`, textTransform: 'uppercase', letterSpacing: '0.8px', color: labelColor, marginBottom: '0.5mm' }}>{L.billTo}</div>
                <div style={{ fontWeight: 700, fontSize: `${12 * scaleVal}px`, color: textColor }}>{invoice.customerName ?? 'Walk-in Customer'}</div>
                {invoice.customerAddress && <div style={{ color: labelColor, whiteSpace: 'pre-line', marginTop: '0.3mm' }}>{invoice.customerAddress}</div>}
                <div style={{ display: 'flex', gap: '3mm', marginTop: '0.5mm', fontSize: `${9.5 * scaleVal}px`, color: labelColor }}>
                  {invoice.customerPhone && <span>📞 {invoice.customerPhone}</span>}
                  {invoice.customerGstin && <span>GSTIN: <strong>{invoice.customerGstin}</strong></span>}
                </div>
              </div>
              <div style={{ minWidth: '55mm', textAlign: 'right' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: `${10 * scaleVal}px` }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '0.5mm 1mm', color: labelColor, textAlign: 'left', whiteSpace: 'nowrap' }}>{L.invoiceNumber}:</td>
                      <td style={{ padding: '0.5mm 1mm', fontWeight: 700, color: textColor, textAlign: 'right' }}>{invoice.invoiceNumber ?? '—'}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.5mm 1mm', color: labelColor, textAlign: 'left', whiteSpace: 'nowrap' }}>{L.invoiceDate}:</td>
                      <td style={{ padding: '0.5mm 1mm', fontWeight: 600, color: textColor, textAlign: 'right' }}>{formatDate(invoice.invoiceDate, dateFormat) || '—'}</td>
                    </tr>
                    {invoice.dueDate && (
                      <tr>
                        <td style={{ padding: '0.5mm 1mm', color: labelColor, textAlign: 'left', whiteSpace: 'nowrap' }}>{L.dueDate}:</td>
                        <td style={{ padding: '0.5mm 1mm', fontWeight: 600, color: textColor, textAlign: 'right' }}>{formatDate(invoice.dueDate, dateFormat)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Items Table Container */}
      <div style={{ padding: '0 6mm', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, minHeight: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: `${10 * scaleVal}px`, tableLayout: 'auto' }}>
            <thead>
              <tr style={{ backgroundColor: printFriendly ? '#f1f5f9' : accent, color: '#ffffff' }}>
                <th style={{ padding: '2mm 2mm', textAlign: 'center', fontWeight: 700, width: '38px', fontSize: `${9.5 * scaleVal}px` }}>{L.srNo}</th>
                {hasSlNo && <th style={{ padding: '2mm 2mm', textAlign: 'center', fontWeight: 700, width: '55px', fontSize: `${9.5 * scaleVal}px` }}>Sel. No.</th>}
                <th style={{ padding: '2mm 2mm', textAlign: 'left', fontWeight: 700, fontSize: `${9.5 * scaleVal}px` }}>{L.description}</th>
                {hasAuthor && <th style={{ padding: '2mm 2mm', textAlign: 'left', fontWeight: 700, width: '110px', fontSize: `${9.5 * scaleVal}px` }}>Author</th>}
                {hasIsbn && <th style={{ padding: '2mm 2mm', textAlign: 'left', fontWeight: 700, width: '90px', fontSize: `${9.5 * scaleVal}px` }}>{L.isbn}</th>}
                <th style={{ padding: '2mm 2mm', textAlign: 'right', fontWeight: 700, width: '75px', fontSize: `${9.5 * scaleVal}px` }}>Unit Price</th>
                <th style={{ padding: '2mm 2mm', textAlign: 'center', fontWeight: 700, width: '45px', fontSize: `${9.5 * scaleVal}px` }}>Qty</th>
                <th style={{ padding: '2mm 2mm', textAlign: 'right', fontWeight: 700, width: '85px', fontSize: `${9.5 * scaleVal}px` }}>{L.amount}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, idx: number) => (
                <tr key={idx} data-measure="row" style={{
                  borderBottom: `1px solid ${printFriendly ? '#e5e7eb' : '#f1f5f9'}`,
                  backgroundColor: 'transparent',
                  pageBreakInside: 'avoid',
                }}>
                  <td style={{ padding: '1.8mm 2mm', textAlign: 'center', color: labelColor }}>{item.srNo}</td>
                  {hasSlNo && <td style={{ padding: '1.8mm 2mm', textAlign: 'center', color: labelColor, fontFamily: 'monospace' }}>{item.slNo || '—'}</td>}
                  <td style={{ padding: '1.8mm 2mm', fontWeight: 600, color: textColor, fontSize: `${10 * scaleVal * titleScale}px` }}>{item.productName || '—'}</td>
                  {hasAuthor && <td style={{ padding: '1.8mm 2mm', color: labelColor, fontSize: `${9.5 * scaleVal * authorScale}px` }}>{item.author || '—'}</td>}
                  {hasIsbn && <td style={{ padding: '1.8mm 2mm', fontFamily: 'monospace', color: labelColor, fontSize: `${9.5 * scaleVal}px` }}>{item.isbn || '—'}</td>}
                  <td style={{ padding: '1.8mm 2mm', textAlign: 'right', color: labelColor }}>₹{formatNumber(item.unitPrice)}</td>
                  <td style={{ padding: '1.8mm 2mm', textAlign: 'center', fontWeight: 600, color: textColor }}>{item.quantity}</td>
                  <td style={{ padding: '1.8mm 2mm', textAlign: 'right', fontWeight: 700, color: textColor }}>₹{formatNumber(item.lineTotal)}</td>
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
          <div style={{ textAlign: 'center', margin: '3mm 0', fontSize: '10px', color: labelColor, fontStyle: 'italic' }}>
            Continued on Page {pageNumber + 1}...
          </div>
        )}

        {/* Footer (Only on last page) */}
        {isLastPage && (
          <div data-measure="footer" style={{ marginTop: 'auto', paddingTop: '2mm', paddingBottom: '3mm' }}>
            {/* Totals & Words Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '3mm', marginBottom: '2.5mm' }}>
              {/* Words */}
              <div style={{ flex: 1, backgroundColor: '#fcfcfd', border: `1px solid ${borderColor}`, borderRadius: '4px', padding: '2mm 3mm' }}>
                <div style={{ fontSize: '8.5px', color: labelColor, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5mm', fontWeight: 700 }}>
                  {L.amountInWords}:
                </div>
                <div style={{ fontSize: '10.5px', fontWeight: 700, color: textColor, lineHeight: 1.35 }}>
                  {calculations.amountInWords}
                </div>
                {invoice.customerNotes && (
                  <div style={{ marginTop: '1.5mm', paddingTop: '1mm', borderTop: '1px dashed #e2e8f0', fontSize: '9px', color: labelColor }}>
                    <strong>Notes:</strong> {invoice.customerNotes}
                  </div>
                )}
              </div>

              {/* Totals */}
              <div style={{ minWidth: '65mm', border: `1px solid ${borderColor}`, borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.2mm 3mm', fontSize: `${9.5 * scaleVal}px`, color: labelColor }}>
                  <span>{L.subtotal}</span>
                  <span style={{ fontWeight: 600, color: textColor }}>₹{formatNumber(calculations.subtotal)}</span>
                </div>
                {calculations.discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.2mm 3mm', fontSize: `${9.5 * scaleVal}px`, color: '#ef4444', backgroundColor: '#fef2f2' }}>
                    <span>{L.discount}</span>
                    <span style={{ fontWeight: 700 }}>-₹{formatNumber(calculations.discountAmount)}</span>
                  </div>
                )}
                {calculations.roundOff !== 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.2mm 3mm', fontSize: `${9.5 * scaleVal}px`, color: labelColor }}>
                    <span>{L.roundOff}</span>
                    <span>{calculations.roundOff > 0 ? '+' : ''}₹{formatNumber(Math.abs(calculations.roundOff))}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2mm 3mm', backgroundColor: printFriendly ? '#0f172a' : accent, color: '#ffffff', fontSize: '12px', fontWeight: 800 }}>
                  <span>{L.grandTotal}</span>
                  <span>{formatINR(calculations.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Bottom: Bank + QR + Signature */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '3mm', borderTop: `1px solid ${borderColor}`, paddingTop: '2mm' }}>
              {business?.bankName ? (
                <div style={{ flex: 1, fontSize: '9px', color: labelColor, backgroundColor: '#fcfcfd', padding: '1.5mm 2.5mm', borderRadius: '4px', border: `1px solid ${borderColor}` }}>
                  <div style={{ fontWeight: 800, color: textColor, textTransform: 'uppercase', marginBottom: '0.3mm', fontSize: '8.5px' }}>{L.bankDetails}</div>
                  <div><strong>Bank:</strong> {business.bankName} | <strong>A/C:</strong> {business.bankAccount || '—'}</div>
                  <div><strong>IFSC:</strong> {business.bankIfsc || '—'}{business.bankBranch ? ` | Branch: ${business.bankBranch}` : ''}</div>
                </div>
              ) : <div style={{ flex: 1 }} />}

              {/* Dynamic QR */}
              {(business?.upiQrPath || business?.upiId) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '2mm', padding: '1mm 2mm', borderRadius: '4px', border: `1px solid ${borderColor}`, backgroundColor: '#ffffff' }}>
                  {business.upiId ? (
                    <QRCodeSVG 
                      value={`upi://pay?pa=${business.upiId}&pn=${encodeURIComponent(business.name)}&am=${calculations.grandTotal}&cu=INR`}
                      size={44}
                      level="M"
                    />
                  ) : (
                    <img src={business.upiQrPath} alt="UPI QR" style={{ width: '44px', height: '44px', objectFit: 'contain' }} />
                  )}
                  <div style={{ fontSize: '8px', color: labelColor }}>
                    <div style={{ fontWeight: 700, color: textColor }}>UPI Scan</div>
                    <div>GPay / PhonePe</div>
                  </div>
                </div>
              )}

              {/* Signature */}
              <div style={{ textAlign: 'center', minWidth: '38mm' }}>
                {business?.signaturePath && (
                  <img src={business.signaturePath} alt="Signature" style={{ height: '11mm', maxWidth: '36mm', objectFit: 'contain', display: 'block', margin: '0 auto 1mm' }} />
                )}
                <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '0.8mm', fontSize: '8.5px', color: labelColor }}>
                  {L.authorizedSignatory}
                </div>
                <div style={{ fontSize: '9px', fontWeight: 700, color: textColor }}>
                  {L.forCompany} {business?.name ?? ''}
                </div>
              </div>
            </div>

            {/* Terms */}
            {business?.terms && (
              <div style={{ fontSize: '7.5px', color: '#94a3b8', marginTop: '1mm', borderTop: '1px dotted #e2e8f0', paddingTop: '0.8mm', whiteSpace: 'pre-line' }}>
                <strong>Terms:</strong> {business.terms}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
