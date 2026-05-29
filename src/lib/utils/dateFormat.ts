/**
 * Date format utility for Billio.
 * Supports Indian and international date formats.
 * Input: ISO date string (YYYY-MM-DD)
 * Output: Formatted string based on selected format.
 */

const FORMAT_MAP: Record<string, string> = {
  'DD-MM-YYYY': 'DD-MM-YYYY',
  'DD-MM-YY':   'DD-MM-YY',
  'DD/MM/YYYY': 'DD/MM/YYYY',
  'DD/MM/YY':   'DD/MM/YY',
  'MM-DD-YYYY': 'MM-DD-YYYY',
  'MM/DD/YYYY': 'MM/DD/YYYY',
  'YYYY-MM-DD': 'YYYY-MM-DD',
};

export const DATE_FORMAT_OPTIONS = [
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY  (e.g. 29-05-2025) — India Default' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY  (e.g. 29/05/2025)' },
  { value: 'DD-MM-YY',   label: 'DD-MM-YY    (e.g. 29-05-25)' },
  { value: 'DD/MM/YY',   label: 'DD/MM/YY    (e.g. 29/05/25)' },
  { value: 'MM-DD-YYYY', label: 'MM-DD-YYYY  (e.g. 05-29-2025) — US' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY  (e.g. 05/29/2025) — US' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD  (e.g. 2025-05-29) — ISO' },
];

export function formatDate(isoDate: string | undefined | null, format: string): string {
  if (!isoDate) return '';

  // Parse YYYY-MM-DD safely
  const parts = isoDate.split('T')[0].split('-');
  if (parts.length < 3) return isoDate;

  const [yyyy, mm, dd] = parts;
  const yy = yyyy.slice(-2);

  switch (format) {
    case 'DD-MM-YYYY': return `${dd}-${mm}-${yyyy}`;
    case 'DD-MM-YY':   return `${dd}-${mm}-${yy}`;
    case 'DD/MM/YYYY': return `${dd}/${mm}/${yyyy}`;
    case 'DD/MM/YY':   return `${dd}/${mm}/${yy}`;
    case 'MM-DD-YYYY': return `${mm}-${dd}-${yyyy}`;
    case 'MM/DD/YYYY': return `${mm}/${dd}/${yyyy}`;
    case 'YYYY-MM-DD': return `${yyyy}-${mm}-${dd}`;
    default:           return `${dd}-${mm}-${yyyy}`;
  }
}
