import type { InvoiceItemForm, InvoiceCalculations } from '../../types';
import { amountToWords } from './currency';

export function calculateInvoice(
  items: InvoiceItemForm[],
  discountType: 'percentage' | 'flat',
  discountValue: number
): InvoiceCalculations {
  const rawSubtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const subtotal = Number(rawSubtotal.toFixed(2));

  let discountAmount = 0;
  if (discountType === 'percentage') {
    discountAmount = Number(((subtotal * Math.min(discountValue, 100)) / 100).toFixed(2));
  } else {
    discountAmount = Number(Math.min(discountValue, subtotal).toFixed(2));
  }

  const afterDiscount = Number((subtotal - discountAmount).toFixed(2));
  const grandTotal = Math.round(afterDiscount);
  const roundOff = Number((grandTotal - afterDiscount).toFixed(2));

  return {
    subtotal,
    discountAmount,
    roundOff,
    grandTotal,
    amountInWords: amountToWords(grandTotal),
  };
}

export function calculateLineTotal(quantity: number, unitPrice: number): number {
  return Number((Math.max(0, quantity) * Math.max(0, unitPrice)).toFixed(2));
}
