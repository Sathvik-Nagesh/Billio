import React, { useRef } from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';
import { Input } from '@/components/ui';
import { formatNumber } from '@/lib/utils/currency';
import type { InvoiceItemForm, Book } from '@/types';
import { BookAutocomplete } from './BookAutocomplete';
import { AuthorAutocomplete } from './AuthorAutocomplete';
import { bookRepository } from '@/lib/db/repositories/bookRepository';

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

// Auto-seed helper
const tryAutoSeedBook = (item: InvoiceItemForm) => {
  if (item.productName && item.productName.trim().length >= 2 && item.unitPrice > 0) {
    try {
      bookRepository.upsert(item.productName.trim(), item.unitPrice, item.author?.trim() || undefined);
    } catch (e) {
      console.warn('Auto-seed book failed:', e);
    }
  }
};

/**
 * Mobile-Friendly Touch Card for Smartphones
 */
export function MobileLineItemCard({
  item,
  onUpdate,
  onRemove,
  showIsbn = false,
  showSlNo = false,
  showAuthor = false,
  onEnterAtEnd,
}: Props) {
  const qtyInputRef = useRef<HTMLInputElement>(null);

  const handleQtyChange = (delta: number) => {
    const current = typeof item.quantity === 'number' ? item.quantity : 1;
    const next = Math.max(1, current + delta);
    onUpdate('quantity', next);
  };

  return (
    <div className="p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl space-y-2.5 shadow-2xs hover:border-[var(--color-primary-300)] transition-all">
      {/* Top Row: Index, Product Search/Title, Delete */}
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)] text-xs font-bold flex items-center justify-center flex-shrink-0 border border-[var(--color-border-light)]">
          {item.srNo}
        </span>
        <div className="flex-1 min-w-0">
          <BookAutocomplete
            value={item.productName}
            onChange={(val) => {
              onUpdate('productName', val);
              tryAutoSeedBook({ ...item, productName: val });
            }}
            onSelectBook={(book: Book) => {
              onUpdate('productName', book.name);
              onUpdate('unitPrice', book.unitPrice);
              if (book.author) onUpdate('author', book.author);
              setTimeout(() => {
                qtyInputRef.current?.focus();
                qtyInputRef.current?.select();
              }, 50);
            }}
            placeholder="Search book or type title..."
            className="h-9 text-sm font-medium"
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors flex-shrink-0 cursor-pointer"
          title="Remove item"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Optional Metadata Row (if enabled via Column settings) */}
      {(showAuthor || showIsbn || showSlNo) && (
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--color-border-light)]">
          {showAuthor && (
            <div className="col-span-2 sm:col-span-1">
              <label className="text-[10px] font-semibold uppercase text-[var(--color-text-muted)] block mb-0.5">Author</label>
              <AuthorAutocomplete
                value={item.author || ''}
                onChange={(val) => {
                  onUpdate('author', val);
                  tryAutoSeedBook({ ...item, author: val });
                }}
                className="h-8 text-xs"
              />
            </div>
          )}
          {showIsbn && (
            <div>
              <label className="text-[10px] font-semibold uppercase text-[var(--color-text-muted)] block mb-0.5">ISBN</label>
              <Input
                value={item.isbn}
                onChange={(e) => onUpdate('isbn', e.target.value)}
                placeholder="ISBN"
                className="h-8 text-xs font-mono"
              />
            </div>
          )}
          {showSlNo && (
            <div>
              <label className="text-[10px] font-semibold uppercase text-[var(--color-text-muted)] block mb-0.5">Sel. No.</label>
              <Input
                value={item.slNo}
                onChange={(e) => onUpdate('slNo', e.target.value)}
                placeholder="Sel. No."
                className="h-8 text-xs font-mono"
              />
            </div>
          )}
        </div>
      )}

      {/* Bottom Row: Unit Price, Stepper Quantity, Line Total */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--color-border-light)]">
        {/* Unit Price */}
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Price (₹)</span>
          <div className="relative w-24">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-muted)] font-bold">₹</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={item.unitPrice === 0 ? '' : item.unitPrice}
              onFocus={(e) => e.target.select()}
              onBlur={() => tryAutoSeedBook(item)}
              onChange={(e) => {
                const val = e.target.value;
                const num = parseFloat(val);
                const unitPrice = val === '' ? 0 : Math.max(0, isNaN(num) ? 0 : num);
                onUpdate('unitPrice', unitPrice);
                tryAutoSeedBook({ ...item, unitPrice });
              }}
              className="h-8 text-sm pl-5 pr-2 font-bold text-left"
              placeholder="0"
            />
          </div>
        </div>

        {/* Quantity Stepper */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Quantity</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleQtyChange(-1)}
              disabled={item.quantity <= 1}
              className="w-7 h-8 flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all font-bold cursor-pointer"
            >
              <Minus size={13} />
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
              className="w-11 h-8 text-center font-bold text-sm px-0.5"
            />
            <button
              type="button"
              onClick={() => handleQtyChange(1)}
              className="w-7 h-8 flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] active:scale-95 transition-all font-bold cursor-pointer"
            >
              <Plus size={13} />
            </button>
          </div>
        </div>

        {/* Total Badge */}
        <div className="flex flex-col items-end pl-2">
          <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Line Total</span>
          <div className="text-base font-black text-[var(--color-primary)]">
            ₹{formatNumber(item.lineTotal)}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Standard Desktop / Tablet Table Row
 */
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
          onChange={(val) => {
            onUpdate('productName', val);
            tryAutoSeedBook({ ...item, productName: val });
          }}
          onSelectBook={(book: Book) => {
            onUpdate('productName', book.name);
            onUpdate('unitPrice', book.unitPrice);
            if (book.author) {
              onUpdate('author', book.author);
            }
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
            onChange={(val) => {
              onUpdate('author', val);
              tryAutoSeedBook({ ...item, author: val });
            }}
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
            onBlur={() => tryAutoSeedBook(item)}
            onChange={(e) => {
              const val = e.target.value;
              const num = parseFloat(val);
              const unitPrice = val === '' ? 0 : Math.max(0, isNaN(num) ? 0 : num);
              onUpdate('unitPrice', unitPrice);
              tryAutoSeedBook({ ...item, unitPrice });
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
            className="w-6 h-8 flex items-center justify-center rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
            className="w-6 h-8 flex items-center justify-center rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors cursor-pointer"
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
          className="h-8 w-7 rounded-md flex items-center justify-center text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-all cursor-pointer"
          title="Remove row"
          tabIndex={-1}
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );
}
