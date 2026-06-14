import React from 'react';
import type { TemplateProps } from './types';
import { getLabels } from '@/lib/utils/kannadaLabels';
import { formatNumber, formatINR } from '@/lib/utils/currency';
import { useAppSettingsStore } from '@/stores/useAppSettingsStore';
import { formatDate } from '@/lib/utils/dateFormat';
import { QRCodeSVG } from 'qrcode.react';

export function BasicClean({ invoice, business, items, calculations, language, themeOverrides }: TemplateProps) {
  const L = getLabels(language);
  const accent = themeOverrides?.accentColor ?? business?.accentColor ?? '#1e293b';
  const font = themeOverrides?.fontFamily ?? 'Inter';
  const headerLayout = themeOverrides?.headerLayout ?? 'centered';
  const borderStyle = themeOverrides?.borderStyle ?? 'lines';
  const logoSizePx = { small: 52, medium: 70, large: 95 }[themeOverrides?.logoSize ?? 'medium'];
  const lineHeightVal = { compact: '1.2', normal: '1.4', relaxed: '1.6' }[themeOverrides?.lineSpacing ?? 'normal'];
  const hasIsbn = items.some((i: any) => i.isbn && i.isbn.trim() !== '');
  const hasAuthor = items.some((i: any) => i.author && i.author.trim() !== '');
  const hasSlNo = items.some((i: any) => i.slNo && i.slNo.trim() !== '');
  const isLastPage = (arguments[0] as any)?.pageNumber === undefined
    || (arguments[0] as any)?.totalPages === undefined
    || (arguments[0] as any)?.pageNumber === (arguments[0] as any)?.totalPages;

  const fwMap: Record<string, number> = { light: 300, regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 };
  const baseFW = fwMap[themeOverrides?.fontWeight ?? 'regular'];
  const scaleVal = parseInt(themeOverrides?.fontSize ?? '100') / 100;
  const titleScale = parseInt(themeOverrides?.tableTitleFontSize ?? '100') / 100;
  const authorScale = parseInt(themeOverrides?.tableAuthorFontSize ?? '100') / 100;
  const printFriendly = themeOverrides?.printFriendly ?? false;
  const highContrast = themeOverrides?.highContrast ?? false;

  const { dateFormat, documentLabel } = useAppSettingsStore();
  const invoiceLabel = documentLabel === 'bill' ? L.bill : L.invoice;

  const borderColor = printFriendly ? '#9ca3af' : '#cbd5e1';
  const labelColor = highContrast ? '#0f172a' : '#64748b';
  const textColor = highContrast ? '#000000' : '#1e293b';
  const dimColor = highContrast ? '#374151' : '#94a3b8';

  return (
    <div
      id="invoice-print-area"
      style={{
        fontFamily: `'${font}', sans-serif`,
        width: '210mm',
        minHeight: '296mm',
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
      {/* Watermark is absolute, doesn't affect flow */}
      {themeOverrides?.showWatermark && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%) rotate(-35deg)', fontSize: '64px', fontWeight: 900, color: `${accent}0d`, pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 50 }}>
          {themeOverrides.watermarkText ?? 'ORIGINAL'}
        </div>
      )}

      <div data-measure="header">
        {/* ── Top meta row: Page No | Doc Type | Copy ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5mm 5mm', borderBottom: `1px solid ${borderColor}`, fontSize: `${9 * scaleVal}px`, color: labelColor }}>
        <span>Page No. {(arguments[0] as any)?.pageNumber ?? 1} of {(arguments[0] as any)?.totalPages ?? 1}</span>
        <span style={{ fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: textColor }}>{invoiceLabel.toUpperCase()} OF SUPPLY</span>
        <span>Original Copy</span>
      </div>

      {/* ── Header: Logo + Biz Name + Contact ── */}
      <div style={{
        textAlign: headerLayout === 'split' ? 'left' : 'center',
        padding: '2.5mm 5mm',
        borderBottom: `1px solid ${borderColor}`,
        display: 'flex',
        flexDirection: headerLayout === 'split' ? 'row' : 'column',
        alignItems: headerLayout === 'split' ? 'center' : 'center',
        justifyContent: headerLayout === 'split' ? 'space-between' : 'center',
        gap: '3mm',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3mm', justifyContent: headerLayout === 'centered' ? 'center' : 'flex-start' }}>
          {business?.logoPath && (
            <img src={business.logoPath} alt="logo" style={{ height: `${logoSizePx}px`, maxWidth: '100px', objectFit: 'contain', display: 'block' }} />
          )}
          <div style={{ textAlign: headerLayout === 'centered' ? 'center' : 'left' }}>
            {!business?.logoPath ? null : null}
            <div style={{ fontSize: `${18 * scaleVal}px`, fontWeight: highContrast ? 900 : 800, color: printFriendly ? '#0f172a' : accent, letterSpacing: '-0.3px' }}>
              {business?.name ?? 'Company Name'}
            </div>
            <div style={{ fontSize: `${10 * scaleVal}px`, color: labelColor, marginTop: '0.5mm', whiteSpace: 'pre-line' }}>
              {business?.address ?? 'Add Address'}
            </div>
            {(business?.phone || business?.email) && (
              <div style={{ fontSize: `${10 * scaleVal}px`, color: labelColor, marginTop: '0.3mm' }}>
                {business?.phone ? `Mobile: ${business.phone}` : ''}{business?.phone && business?.email ? ' | ' : ''}{business?.email ? `Email: ${business.email}` : ''}
              </div>
            )}
            {business?.gstin && (
              <div style={{ fontSize: `${10 * scaleVal}px`, color: labelColor, marginTop: '0.3mm' }}>GSTIN: {business.gstin}</div>
            )}
          </div>
        </div>
        {headerLayout === 'split' && (
          <div style={{ textAlign: 'right', fontSize: `${10 * scaleVal}px`, color: labelColor }}>
            <div style={{ fontWeight: 700, color: textColor }}>{L.invoiceNumber}: {invoice.invoiceNumber ?? '—'}</div>
            <div>{L.invoiceDate}: {formatDate(invoice.invoiceDate, dateFormat) || '—'}</div>
            {invoice.dueDate && <div>{L.dueDate}: {formatDate(invoice.dueDate, dateFormat)}</div>}
          </div>
        )}
      </div>

      {/* ── Bill To + Invoice Meta ── */}
      <div style={{ display: 'flex', padding: '2mm 5mm', borderBottom: `1px solid ${borderColor}`, gap: '4mm', fontSize: `${10 * scaleVal}px` }}>
        {/* Billing Details */}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: `${9 * scaleVal}px`, textTransform: 'uppercase', letterSpacing: '0.8px', color: labelColor, marginBottom: '0.5mm' }}>{L.billTo}</div>
          <div style={{ fontWeight: 700, fontSize: `${11 * scaleVal}px`, color: textColor }}>{invoice.customerName ?? '—'}</div>
          {invoice.customerAddress && <div style={{ color: labelColor, whiteSpace: 'pre-line', marginTop: '0.3mm' }}>{invoice.customerAddress}</div>}
          {invoice.customerPhone && <div style={{ color: labelColor }}>📞 {invoice.customerPhone}</div>}
          {invoice.customerGstin && <div style={{ color: labelColor, fontWeight: 600 }}>GSTIN: {invoice.customerGstin}</div>}
        </div>
        {/* Invoice Meta */}
        <div style={{ minWidth: '55mm', textAlign: 'right' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: `${10 * scaleVal}px` }}>
            <tbody>
              <tr>
                <td style={{ padding: '0.5mm 2mm', color: labelColor, textAlign: 'left', whiteSpace: 'nowrap' }}>{L.invoiceNumber}</td>
                <td style={{ padding: '0.5mm 2mm', fontWeight: 700, color: textColor, textAlign: 'right' }}>{invoice.invoiceNumber ?? '—'}</td>
              </tr>
              <tr>
                <td style={{ padding: '0.5mm 2mm', color: labelColor, textAlign: 'left', whiteSpace: 'nowrap' }}>{L.invoiceDate}</td>
                <td style={{ padding: '0.5mm 2mm', fontWeight: 600, color: textColor, textAlign: 'right' }}>{formatDate(invoice.invoiceDate, dateFormat) || '—'}</td>
              </tr>
              {invoice.dueDate && (
                <tr>
                  <td style={{ padding: '0.5mm 2mm', color: labelColor, textAlign: 'left', whiteSpace: 'nowrap' }}>{L.dueDate}</td>
                  <td style={{ padding: '0.5mm 2mm', fontWeight: 600, color: textColor, textAlign: 'right' }}>{formatDate(invoice.dueDate, dateFormat)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* ── Items Table: NO cell borders, zebra-free, just a solid header ── */}
      <div style={{ padding: '0 5mm', flex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: `${10 * scaleVal}px` }}>
          <thead>
            <tr style={{ backgroundColor: printFriendly ? '#f3f4f6' : accent, color: printFriendly ? textColor : (accent === '#1e293b' ? '#ffffff' : '#ffffff') }}>
              <th style={{ padding: '1.5mm 2mm', textAlign: 'center', fontWeight: highContrast ? 800 : 700, fontSize: `${10 * scaleVal}px`, letterSpacing: '0.3px', width: '5%' }}>{L.srNo}</th>
              {hasSlNo && <th style={{ padding: '1.5mm 2mm', textAlign: 'center', fontWeight: highContrast ? 800 : 700, fontSize: `${10 * scaleVal}px`, width: '6%' }}>Sel. No.</th>}
              <th style={{ padding: '1.5mm 2mm', textAlign: 'left', fontWeight: highContrast ? 800 : 700, fontSize: `${10 * scaleVal}px`, width: hasSlNo ? '35%' : '40%' }}>{L.description} / Book Title</th>
              {hasAuthor && <th style={{ padding: '1.5mm 2mm', textAlign: 'left', fontWeight: highContrast ? 800 : 700, fontSize: `${10 * scaleVal}px`, width: '20%' }}>Author</th>}
              {hasIsbn && <th style={{ padding: '1.5mm 2mm', textAlign: 'left', fontWeight: highContrast ? 800 : 700, fontSize: `${10 * scaleVal}px`, width: '12%' }}>{L.isbn}</th>}
              <th style={{ padding: '1.5mm 2mm', textAlign: 'right', fontWeight: highContrast ? 800 : 700, fontSize: `${10 * scaleVal}px`, width: '10%' }}>Unit Price</th>
              <th style={{ padding: '1.5mm 2mm', textAlign: 'center', fontWeight: highContrast ? 800 : 700, fontSize: `${10 * scaleVal}px`, width: '6%' }}>Qty</th>
              <th style={{ padding: '1.5mm 2mm', textAlign: 'right', fontWeight: highContrast ? 800 : 700, fontSize: `${10 * scaleVal}px`, width: '12%' }}>{L.amount}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, idx: number) => (
              <tr key={idx} data-measure="row" style={{
                borderBottom: `1px solid ${printFriendly ? '#e5e7eb' : '#f1f5f9'}`,
                backgroundColor: 'transparent',
              }}>
                <td style={{ padding: '1.2mm 2mm', textAlign: 'center', color: labelColor, fontWeight: highContrast ? 600 : baseFW }}>{item.srNo}</td>
                {hasSlNo && <td style={{ padding: '1.2mm 2mm', textAlign: 'center', color: labelColor, fontFamily: 'monospace', fontWeight: highContrast ? 600 : baseFW }}>{item.slNo || '—'}</td>}
                <td style={{ padding: '1.2mm 2mm', fontWeight: highContrast ? 700 : Math.max(baseFW, 500), fontSize: `${10 * scaleVal * titleScale}px`, color: textColor }}>{item.productName || '—'}</td>
                {hasAuthor && <td style={{ padding: '1.2mm 2mm', color: labelColor, fontSize: `${9.5 * scaleVal * authorScale}px` }}>{item.author || '—'}</td>}
                {hasIsbn && <td style={{ padding: '1.2mm 2mm', fontFamily: 'monospace', color: labelColor, fontWeight: highContrast ? 600 : baseFW }}>{item.isbn || '—'}</td>}
                <td style={{ padding: '1.2mm 2mm', textAlign: 'right', color: labelColor, fontWeight: highContrast ? 600 : baseFW }}>₹{formatNumber(item.unitPrice)}</td>
                <td style={{ padding: '1.2mm 2mm', textAlign: 'center', color: labelColor, fontWeight: highContrast ? 600 : baseFW }}>{item.quantity}</td>
                <td style={{ padding: '1.2mm 2mm', textAlign: 'right', fontWeight: 700, color: textColor }}>₹{formatNumber(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Continuation notice ── */}
      {!isLastPage && (
        <div style={{ textAlign: 'center', margin: '3mm 0', fontSize: '10px', color: labelColor, fontStyle: 'italic' }}>
          Continued on next page...
        </div>
      )}

      {/* ── Last page: Totals + Footer ── */}
      {isLastPage && (
        <div data-measure="footer" style={{ marginTop: 'auto' }}>
          {/* Discount row (if applicable) */}
          {calculations.discountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1mm 5mm', fontSize: `${10 * scaleVal}px`, borderTop: `1px solid ${borderColor}`, color: '#ef4444' }}>
              <span style={{ marginRight: '8mm', color: labelColor }}>{L.discount}</span>
              <span style={{ minWidth: '28mm', textAlign: 'right' }}>-₹{formatNumber(calculations.discountAmount)}</span>
            </div>
          )}
          {calculations.roundOff !== 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1mm 5mm', fontSize: `${10 * scaleVal}px`, color: dimColor }}>
              <span style={{ marginRight: '8mm' }}>{L.roundOff}</span>
              <span style={{ minWidth: '28mm', textAlign: 'right' }}>₹{formatNumber(Math.abs(calculations.roundOff))}</span>
            </div>
          )}
          {/* Subtotal */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1mm 5mm', fontSize: `${10 * scaleVal}px`, borderTop: `1px solid ${borderColor}` }}>
            <span style={{ marginRight: '8mm', color: labelColor }}>{L.subtotal}</span>
            <span style={{ minWidth: '28mm', textAlign: 'right', fontWeight: 600 }}>₹{formatNumber(calculations.subtotal)}</span>
          </div>
          {/* Grand Total */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '2mm 5mm', backgroundColor: printFriendly ? '#f3f4f6' : `${accent}12`, borderTop: `2px solid ${accent}` }}>
            <span style={{ marginRight: '8mm', fontWeight: 800, fontSize: `${11 * scaleVal}px`, color: accent }}>{L.grandTotal}</span>
            <span style={{ minWidth: '28mm', textAlign: 'right', fontWeight: 800, fontSize: `${12 * scaleVal}px`, color: accent }}>{formatINR(calculations.grandTotal)}</span>
          </div>

          {/* Amount in words */}
          <div style={{ padding: '1.5mm 5mm', borderTop: `1px solid ${borderColor}`, fontSize: `${9.5 * scaleVal}px` }}>
            <span style={{ color: labelColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: '2mm' }}>{L.amountInWords}:</span>
            <span style={{ color: textColor, fontWeight: 600 }}>{calculations.amountInWords}</span>
          </div>

          {/* Footer: Bank + QR + Signature */}
          <div style={{ display: 'flex', gap: '4mm', padding: '2mm 5mm', borderTop: `1px solid ${borderColor}` }}>
            {/* Bank Details */}
            {business?.bankName && (
              <div style={{ flex: 1, fontSize: `${10 * scaleVal}px` }}>
                <div style={{ fontWeight: 700, fontSize: `${9 * scaleVal}px`, textTransform: 'uppercase', letterSpacing: '0.5px', color: accent, marginBottom: '1mm' }}>{L.bankDetails}</div>
                <div><span style={{ color: labelColor }}>{L.bankName}: </span><strong style={{ color: textColor }}>{business.bankName}</strong></div>
                {business.bankAccount && <div><span style={{ color: labelColor }}>{L.accountNumber}: </span><strong style={{ color: textColor, letterSpacing: '0.5px' }}>{business.bankAccount}</strong></div>}
                {business.bankIfsc && <div><span style={{ color: labelColor }}>{L.ifscCode}: </span><strong style={{ color: textColor }}>{business.bankIfsc}</strong></div>}
                {business.bankBranch && <div><span style={{ color: labelColor }}>{L.branch}: </span><strong style={{ color: textColor }}>{business.bankBranch}</strong></div>}
              </div>
            )}
            {/* QR Code */}
            {(business?.upiId || business?.upiQrPath) && (
              <div style={{ textAlign: 'center', alignSelf: 'center' }}>
                <div style={{ fontSize: '8px', color: labelColor, marginBottom: '1mm', fontWeight: 600 }}>Scan to Pay</div>
                {business?.upiId ? (
                  <QRCodeSVG
                    value={`upi://pay?pa=${business.upiId}&pn=${encodeURIComponent(business?.name ?? '')}&am=${calculations.grandTotal}&cu=INR`}
                    size={55}
                    level="M"
                  />
                ) : (
                  <img src={business!.upiQrPath!} alt="UPI QR" style={{ width: '55px', height: '55px', objectFit: 'contain' }} />
                )}
              </div>
            )}
            {/* Signature */}
            <div style={{ textAlign: 'center', minWidth: '42mm', alignSelf: 'flex-end' }}>
              {business?.signaturePath && (
                <img src={business.signaturePath} alt="sig" style={{ height: '12mm', maxWidth: '40mm', objectFit: 'contain', display: 'block', margin: '0 auto 1.5mm' }} />
              )}
              <div style={{ borderTop: `1px solid ${printFriendly ? '#9ca3af' : borderColor}`, paddingTop: '1.5mm', fontSize: `${9 * scaleVal}px`, color: labelColor }}>{L.authorizedSignatory}</div>
              <div style={{ fontSize: `${9.5 * scaleVal}px`, fontWeight: 700, color: textColor }}>{L.forCompany} {business?.name ?? ''}</div>
            </div>
          </div>

          {/* Terms & Conditions */}
          {business?.terms && (
            <div style={{ padding: '1.5mm 5mm 2mm', borderTop: `1px solid ${borderColor}`, fontSize: `${9 * scaleVal}px`, color: labelColor }}>
              <strong style={{ color: textColor }}>{L.termsAndConditions}: </strong>
              <span style={{ whiteSpace: 'pre-line' }}>{business.terms}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
