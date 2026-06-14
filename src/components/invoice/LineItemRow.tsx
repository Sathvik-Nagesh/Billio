import React, { useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { Input } from '@/components/ui';
import { formatNumber } from '@/lib/utils/currency';
import type { InvoiceItemForm, Book } from '@/types';
import { BookAutocomplete } from './BookAutocomplete';

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

export function LineItemRow({ item, onUpdate, onRemove, showIsbn = false, showSlNo = false, showAuthor = false, isLast, onEnterAtEnd }: Props) {
  const lastInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isLast && onEnterAtEnd) {
      e.preventDefault();
      onEnterAtEnd();
    }
  };

  return (
    <tr className="line-item-row group border-b border-[var(--color-border-light)] last:border-b-0">
      {/* Sr No */}
      <td className="py-1 px-2 text-center text-sm text-[var(--color-text-muted)] w-8">
        {item.srNo}
      </td>

      {/* Selection Number — optional, for government library orders */}
      {showSlNo && (
        <td className="py-0.5 px-1 w-16">
          <Input
            value={item.slNo}
            onChange={(e) => onUpdate('slNo', e.target.value)}
            placeholder="Sel. No."
            className="h-7 text-sm"
            title="Selection number used for government library orders"
          />
        </td>
      )}

      {/* Product Name */}
      <td className="py-0.5 px-1 relative">
        <BookAutocomplete
          value={item.productName}
          onChange={(val) => onUpdate('productName', val)}
          onSelectBook={(book: Book) => {
            onUpdate('productName', book.name);
            onUpdate('unitPrice', book.unitPrice);
            if (book.author) {
              onUpdate('author', book.author);
            }
          }}
          className="h-7 text-sm"
        />
      </td>

      {/* Author/Translator */}
      {showAuthor && (
        <td className="py-0.5 px-1 w-28">
          <Input
            value={item.author}
            onChange={(e) => onUpdate('author', e.target.value)}
            placeholder="Author / Translator"
            className="h-7 text-sm"
          />
        </td>
      )}

      {/* ISBN */}
      {showIsbn && (
        <td className="py-0.5 px-1 w-20">
          <Input
            value={item.isbn}
            onChange={(e) => onUpdate('isbn', e.target.value)}
            placeholder="ISBN"
            className="h-7 text-sm"
          />
        </td>
      )}

      {/* Unit Price — now BEFORE Quantity */}
      <td className="py-0.5 px-1 w-20">
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-muted)]">₹</span>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={item.unitPrice === 0 ? '' : item.unitPrice}
            onChange={(e) => {
              const val = e.target.value;
              onUpdate('unitPrice', val === '' ? 0 : parseFloat(val));
            }}
            className="h-7 text-sm pl-6"
          />
        </div>
      </td>

      {/* Quantity — now AFTER Unit Price */}
      <td className="py-0.5 px-1 w-14">
        <Input
          type="number"
          min="1"
          value={item.quantity === 0 ? '' : item.quantity}
          onChange={(e) => {
            const val = e.target.value;
            onUpdate('quantity', val === '' ? 0 : parseInt(val, 10));
          }}
          className="h-7 text-sm text-center"
          ref={lastInputRef}
          onKeyDown={handleKeyDown}
        />
      </td>

      {/* Actions */}
      <td className="py-1 px-1 w-8">
        <button
          type="button"
          onClick={onRemove}
          className="row-actions h-7 w-7 rounded flex items-center justify-center text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-all focus-visible:opacity-100 focus-visible:text-red-500 focus-visible:outline-2 focus-visible:outline-red-500"
          title="Remove row"
          tabIndex={0}
        >
          <Trash2 size={13} />
        </button>
      </td>
    </tr>
  );
}
