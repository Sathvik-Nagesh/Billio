import type { Business } from '../../types';

function getYearString(format: Business['invoiceYearFormat']): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  switch (format) {
    case 'YYYY':
      return year.toString();
    case 'YY':
      return year.toString().slice(-2);
    case 'FY': {
      // Indian financial year: April to March
      // FY 2025-26 = '2526'
      if (month >= 3) { // April onwards
        const fy2 = (year + 1).toString().slice(-2);
        return year.toString().slice(-2) + fy2;
      } else {
        const fy1 = (year - 1).toString().slice(-2);
        return fy1 + year.toString().slice(-2);
      }
    }
    case 'none':
      return '';
    default:
      return year.toString();
  }
}

export function generateInvoiceNumber(business: Business, sequenceNumber: number): string {
  const prefix = business.invoicePrefix?.trim() ?? '';
  const yearStr = getYearString(business.invoiceYearFormat);
  const sep = business.invoiceSeparator;
  const padded = sequenceNumber.toString().padStart(business.invoicePadding, '0');

  const parts: string[] = [];
  if (prefix) parts.push(prefix);
  if (yearStr) parts.push(yearStr);
  parts.push(padded);

  return parts.join(sep);
}

export function previewInvoiceNumber(business: Partial<Business>, num: number = 1): string {
  const full = {
    invoicePrefix: '',
    invoiceYearFormat: 'FY' as const,
    invoiceSeparator: '-',
    invoicePadding: 3,
    invoiceStartNumber: 1,
    ...business,
  };
  return generateInvoiceNumber(full as Business, num);
}
