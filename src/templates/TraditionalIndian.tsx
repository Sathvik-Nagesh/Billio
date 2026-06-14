import React from 'react';
import type { TemplateProps } from './types';
import { getLabels } from '@/lib/utils/kannadaLabels';
import { formatNumber, formatINR } from '@/lib/utils/currency';
import { useAppSettingsStore } from '@/stores/useAppSettingsStore';
import { formatDate } from '@/lib/utils/dateFormat';
import { QRCodeSVG } from 'qrcode.react';

export function TraditionalIndian({ invoice, business, items, calculations, language, themeOverrides }: TemplateProps) {
  const L = getLabels(language);
  const accent = themeOverrides?.accentColor ?? business?.accentColor ?? '#6366F1';
  const font = themeOverrides?.fontFamily ?? 'Roboto';
  const headerLayout = themeOverrides?.headerLayout ?? 'split';
  const borderStyle = themeOverrides?.borderStyle ?? 'lines';
  const logoSizePx = { small: 64, medium: 90, large: 120 }[themeOverrides?.logoSize ?? 'medium'];
  const lineHeightVal = { compact: '1.25', normal: '1.5', relaxed: '1.75' }[themeOverrides?.lineSpacing ?? 'normal'];
  const hasIsbn = items.some((i: { isbn?: string; slNo?: string }) => i.isbn);
  const hasAuthor = items.some((i: any) => i.author && i.author.trim() !== '');
  const hasSlNo = items.some((i: any) => i.slNo && i.slNo.trim() !== '');
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

  const tdStyle: React.CSSProperties = { border: `1px solid ${accent}55`, padding: '1.5mm 3mm', fontSize: `${10 * scaleVal}px` };
  const thStyle: React.CSSProperties = { ...tdStyle, backgroundColor: accent, color: 'white', fontWeight: highContrast ? 800 : Math.max(700, baseFW), fontSize: `${11 * scaleVal}px`, textTransform: 'uppercase', letterSpacing: '0.3px' };

  return (
    <div
      id="invoice-print-area"
      style={{
        fontFamily: `'${font}', sans-serif`,
        width: '210mm',
        backgroundColor: '#ffffff',
        color: '#1a1a1a',
        boxSizing: 'border-box',
        border: borderStyle === 'boxed' ? `2px solid ${accent}` : borderStyle === 'lines' ? (printFriendly ? '1px solid #9ca3af' : '1px solid #e2e8f0') : 'none',
        fontSize: `${11 * scaleVal}px`,
        lineHeight: lineHeightVal,
        position: 'relative',
        fontWeight: baseFW,
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
            {!business?.logoPath ? (
              <div style={{
                fontSize: `${22 * scaleVal}px`,
                fontWeight: highContrast ? 900 : 800,
                color: printFriendly ? '#0f172a' : accent,
                letterSpacing: '-0.5px',
                marginBottom: '2mm',
              }}>{business?.name ?? 'Business Name'}</div>
            ) : (
              <div style={{ fontSize: `${18 * scaleVal}px`, fontWeight: highContrast ? 800 : 700, color: '#0f172a' }}>{business?.name ?? 'Business Name'}</div>
            )}
            {business?.address && <div style={{ fontSize: `${11 * scaleVal}px`, color: printFriendly ? '#1e293b' : (highContrast ? '#0f172a' : '#374151'), fontWeight: highContrast ? 600 : (baseFW >= 600 ? baseFW : 400), whiteSpace: 'pre-line' }}>{business.address}</div>}
            {business?.phone && <div style={{ fontSize: `${11 * scaleVal}px`, color: printFriendly ? '#1e293b' : (highContrast ? '#0f172a' : '#374151'), fontWeight: highContrast ? 600 : (baseFW >= 600 ? baseFW : 400) }}>Ph: {business.phone}</div>}
            {business?.email && <div style={{ fontSize: `${11 * scaleVal}px`, color: printFriendly ? '#1e293b' : (highContrast ? '#0f172a' : '#374151'), fontWeight: highContrast ? 600 : (baseFW >= 600 ? baseFW : 400) }}>{business.email}</div>}
            {business?.gstin && <div style={{ fontSize: `${11 * scaleVal}px`, fontWeight: highContrast ? 700 : 600 }}>GSTIN: {business.gstin}</div>}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{
          textAlign: 'center', fontSize: '18px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px',
          color: accent, borderTop: `1px solid ${accent}`, borderBottom: `1px solid ${accent}`, padding: '1mm 0',
        }}>
          {invoiceLabel} <span style={{ fontSize: '12px', fontWeight: 700, verticalAlign: 'middle', marginLeft: '4mm' }}>CASH / CREDIT</span>
        </div>
        </div>
      </div>

      {/* Invoice Meta Table */}
      <div style={{ borderBottom: `1px solid ${accent}55`, padding: '3mm 6mm' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: `${10 * scaleVal}px` }}>
          <tbody>
            <tr>
              <td style={{ width: '50%', verticalAlign: 'top', paddingRight: '4mm' }}>
                <div style={{ fontWeight: 700, color: accent, fontSize: `${9 * scaleVal}px`, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1mm' }}>{L.billTo}</div>
                <div style={{ fontWeight: 700, fontSize: '12px' }}>{invoice.customerName ?? '—'}</div>
                {invoice.customerAddress && <div style={{ color: printFriendly ? '#1e293b' : '#555', whiteSpace: 'pre-line', fontSize: `${10 * scaleVal}px` }}>{invoice.customerAddress}</div>}
                {invoice.customerPhone && <div style={{ fontSize: `${10 * scaleVal}px`, color: printFriendly ? '#1e293b' : '#555' }}>{L.phone}: {invoice.customerPhone}</div>}
                {invoice.customerGstin && <div style={{ fontSize: `${10 * scaleVal}px`, fontWeight: 600 }}>{L.gstin}: {invoice.customerGstin}</div>}
              </td>
              <td style={{ verticalAlign: 'top' }}>
                <table style={{ width: '100%', fontSize: `${10 * scaleVal}px`, borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr><td style={{ ...tdStyle, fontWeight: 600 }}>{L.invoiceNumber}</td><td style={tdStyle}>{invoice.invoiceNumber ?? '—'}</td></tr>
                    <tr><td style={{ ...tdStyle, fontWeight: 600 }}>{L.invoiceDate}</td><td style={tdStyle}>{formatDate(invoice.invoiceDate, dateFormat) || '—'}</td></tr>
                    {invoice.dueDate && <tr><td style={{ ...tdStyle, fontWeight: 600 }}>{L.dueDate}</td><td style={tdStyle}>{formatDate(invoice.dueDate, dateFormat) || ''}</td></tr>}
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
              {hasSlNo && <th style={{ ...thStyle, width: '10%' }}>Sel. No.</th>}
              <th style={{ ...thStyle, textAlign: 'left' }}>{L.description}</th>
              {hasAuthor && <th style={{ ...thStyle, width: '14%', textAlign: 'left' }}>Author</th>}
              {hasIsbn && <th style={{ ...thStyle, width: '14%', textAlign: 'left' }}>{L.isbn}</th>}
              <th style={{ ...thStyle, width: '11%', textAlign: 'right' }}>{L.unitPrice}</th>
              <th style={{ ...thStyle, width: '8%' }}>{L.quantity}</th>
              <th style={{ ...thStyle, width: '14%', textAlign: 'right' }}>{L.amount}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: { srNo: number; slNo?: string; productName: string; author?: string; isbn?: string; quantity: number; unitPrice: number; lineTotal: number }, idx: number) => (
              <tr key={idx} style={{
                backgroundColor: 'transparent',
                borderBottom: printFriendly ? '1px solid #d1d5db' : undefined,
                pageBreakInside: 'avoid',
              }}>
                <td style={{ ...tdStyle, textAlign: 'center', color: printFriendly ? '#1e293b' : (highContrast ? '#0f172a' : '#475569'), fontWeight: highContrast ? 600 : baseFW }}>{item.srNo}</td>
              {hasSlNo && <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: `${10 * scaleVal}px`, color: printFriendly ? '#1e293b' : (highContrast ? '#0f172a' : '#475569'), textAlign: 'center', fontWeight: highContrast ? 600 : baseFW }}>{item.slNo || '—'}</td>}
              <td style={{ ...tdStyle, fontWeight: highContrast ? 700 : Math.max(baseFW, 500), fontSize: `${10 * scaleVal * titleScale}px`, color: printFriendly ? '#0f172a' : '#1e293b' }}>{item.productName || '—'}</td>
              {hasAuthor && <td style={{ ...tdStyle, color: printFriendly ? '#475569' : '#64748b', fontSize: `${9.5 * scaleVal * authorScale}px` }}>{item.author || '—'}</td>}
              {hasIsbn && <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: `${10 * scaleVal}px`, color: printFriendly ? '#1e293b' : (highContrast ? '#0f172a' : '#475569'), fontWeight: highContrast ? 600 : baseFW }}>{item.isbn || '—'}</td>}
                <td style={{ ...tdStyle, textAlign: 'right', color: printFriendly ? '#1e293b' : (highContrast ? '#0f172a' : '#475569'), fontWeight: highContrast ? 600 : baseFW }}>₹{formatNumber(item.unitPrice)}</td>
                <td style={{ ...tdStyle, textAlign: 'center', color: printFriendly ? '#1e293b' : (highContrast ? '#0f172a' : '#475569'), fontWeight: highContrast ? 600 : baseFW }}>{item.quantity}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>₹{formatNumber(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Bottom sections (only on last page) */}
        {isLastPage && (
          <>
            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4mm' }}>
          <table style={{ fontSize: `${10 * scaleVal}px`, borderCollapse: 'collapse', minWidth: '65mm' }}>
            <tbody>
              <tr><td style={tdStyle}>{L.subtotal}</td><td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>₹{formatNumber(calculations.subtotal)}</td></tr>
              {calculations.discountAmount > 0 && <tr><td style={{ ...tdStyle, color: '#ef4444' }}>{L.discount}</td><td style={{ ...tdStyle, textAlign: 'right', color: '#ef4444', fontWeight: 600 }}>-₹{formatNumber(calculations.discountAmount)}</td></tr>}
              {calculations.roundOff !== 0 && <tr><td style={{ ...tdStyle, color: '#888' }}>{L.roundOff}</td><td style={{ ...tdStyle, textAlign: 'right', color: '#888' }}>₹{formatNumber(Math.abs(calculations.roundOff))}</td></tr>}
              <tr><td style={{ ...thStyle, fontSize: '11px' }}>{L.grandTotal}</td><td style={{ ...thStyle, textAlign: 'right', fontSize: '12px' }}>{formatINR(calculations.grandTotal)}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Amount in Words — fixed nesting */}
        <div style={{ marginTop: '4mm', padding: '3mm', border: `1px solid ${accent}40`, borderRadius: '4px', backgroundColor: `${accent}05` }}>
          <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', marginBottom: '1mm', fontWeight: 600 }}>{L.amountInWords}</div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b' }}>{calculations.amountInWords}</div>
        </div>

        {/* Bank & Signature */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4mm', marginBottom: '4mm', marginTop: '4mm' }}>
          {business?.bankName && (
            <div style={{ fontSize: '11px', flex: 1 }}>
              <div style={{ fontWeight: 800, color: accent, fontSize: '10px', textTransform: 'uppercase', marginBottom: '2mm' }}>{L.bankDetails}</div>
              <div style={{ border: printFriendly ? `2px solid #9ca3af` : `2px solid ${accent}`, padding: '3.5mm', backgroundColor: printFriendly ? '#f3f4f6' : '#fafafa' }}>
                <div style={{ marginBottom: '2px' }}><span style={{ color: '#444', fontWeight: 600 }}>{L.bankName}: </span><strong style={{ color: '#000', fontSize: '12px' }}>{business.bankName}</strong></div>
                {business.bankAccount && <div style={{ marginBottom: '2px' }}><span style={{ color: '#444', fontWeight: 600 }}>{L.accountNumber}: </span><strong style={{ color: '#000', fontSize: '12px', letterSpacing: '0.5px' }}>{business.bankAccount}</strong></div>}
                {business.bankIfsc && <div style={{ marginBottom: '2px' }}><span style={{ color: '#444', fontWeight: 600 }}>{L.ifscCode}: </span><strong style={{ color: '#000', fontSize: '12px', letterSpacing: '0.5px' }}>{business.bankIfsc}</strong></div>}
                {business.bankBranch && <div><span style={{ color: '#444', fontWeight: 600 }}>{L.branch}: </span><strong style={{ color: '#000' }}>{business.bankBranch}</strong></div>}
              </div>
            </div>
          )}
          
          {(business?.upiQrPath || business?.upiId) && (
            <div style={{ flex: '0 0 auto', textAlign: 'center', alignSelf: 'center', padding: '0 4mm' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, color: '#555', marginBottom: '2mm', textTransform: 'uppercase' }}>Scan to Pay</div>
              {business.upiId ? (
                <QRCodeSVG 
                  value={`upi://pay?pa=${business.upiId}&pn=${encodeURIComponent(business.name)}&am=${calculations.grandTotal}&cu=INR`}
                  size={60}
                  level="M"
                />
              ) : (
                <img src={business.upiQrPath} alt="UPI QR" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
              )}
            </div>
          )}
          
          <div style={{ textAlign: 'center', minWidth: '45mm' }}>
            {business?.signaturePath && <img src={business.signaturePath} alt="sig" style={{ height: '14mm', maxWidth: '44mm', objectFit: 'contain', display: 'block', margin: '0 auto 2mm' }} />}
            <div style={{ borderTop: `2px solid ${accent}`, paddingTop: '2mm', fontSize: '9px', color: '#555' }}>{L.authorizedSignatory}</div>
            <div style={{ fontSize: '10px', fontWeight: 700 }}>{L.forCompany} {business?.name ?? ''}</div>
          </div>
        </div>

        {business?.terms && (
          <div style={{ borderTop: printFriendly ? `1px solid #9ca3af` : `1px solid ${accent}55`, paddingTop: '3mm', fontSize: '9px', color: '#888' }}>
            <strong style={{ color: '#555' }}>{L.termsAndConditions}: </strong>
            <span style={{ whiteSpace: 'pre-line' }}>{business.terms}</span>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
