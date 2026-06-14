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
export function chunkInvoiceItems(
  items: any[],
  _form?: InvoiceFormState,
  business?: Business | null
): any[][] {
  if (items.length === 0) return [[]];

  // ── HEIGHT CONSTANTS (mm) ────────────────────────────────────────────────
  const PAGE_MM = 265; // A4 297mm minus ~32mm total margins

  // First page has logo, biz name, address, bill-to section, table header
  const FIRST_PAGE_HEADER_MM = 55;  // Logo + biz info + bill-to + table header (tightened templates)
  const SUBSEQUENT_HEADER_MM = 15;  // Just the table header row on continuation pages

  // Footer height — only needs to fit on the LAST page
  let footerMm = 30; // Totals section (subtotal, grand total, amount in words)
  if (business?.bankName || business?.bankAccount) footerMm += 20;
  if (business?.signaturePath)                     footerMm += 18;
  if (business?.terms) {
    const lineCount = Math.min(business.terms.split('\n').length, 10); // cap at 10 lines
    footerMm += 6 + lineCount * 3;
  }

  // Per-row height — base 7mm, growing for long book/product names that wrap
  const rowMm = (item: any): number => {
    const len = (item.productName ?? '').length;
    if (len > 70) return 17;
    if (len > 35) return 12;
    return 7;
  };

  // ── PASS 1: Greedy packing (no footer reservation) ──────────────────────
  const chunks: any[][] = [];
  let currentChunk: any[] = [];
  let usedMm = FIRST_PAGE_HEADER_MM;

  for (const item of items) {
    const rh = rowMm(item);
    if (usedMm + rh > PAGE_MM && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = [];
      usedMm = SUBSEQUENT_HEADER_MM;
    }
    currentChunk.push(item);
    usedMm += rh;
  }
  if (currentChunk.length > 0) chunks.push(currentChunk);

  // ── PASS 2: Ensure footer fits on the LAST page ──────────────────────────
  const calcLastChunkMm = (): number => {
    // The last chunk's header size depends on whether it's the very first page
    const headerMm = chunks.length === 1 ? FIRST_PAGE_HEADER_MM : SUBSEQUENT_HEADER_MM;
    let mm = headerMm;
    for (const item of chunks[chunks.length - 1]) mm += rowMm(item);
    return mm;
  };

  // Spill items off the last page until the footer fits
  while (
    chunks[chunks.length - 1].length > 1 &&
    calcLastChunkMm() + footerMm > PAGE_MM
  ) {
    const spillItem = chunks[chunks.length - 1].pop()!;
    chunks.push([spillItem]);
    // After spilling to a new final page, the new last page header cost is
    // SUBSEQUENT_HEADER_MM, already accounted for in calcLastChunkMm on next iteration.
  }

  return chunks.length > 0 ? chunks : [[]];
}
