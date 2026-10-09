import React from 'react';
import type { TemplateProps } from './types';
import { getLabels } from '@/lib/utils/kannadaLabels';
import { formatNumber, formatINR } from '@/lib/utils/currency';
import { useAppSettingsStore } from '@/stores/useAppSettingsStore';
import { formatDate } from '@/lib/utils/dateFormat';
import { QRCodeSVG } from 'qrcode.react';

export function MinimalModern({ invoice, business, items, calculations, language, themeOverrides, pageNumber = 1, totalPages = 1 }: TemplateProps) {
  const L = getLabels(language);
  const accent = themeOverrides?.accentColor ?? business?.accentColor ?? '#6366F1';
  const font = themeOverrides?.fontFamily ?? 'Inter';
  const logoSize = themeOverrides?.logoSize ?? 'medium';
  const headerLayout = themeOverrides?.headerLayout ?? 'split';
  const borderStyle = themeOverrides?.borderStyle ?? 'lines';
  const logoSizePx = { small: 56, medium: 80, large: 110 }[logoSize];
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
        fontFamily: `'${font}', system-ui, sans-serif`,
        width: '100%',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        color: '#0f172a',
        position: 'relative',
        padding: '6mm 8mm',
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

      {/* Header section */}
      <div data-measure="header">
        {isFirstPage ? (
          <>
            <div style={{
              display: 'flex',
              alignItems: headerLayout === 'centered' ? 'center' : 'flex-start',
              justifyContent: headerLayout === 'split' ? 'space-between' : 'center',
              flexDirection: headerLayout === 'centered' ? 'column' : 'row',
              gap: '4mm',
              marginBottom: '3mm',
            }}>
              {/* Business Info */}
              <div style={{ flex: headerLayout === 'split' ? 1 : 'none', textAlign: headerLayout === 'centered' ? 'center' : 'left', maxWidth: headerLayout === 'split' ? '60%' : '100%' }}>
                {business?.logoPath ? (
                  <img src={business.logoPath} alt="logo" style={{ height: `${logoSizePx}px`, maxWidth: '180px', objectFit: 'contain', marginBottom: '2mm', display: 'block', margin: headerLayout === 'centered' ? '0 auto 2mm' : '0 0 2mm' }} />
                ) : (
                  <div style={{
                    fontSize: `${22 * scaleVal}px`,
                    fontWeight: highContrast ? 900 : 800,
                    color: printFriendly ? '#0f172a' : accent,
                    letterSpacing: '-0.5px',
                    marginBottom: '1mm',
                  }}>{business?.name ?? 'Your Business'}</div>
                )}
                {business?.logoPath && (
                  <div style={{ fontSize: `${18 * scaleVal}px`, fontWeight: highContrast ? 800 : 700, color: '#0f172a', marginBottom: '1mm' }}>{business.name}</div>
                )}
                {business?.address && <div style={{ color: printFriendly ? '#1e293b' : '#475569', fontSize: `${10.5 * scaleVal}px`, fontWeight: highContrast ? 600 : baseFW, whiteSpace: 'pre-line' }}>{business.address}</div>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3mm', marginTop: '1mm', fontSize: `${10 * scaleVal}px`, color: printFriendly ? '#1e293b' : '#64748b', justifyContent: headerLayout === 'centered' ? 'center' : 'flex-start' }}>
                  {business?.phone && <span>📞 {business.phone}</span>}
                  {business?.email && <span>✉ {business.email}</span>}
                  {business?.gstin && <span style={{ fontWeight: 700, color: '#0f172a' }}>GSTIN: {business.gstin}</span>}
                </div>
              </div>

              {/* Invoice Info Badge Card */}
              <div style={{
                backgroundColor: printFriendly ? '#f8fafc' : `${accent}08`,
                border: printFriendly ? '1px solid #cbd5e1' : `1px solid ${accent}30`,
                borderRadius: '8px',
                padding: '3mm 4mm',
                minWidth: '60mm',
                boxSizing: 'border-box',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2mm', borderBottom: `1px solid ${printFriendly ? '#cbd5e1' : accent + '25'}`, paddingBottom: '1.5mm' }}>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: printFriendly ? '#0f172a' : accent, letterSpacing: '-0.3px', textTransform: 'uppercase' }}>
                    {invoiceLabel}
                  </span>
                  <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', backgroundColor: printFriendly ? '#e2e8f0' : accent, color: printFriendly ? '#0f172a' : '#ffffff' }}>
                    CASH / CREDIT
                  </span>
                </div>
                <table style={{ width: '100%', fontSize: `${10 * scaleVal}px`, borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ color: '#64748b', padding: '0.8mm 0', fontWeight: 500 }}>{L.invoiceNumber}</td>
                      <td style={{ fontWeight: 700, textAlign: 'right', color: '#0f172a' }}>{invoice.invoiceNumber ?? '-'}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b', padding: '0.8mm 0', fontWeight: 500 }}>{L.invoiceDate}</td>
                      <td style={{ fontWeight: 600, textAlign: 'right', color: '#0f172a' }}>{formatDate(invoice.invoiceDate, dateFormat) || '-'}</td>
                    </tr>
                    {invoice.dueDate && (
                      <tr>
                        <td style={{ color: '#64748b', padding: '0.8mm 0', fontWeight: 500 }}>{L.dueDate}</td>
                        <td style={{ fontWeight: 600, textAlign: 'right', color: '#0f172a' }}>{formatDate(invoice.dueDate, dateFormat)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bill To Card */}
            <div style={{
              backgroundColor: printFriendly ? '#f8fafc' : '#f8fafc',
              borderLeft: `4px solid ${accent}`,
              borderRadius: '0 8px 8px 0',
              padding: '2.5mm 4mm',
              marginBottom: '3mm',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
            }}>
              <div style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.8px', color: printFriendly ? '#475569' : accent, textTransform: 'uppercase', marginBottom: '1mm' }}>
                {L.billTo}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{invoice.customerName ?? 'Walk-in Customer'}</div>
              {invoice.customerAddress && <div style={{ color: '#475569', fontSize: `${10 * scaleVal}px`, marginTop: '0.5mm', whiteSpace: 'pre-line' }}>{invoice.customerAddress}</div>}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3mm', marginTop: '0.5mm', fontSize: `${10 * scaleVal}px`, color: '#64748b' }}>
                {invoice.customerPhone && <span>📞 {invoice.customerPhone}</span>}
                {invoice.customerEmail && <span>✉ {invoice.customerEmail}</span>}
                {invoice.customerGstin && <span style={{ fontWeight: 600, color: '#0f172a' }}>GSTIN: {invoice.customerGstin}</span>}
              </div>
            </div>
          </>
        ) : (
          /* Subsequent Page Header */
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${accent}40`, paddingBottom: '2mm', marginBottom: '3mm', fontSize: `${10 * scaleVal}px` }}>
            <span style={{ fontWeight: 700, color: accent }}>{business?.name} — {invoiceLabel} #{invoice.invoiceNumber}</span>
            <span style={{ color: '#64748b' }}>Page {pageNumber} of {totalPages}</span>
          </div>
        )}
      </div>

      {/* Items Table */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: `${10 * scaleVal}px`, tableLayout: 'auto' }}>
          <thead>
            <tr style={{ backgroundColor: printFriendly ? '#f1f5f9' : accent, color: printFriendly ? '#0f172a' : '#ffffff', borderBottom: printFriendly ? '2px solid #94a3b8' : 'none' }}>
              <th style={{ padding: '2mm 2.5mm', textAlign: 'center', fontWeight: 700, width: '38px', borderRadius: '4px 0 0 0' }}>{L.srNo}</th>
              {hasSlNo && <th style={{ padding: '2mm 2mm', textAlign: 'center', fontWeight: 700, width: '55px' }}>Sel. No.</th>}
              <th style={{ padding: '2mm 2.5mm', textAlign: 'left', fontWeight: 700 }}>{L.description}</th>
              {hasAuthor && <th style={{ padding: '2mm 2mm', textAlign: 'left', fontWeight: 700, width: '110px' }}>Author</th>}
              {hasIsbn && <th style={{ padding: '2mm 2mm', textAlign: 'left', fontWeight: 700, width: '90px' }}>ISBN</th>}
              <th style={{ padding: '2mm 2.5mm', textAlign: 'right', fontWeight: 700, width: '75px' }}>{L.unitPrice}</th>
              <th style={{ padding: '2mm 2mm', textAlign: 'center', fontWeight: 700, width: '45px' }}>{L.quantity}</th>
              <th style={{ padding: '2mm 2.5mm', textAlign: 'right', fontWeight: 700, width: '85px', borderRadius: '0 4px 0 0' }}>{L.amount}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, idx: number) => (
              <tr key={idx} data-measure="row" style={{
                backgroundColor: idx % 2 === 1 ? (printFriendly ? '#f8fafc' : `${accent}04`) : 'transparent',
                borderBottom: printFriendly ? '1px solid #cbd5e1' : '1px solid #f1f5f9',
                pageBreakInside: 'avoid',
              }}>
                <td style={{ padding: '2mm 2.5mm', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>{item.srNo}</td>
                {hasSlNo && <td style={{ padding: '2mm 2mm', textAlign: 'center', fontFamily: 'monospace', color: '#475569' }}>{item.slNo || '—'}</td>}
                <td style={{ padding: '2mm 2.5mm', fontWeight: 600, color: '#0f172a', fontSize: `${10.5 * scaleVal * titleScale}px` }}>{item.productName || '—'}</td>
                {hasAuthor && <td style={{ padding: '2mm 2mm', color: '#475569', fontSize: `${9.5 * scaleVal * authorScale}px` }}>{item.author || '—'}</td>}
                {hasIsbn && <td style={{ padding: '2mm 2mm', fontFamily: 'monospace', color: '#475569', fontSize: `${9.5 * scaleVal}px` }}>{item.isbn || '—'}</td>}
                <td style={{ padding: '2mm 2.5mm', textAlign: 'right', color: '#334155' }}>₹{formatNumber(item.unitPrice)}</td>
                <td style={{ padding: '2mm 2mm', textAlign: 'center', fontWeight: 600, color: '#0f172a' }}>{item.quantity}</td>
                <td style={{ padding: '2mm 2.5mm', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>₹{formatNumber(item.lineTotal)}</td>
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

      {/* Footer (Only on final page) */}
      {isLastPage && (
        <div data-measure="footer" style={{ marginTop: 'auto', paddingTop: '3mm' }}>
          {/* Totals & Amount in Words */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '4mm', marginBottom: '3mm' }}>
            {/* Amount In Words */}
            <div style={{ flex: 1, backgroundColor: printFriendly ? '#f8fafc' : `${accent}05`, border: printFriendly ? '1px solid #cbd5e1' : `1px solid ${accent}25`, borderRadius: '6px', padding: '2.5mm 3.5mm' }}>
              <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1mm', fontWeight: 700 }}>
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

            {/* Totals Table */}
            <div style={{ minWidth: '65mm', border: `1px solid ${printFriendly ? '#cbd5e1' : accent + '30'}`, borderRadius: '8px', overflow: 'hidden' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2.5mm 3.5mm', backgroundColor: printFriendly ? '#0f172a' : accent, color: '#ffffff', fontSize: '12px', fontWeight: 800 }}>
                <span>{L.grandTotal}</span>
                <span>{formatINR(calculations.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Bank Details & QR & Signature */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '3mm', borderTop: `1px solid ${printFriendly ? '#cbd5e1' : '#e2e8f0'}`, paddingTop: '2.5mm' }}>
            {/* Bank Info */}
            {business?.bankName ? (
              <div style={{ flex: 1, fontSize: '9.5px', color: '#475569', backgroundColor: printFriendly ? '#f8fafc' : '#f8fafc', padding: '2mm 3mm', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 700, color: accent, textTransform: 'uppercase', marginBottom: '0.5mm', fontSize: '9px' }}>{L.bankDetails}</div>
                <div><strong>Bank:</strong> {business.bankName} | <strong>A/C:</strong> {business.bankAccount || '—'}</div>
                <div><strong>IFSC:</strong> {business.bankIfsc || '—'}{business.bankBranch ? ` | Branch: ${business.bankBranch}` : ''}</div>
              </div>
            ) : <div style={{ flex: 1 }} />}

            {/* Dynamic UPI QR */}
            {(business?.upiQrPath || business?.upiId) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '2mm', padding: '1mm 2mm', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
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
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>UPI Pay</div>
                  <div>Scan with GPay/PhonePe</div>
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
              <div style={{ fontSize: '9.5px', fontWeight: 600, color: '#0f172a' }}>
                {L.forCompany} {business?.name ?? ''}
              </div>
            </div>
          </div>

          {/* Terms and conditions */}
          {business?.terms && (
            <div style={{ fontSize: '8px', color: '#94a3b8', marginTop: '1.5mm', borderTop: '1px dotted #e2e8f0', paddingTop: '1mm', whiteSpace: 'pre-line' }}>
              <strong>Terms:</strong> {business.terms}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
