import type { InvoiceItemForm, InvoiceCalculations } from '../../types';
import { amountToWords } from './currency';

export function calculateInvoice(
  items: InvoiceItemForm[],
  discountType: 'percentage' | 'flat',
  discountValue: number
): InvoiceCalculations {
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  let discountAmount = 0;
  if (discountType === 'percentage') {
    discountAmount = (subtotal * Math.min(discountValue, 100)) / 100;
  } else {
    discountAmount = Math.min(discountValue, subtotal);
  }

  const afterDiscount = subtotal - discountAmount;
  const roundOff = Math.round(afterDiscount) - afterDiscount;
  const grandTotal = afterDiscount + roundOff;

  return {
    subtotal,
    discountAmount,
    roundOff,
    grandTotal,
    amountInWords: amountToWords(grandTotal),
  };
}

export function calculateLineTotal(quantity: number, unitPrice: number): number {
  return Math.max(0, quantity) * Math.max(0, unitPrice);
}
