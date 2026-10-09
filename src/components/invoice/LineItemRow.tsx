import React, { useRef } from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';
import { Input } from '@/components/ui';
import { formatNumber } from '@/lib/utils/currency';
import type { InvoiceItemForm, Book } from '@/types';
import { BookAutocomplete } from './BookAutocomplete';
import { AuthorAutocomplete } from './AuthorAutocomplete';

interface Props {
  item: InvoiceItemForm;
  onUpdate: <K extends keyof InvoiceItemForm>(key: K, value: InvoiceItemForm[K]) => void;
  onRemove: () => void;
  showIsbn?: boolean;
  showSlNo?: boolean;
  showAuthor?: boolean;
  isLast?: boolean;
  onEnterAtEnd?: () => void;
}

export function LineItemRow({
  item,
  onUpdate,
  onRemove,
  showIsbn = false,
  showSlNo = false,
  showAuthor = false,
  isLast,
  onEnterAtEnd
}: Props) {
  const qtyInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onEnterAtEnd) {
      e.preventDefault();
      onEnterAtEnd();
    }
  };

  const handleQtyChange = (delta: number) => {
    const current = typeof item.quantity === 'number' ? item.quantity : 1;
    const next = Math.max(1, current + delta);
    onUpdate('quantity', next);
  };

  return (
    <tr className="line-item-row group border-b border-[var(--color-border-light)] last:border-b-0 hover:bg-[var(--color-surface-secondary)]/40 transition-colors">
      {/* Sr No */}
      <td className="py-2 px-1 text-center text-xs font-semibold text-[var(--color-text-muted)] w-7">
        {item.srNo}
      </td>

      {/* Selection Number */}
      {showSlNo && (
        <td className="py-1 px-1 w-20">
          <Input
            value={item.slNo}
            onChange={(e) => onUpdate('slNo', e.target.value)}
            placeholder="Sel. No."
            className="h-8 text-xs font-mono"
            title="Selection number for library orders"
          />
        </td>
      )}

      {/* Product / Book Name */}
      <td className="py-1 px-1 relative">
        <BookAutocomplete
          value={item.productName}
          onChange={(val) => onUpdate('productName', val)}
          onSelectBook={(book: Book) => {
            onUpdate('productName', book.name);
            onUpdate('unitPrice', book.unitPrice);
            if (book.author) {
              onUpdate('author', book.author);
            }
            // If quantity is currently 1 or empty, focus the quantity input or next row
            setTimeout(() => {
              qtyInputRef.current?.focus();
              qtyInputRef.current?.select();
            }, 50);
          }}
          className="h-8 text-sm font-medium"
        />
      </td>

      {/* Author / Translator */}
      {showAuthor && (
        <td className="py-1 px-1 w-32">
          <AuthorAutocomplete
            value={item.author || ''}
            onChange={(val) => onUpdate('author', val)}
            className="h-8 text-xs"
          />
        </td>
      )}

      {/* ISBN */}
      {showIsbn && (
        <td className="py-1 px-1 w-24">
          <Input
            value={item.isbn}
            onChange={(e) => onUpdate('isbn', e.target.value)}
            placeholder="ISBN"
            className="h-8 text-xs font-mono"
          />
        </td>
      )}

      {/* Unit Price */}
      <td className="py-1 px-1 w-24">
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-muted)] font-medium">₹</span>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={item.unitPrice === 0 ? '' : item.unitPrice}
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              const val = e.target.value;
              const num = parseFloat(val);
              onUpdate('unitPrice', val === '' ? 0 : Math.max(0, isNaN(num) ? 0 : num));
            }}
            className="h-8 text-sm pl-5 text-right font-medium"
          />
        </div>
      </td>

      {/* Quantity with Steppers */}
      <td className="py-1 px-1 w-28">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleQtyChange(-1)}
            disabled={item.quantity <= 1}
            className="w-6 h-8 flex items-center justify-center rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Decrease quantity"
            tabIndex={-1}
          >
            <Minus size={11} />
          </button>
          <Input
            ref={qtyInputRef}
            type="number"
            min="1"
            value={item.quantity === 0 ? '' : item.quantity}
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              const val = e.target.value;
              const num = parseInt(val, 10);
              onUpdate('quantity', val === '' ? 0 : Math.max(0, isNaN(num) ? 0 : num));
            }}
            onKeyDown={handleKeyDown}
            className="h-8 text-sm text-center font-semibold flex-1 px-1"
          />
          <button
            type="button"
            onClick={() => handleQtyChange(1)}
            className="w-6 h-8 flex items-center justify-center rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
            title="Increase quantity"
            tabIndex={-1}
          >
            <Plus size={11} />
          </button>
        </div>
      </td>

      {/* Row Total */}
      <td className="py-1 px-1.5 text-right whitespace-nowrap text-xs font-bold text-[var(--color-text-primary)] w-20">
        ₹{formatNumber(item.lineTotal)}
      </td>

      {/* Remove Action */}
      <td className="py-1 px-1 w-7 text-center">
        <button
          type="button"
          onClick={onRemove}
          className="h-8 w-7 rounded-md flex items-center justify-center text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-all"
          title="Remove row"
          tabIndex={-1}
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );
}
