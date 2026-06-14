import type { InvoiceFormState, Business } from '@/types';

/**
 * Splits an array of invoice items into pages using a millimeter-based
 * height estimation engine.
 *
 * KEY DESIGN DECISIONS:
 * - A4 total: 297mm. Content area after margins: 265mm.
 * - The FOOTER (totals, bank details, etc.) ONLY appears on the LAST page.
 *   All intermediate pages pack items as tightly as possible.
 * - Two-pass algorithm:
 *   Pass 1: Greedily pack items into pages, ignoring the footer.
 *   Pass 2: Check if the last page's content + footer fits within 265mm.
 *           If not, keep spilling items off the last page to a new final
 *           page until the footer fits (or only 1 item remains).
 */
export interface PaginationMeasurements {
  firstPageHeaderPx: number;
  subsequentHeaderPx: number;
  footerPx: number;
  rowHeightsPx: number[];
}

/**
 * Splits an array of invoice items into pages using exact pixel measurements
 * from the DOM. A4 height is 1123px at 96dpi.
 */
export function chunkInvoiceItems(
  items: any[],
  measurements?: PaginationMeasurements | null
): any[][] {
  if (items.length === 0) return [[]];

  // If measurements are not yet available, return a single un-paginated chunk
  // so the hidden DOM pass can render everything on one page to measure it.
  if (!measurements) {
    return [items];
  }

  const PAGE_PX = 1123; // A4 height
  const SAFETY_MARGIN_PX = 40; // ~10mm safety margin at bottom
  const MAX_PAGE_H = PAGE_PX - SAFETY_MARGIN_PX;

  const chunks: any[][] = [];
  let currentChunk: any[] = [];
  let usedPx = measurements.firstPageHeaderPx;

  for (let i = 0; i < items.length; i++) {
    const rh = measurements.rowHeightsPx[i] ?? 30; // fallback to 30px if missing

    if (usedPx + rh > MAX_PAGE_H && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = [];
      usedPx = measurements.subsequentHeaderPx;
    }
    currentChunk.push(items[i]);
    usedPx += rh;
  }
  if (currentChunk.length > 0) chunks.push(currentChunk);

  // PASS 2: Ensure the footer fits on the LAST page
  const calcLastChunkPx = (): number => {
    const headerPx = chunks.length === 1 ? measurements.firstPageHeaderPx : measurements.subsequentHeaderPx;
    let px = headerPx;
    
    // Find the original indices of the items in the last chunk
    const lastChunk = chunks[chunks.length - 1];
    for (const item of lastChunk) {
      const globalIdx = items.indexOf(item);
      px += measurements.rowHeightsPx[globalIdx] ?? 30;
    }
    return px;
  };

  // Spill items off the last page until the footer fits
  while (
    chunks[chunks.length - 1].length > 1 &&
    calcLastChunkPx() + measurements.footerPx > MAX_PAGE_H
  ) {
    const spillItem = chunks[chunks.length - 1].pop()!;
    chunks.push([spillItem]);
  }

  return chunks.length > 0 ? chunks : [[]];
}

