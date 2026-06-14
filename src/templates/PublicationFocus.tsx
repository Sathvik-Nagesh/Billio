import React from 'react';
import type { TemplateProps } from './types';
import { getLabels } from '@/lib/utils/kannadaLabels';
import { formatNumber, formatINR } from '@/lib/utils/currency';
import { useAppSettingsStore } from '@/stores/useAppSettingsStore';
import { formatDate } from '@/lib/utils/dateFormat';
import { QRCodeSVG } from 'qrcode.react';

export function PublicationFocus({ invoice, business, items, calculations, language, themeOverrides }: TemplateProps) {
  const L = getLabels(language);
  const accent = themeOverrides?.accentColor ?? business?.accentColor ?? '#6366F1';
  const font = themeOverrides?.fontFamily ?? 'Inter';
  const headerLayout = themeOverrides?.headerLayout ?? 'split';
  const borderStyle = themeOverrides?.borderStyle ?? 'lines';
  const logoSizePx = { small: 64, medium: 90, large: 120 }[themeOverrides?.logoSize ?? 'medium'];
  const lineHeightVal = { compact: '1.25', normal: '1.5', relaxed: '1.75' }[themeOverrides?.lineSpacing ?? 'normal'];
  const hasSlNo = items.some((i: any) => i.slNo && i.slNo.trim() !== '');
  const hasAuthor = items.some((i: any) => i.author && i.author.trim() !== '');
  const hasIsbn = items.some((i: any) => i.isbn && i.isbn.trim() !== '');
  const isLastPage = (arguments[0] as any)?.pageNumber === undefined || (arguments[0] as any)?.totalPages === undefined || (arguments[0] as any)?.pageNumber === (arguments[0] as any)?.totalPages;

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
        backgroundColor: '#ffffff', color: '#1e293b',
        boxSizing: 'border-box',
        border: borderStyle === 'boxed' ? `2px solid ${accent}` : borderStyle === 'lines' ? (printFriendly ? '1px solid #9ca3af' : '1px solid #e2e8f0') : 'none',
        fontSize: `${11 * scaleVal}px`, lineHeight: lineHeightVal, position: 'relative',
        fontWeight: baseFW,
      }}
    >
      {themeOverrides?.showWatermark && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%) rotate(-35deg)', fontSize: '64px', fontWeight: 900, color: `${accent}10`, pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 50 }}>
          {themeOverrides.watermarkText ?? 'ORIGINAL'}
        </div>
      )}

      {/* Dual-color header */}
      <div style={{ display: 'flex', minHeight: '32mm' }}>
        <div style={{ backgroundColor: accent, width: '28mm', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '2mm', padding: '4mm 2mm' }}>
          <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', color: 'white', fontWeight: 900, fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase' }}>
            {invoiceLabel}
          </div>
        </div>
        <div style={{ flex: 1, padding: '5mm 6mm', backgroundColor: `${accent}10`, display: 'flex', justifyContent: headerLayout === 'split' ? 'space-between' : headerLayout === 'centered' ? 'center' : 'flex-start',
        flexDirection: headerLayout === 'centered' ? 'column' : 'row',
        textAlign: headerLayout === 'centered' ? 'center' : 'left', alignItems: 'flex-start' }}>
          <div>
            {business?.logoPath ? <img src={business.logoPath} alt="logo" style={{ height: `${logoSizePx}px`, maxWidth: '160px', objectFit: 'contain', marginBottom: '2mm', display: 'block' }} /> : null}
            {!business?.logoPath ? (
              <div style={{
                fontSize: `${22 * scaleVal}px`,
                fontWeight: highContrast ? 900 : 800,
                color: printFriendly ? '#0f172a' : accent,
                letterSpacing: '-0.5px',
                marginBottom: '2mm',
              }}>{business?.name ?? 'Publisher Name'}</div>
            ) : (
              <div style={{ fontSize: `${18 * scaleVal}px`, fontWeight: highContrast ? 800 : 700, color: '#0f172a' }}>{business?.name ?? 'Publisher Name'}</div>
            )}
            {business?.address && <div style={{ fontSize: `${11 * scaleVal}px`, color: printFriendly ? '#1e293b' : (highContrast ? '#0f172a' : '#374151'), fontWeight: highContrast ? 600 : (baseFW >= 600 ? baseFW : 400), whiteSpace: 'pre-line' }}>{business.address}</div>}
            {business?.gstin && <div style={{ fontSize: `${11 * scaleVal}px`, color: printFriendly ? '#1e293b' : (highContrast ? '#0f172a' : '#374151'), fontWeight: highContrast ? 600 : (baseFW >= 600 ? baseFW : 400) }}>GSTIN: {business.gstin}</div>}
          </div>
          <div style={{ textAlign: 'right', fontSize: `${10 * scaleVal}px` }}>
            <div style={{ fontWeight: 800, fontSize: '11px', marginBottom: '2mm', letterSpacing: '0.5px' }}>CASH / CREDIT</div>
            <div style={{ fontWeight: 700, color: accent }}>{L.invoiceNumber}</div>
            <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '2mm' }}>{invoice.invoiceNumber ?? '—'}</div>
            <div style={{ color: '#64748b' }}>{L.invoiceDate}: <strong>{formatDate(invoice.invoiceDate, dateFormat) || '—'}</strong></div>
            {invoice.dueDate && <div style={{ color: '#64748b' }}>{L.dueDate}: <strong>{formatDate(invoice.dueDate, dateFormat) || ''}</strong></div>}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '5mm 6mm' }}>
        {/* Bill To */}
        <div style={{ marginBottom: '5mm', padding: '3mm 4mm', backgroundColor: printFriendly ? '#f3f4f6' : '#f8fafc', borderRadius: '6px' }}>
          <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1mm' }}>{L.billTo}</div>
          <div style={{ fontWeight: 700, fontSize: '13px' }}>{invoice.customerName ?? '—'}</div>
          {invoice.customerAddress && <div style={{ fontSize: `${10 * scaleVal}px`, color: '#64748b', whiteSpace: 'pre-line' }}>{invoice.customerAddress}</div>}
          {invoice.customerPhone && <div style={{ fontSize: `${10 * scaleVal}px`, color: '#64748b' }}>{L.phone}: {invoice.customerPhone}</div>}
          {invoice.customerGstin && <div style={{ fontSize: `${10 * scaleVal}px`, color: '#64748b' }}>{L.gstin}: {invoice.customerGstin}</div>}
        </div>

        {/* Books Table — ISBN always prominent in this template */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '5mm', fontSize: `${10 * scaleVal}px` }}>
          <thead>
            <tr style={{ borderBottom: `3px solid ${accent}`, borderTop: `3px solid ${accent}` }}>
              <th style={{ padding: '2mm 2mm', textAlign: 'left', fontWeight: highContrast ? 800 : Math.max(700, baseFW), fontSize: `${11 * scaleVal}px`, color: accent, width: '6%' }}>#</th>
              {hasSlNo && (
                <th style={{ padding: '2mm 2mm', textAlign: 'left', fontWeight: highContrast ? 800 : Math.max(700, baseFW), fontSize: `${11 * scaleVal}px`, color: accent, width: '12%', borderBottom: `3px solid ${accent}`, borderTop: `3px solid ${accent}` }}>Sel. No.</th>
              )}
              <th style={{ padding: '2mm 2mm', textAlign: 'left', fontWeight: highContrast ? 800 : Math.max(700, baseFW), fontSize: `${11 * scaleVal}px`, color: accent }}>Book Title / Description</th>
              {hasAuthor && (
                <th style={{ padding: '2mm 2mm', textAlign: 'left', fontWeight: highContrast ? 800 : Math.max(700, baseFW), fontSize: `${11 * scaleVal}px`, color: accent, width: '12%' }}>Author</th>
              )}
              {hasIsbn && (
                <th style={{ padding: '2mm 2mm', textAlign: 'left', fontWeight: highContrast ? 800 : Math.max(700, baseFW), fontSize: `${11 * scaleVal}px`, color: accent, width: '18%', fontFamily: 'monospace' }}>ISBN</th>
              )}
              <th style={{ padding: '2mm 2mm', textAlign: 'right', fontWeight: highContrast ? 800 : Math.max(700, baseFW), fontSize: `${11 * scaleVal}px`, color: accent, width: '11%' }}>MRP</th>
              <th style={{ padding: '2mm 2mm', textAlign: 'center', fontWeight: highContrast ? 800 : Math.max(700, baseFW), fontSize: `${11 * scaleVal}px`, color: accent, width: '8%' }}>Qty</th>
              <th style={{ padding: '2mm 2mm', textAlign: 'right', fontWeight: highContrast ? 800 : Math.max(700, baseFW), fontSize: `${11 * scaleVal}px`, color: accent, width: '14%' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: { srNo: number; slNo?: string; productName: string; author?: string; isbn?: string; quantity: number; unitPrice: number; lineTotal: number }, idx: number) => (
              <tr key={idx} style={{
                borderBottom: printFriendly ? '1px solid #d1d5db' : '1px solid #e2e8f0',
                backgroundColor: 'transparent',
                pageBreakInside: 'avoid',
              }}>
                <td style={{ padding: '1.5mm 2mm', color: printFriendly ? '#1e293b' : (highContrast ? '#0f172a' : '#475569'), fontSize: `${10 * scaleVal}px`, fontWeight: highContrast ? 600 : baseFW }}>{item.srNo}</td>
                {hasSlNo && (
                  <td style={{ padding: '1.5mm 2mm', fontFamily: 'monospace', fontSize: `${10 * scaleVal}px`, color: printFriendly ? '#1e293b' : (highContrast ? '#0f172a' : '#475569'), letterSpacing: '0.5px', fontWeight: highContrast ? 600 : baseFW }}>{item.slNo || '—'}</td>
                )}
                <td style={{ padding: '1.5mm 2mm', fontWeight: highContrast ? 700 : Math.max(baseFW, 500), fontSize: `${10 * scaleVal * titleScale}px`, color: printFriendly ? '#0f172a' : '#1e293b' }}>{item.productName || '—'}</td>
                {hasAuthor && (
                  <td style={{ padding: '1.5mm 2mm', color: printFriendly ? '#475569' : '#64748b', fontSize: `${9.5 * scaleVal * authorScale}px` }}>{item.author || '—'}</td>
                )}
                {hasIsbn && (
                  <td style={{ padding: '1.5mm 2mm', fontFamily: 'monospace', fontSize: `${10 * scaleVal}px`, color: printFriendly ? '#1e293b' : (highContrast ? '#0f172a' : '#475569'), letterSpacing: '0.5px', fontWeight: highContrast ? 600 : baseFW }}>{item.isbn || '—'}</td>
                )}
                <td style={{ padding: '1.5mm 2mm', textAlign: 'right', color: printFriendly ? '#1e293b' : (highContrast ? '#0f172a' : '#475569'), fontSize: `${10 * scaleVal}px`, fontWeight: highContrast ? 600 : baseFW }}>₹{formatNumber(item.unitPrice)}</td>
                <td style={{ padding: '1.5mm 2mm', textAlign: 'center', color: printFriendly ? '#1e293b' : (highContrast ? '#0f172a' : '#475569'), fontSize: `${10 * scaleVal}px`, fontWeight: highContrast ? 600 : baseFW }}>{item.quantity}</td>
                <td style={{ padding: '1.5mm 2mm', textAlign: 'right', fontWeight: 700, color: accent }}>₹{formatNumber(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Continuation Notice */}
        {!isLastPage && (
          <div style={{ textAlign: 'center', margin: '4mm 0', fontSize: '11px', color: '#64748b', fontStyle: 'italic', fontWeight: 600 }}>
            Continued on next page...
          </div>
        )}

        {/* Bottom sections (only on last page) */}
        {isLastPage && (
          <>
            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '5mm' }}>
          <div style={{ minWidth: '65mm', border: `1px solid ${accent}33`, borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2mm 4mm', fontSize: `${10 * scaleVal}px`, borderBottom: `1px solid ${accent}20` }}>
              <span style={{ color: '#64748b' }}>{L.subtotal}</span>
              <span style={{ fontWeight: 600 }}>₹{formatNumber(calculations.subtotal)}</span>
            </div>
            {calculations.discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2mm 4mm', fontSize: `${10 * scaleVal}px`, borderBottom: `1px solid ${accent}20`, color: '#ef4444' }}>
                <span>{L.discount}</span>
                <span>-₹{formatNumber(calculations.discountAmount)}</span>
              </div>
            )}
            {calculations.roundOff !== 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2mm 4mm', fontSize: `${10 * scaleVal}px`, borderBottom: `1px solid ${accent}20`, color: '#94a3b8' }}>
                <span>{L.roundOff}</span>
                <span>₹{formatNumber(Math.abs(calculations.roundOff))}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3mm 4mm', backgroundColor: accent, color: 'white', fontSize: '13px', fontWeight: 800 }}>
              <span>{L.grandTotal}</span>
              <span>{formatINR(calculations.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Amount in Words — fixed nesting */}
        <div style={{ marginBottom: '5mm', padding: '3mm', border: `1px solid ${accent}40`, borderRadius: '4px', backgroundColor: `${accent}05` }}>
          <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', marginBottom: '1mm', fontWeight: 600 }}>{L.amountInWords}</div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b' }}>{calculations.amountInWords}</div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '5mm' }}>
          {business?.bankName && (
            <div style={{ fontSize: '11px', flex: 1 }}>
              <div style={{ fontWeight: 800, color: accent, fontSize: '10px', textTransform: 'uppercase', marginBottom: '2mm' }}>{L.bankDetails}</div>
              <div style={{ backgroundColor: printFriendly ? '#f3f4f6' : '#f8fafc', padding: '4mm', borderRadius: '8px', border: printFriendly ? `2px solid #9ca3af` : `2px solid ${accent}40` }}>
                <div style={{ marginBottom: '2px' }}><span style={{ color: '#475569', fontWeight: 600 }}>{L.bankName}:</span> <strong style={{ color: '#0f172a', fontSize: '12px' }}>{business.bankName}</strong></div>
                {business.bankAccount && <div style={{ marginBottom: '2px' }}><span style={{ color: '#475569', fontWeight: 600 }}>{L.accountNumber}:</span> <strong style={{ color: '#0f172a', fontSize: '12px', letterSpacing: '0.5px' }}>{business.bankAccount}</strong></div>}
                {business.bankIfsc && <div style={{ marginBottom: '2px' }}><span style={{ color: '#475569', fontWeight: 600 }}>{L.ifscCode}:</span> <strong style={{ color: '#0f172a', fontSize: '12px', letterSpacing: '0.5px' }}>{business.bankIfsc}</strong></div>}
                {business.bankBranch && <div><span style={{ color: '#475569', fontWeight: 600 }}>{L.branch}:</span> <strong style={{ color: '#0f172a' }}>{business.bankBranch}</strong></div>}
              </div>
            </div>
          )}
          
          {(business?.upiQrPath || business?.upiId) && (
            <div style={{ flex: '0 0 auto', textAlign: 'center', alignSelf: 'center', padding: '0 4mm' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, color: accent, marginBottom: '2mm', textTransform: 'uppercase' }}>Scan to Pay</div>
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
            <div style={{ borderTop: `2px solid ${accent}`, paddingTop: '2mm', fontSize: '9px', color: '#64748b' }}>{L.authorizedSignatory}</div>
            <div style={{ fontSize: '10px', fontWeight: 700 }}>{L.forCompany} {business?.name ?? ''}</div>
          </div>
        </div>

        {business?.terms && (
          <div style={{ borderTop: printFriendly ? '1px solid #9ca3af' : '1px solid #e2e8f0', marginTop: '4mm', paddingTop: '3mm', fontSize: '9px', color: '#94a3b8' }}>
            <strong style={{ color: '#64748b' }}>{L.termsAndConditions}: </strong>
            <span>{business.terms}</span>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
