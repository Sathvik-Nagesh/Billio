import type { InvoiceItemForm } from '@/types';

/**
 * Splits an array of invoice items into chunks for pagination.
 * The first page can usually fit fewer items because of the invoice header.
 * 
 * @param items The items to chunk
 * @param firstPageLimit The maximum number of items on the first page
 * @param subsequentPageLimit The maximum number of items on subsequent pages
 * @returns An array of item arrays, each representing a page
 */
export function chunkInvoiceItems<T>(
  items: T[],
  firstPageLimit = 18,
  subsequentPageLimit = 25
): T[][] {
  const chunks: T[][] = [];
  const remaining = [...items];

  if (remaining.length <= firstPageLimit) {
    chunks.push(remaining);
  } else {
    chunks.push(remaining.splice(0, firstPageLimit));
    while (remaining.length > 0) {
      chunks.push(remaining.splice(0, subsequentPageLimit));
    }
  }

  // Ensure there's always at least one page even if items are empty
  if (chunks.length === 0) {
    chunks.push([]);
  }

  return chunks;
}
