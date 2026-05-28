import React, { useRef } from 'react';
import { Trash2, GripVertical } from 'lucide-react';
import { Input } from '@/components/ui';
import { formatNumber } from '@/lib/utils/currency';
import type { InvoiceItemForm } from '@/types';

interface Props {
  item: InvoiceItemForm;
  onUpdate: <K extends keyof InvoiceItemForm>(key: K, value: InvoiceItemForm[K]) => void;
  onRemove: () => void;
  showIsbn?: boolean;
  isLast?: boolean;
  onEnterAtEnd?: () => void;
}

export function LineItemRow({ item, onUpdate, onRemove, showIsbn = true, isLast, onEnterAtEnd }: Props) {
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
      <td className="py-2 px-2 text-center text-sm text-[var(--color-text-muted)] w-10">
        {item.srNo}
      </td>

      {/* Product Name */}
      <td className="py-1 px-1">
        <Input
          value={item.productName}
          onChange={(e) => onUpdate('productName', e.target.value)}
          placeholder="Book / Product name"
          className="h-8 text-sm"
        />
      </td>

      {/* ISBN */}
      {showIsbn && (
        <td className="py-1 px-1 w-28">
          <Input
            value={item.isbn}
            onChange={(e) => onUpdate('isbn', e.target.value)}
            placeholder="ISBN"
            className="h-8 text-sm"
          />
        </td>
      )}

      {/* Quantity */}
      <td className="py-1 px-1 w-20">
        <Input
          type="number"
          min="1"
          value={item.quantity === 0 ? '' : item.quantity}
          onChange={(e) => {
            const val = e.target.value;
            onUpdate('quantity', val === '' ? 0 : parseInt(val, 10));
          }}
          className="h-8 text-sm text-center"
        />
      </td>

      {/* Unit Price */}
      <td className="py-1 px-1 w-28">
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
            className="h-8 text-sm pl-6"
            ref={lastInputRef}
            onKeyDown={handleKeyDown}
          />
        </div>
      </td>

      {/* Line Total */}
      <td className="py-2 px-2 w-28 text-right">
        <span className="text-sm font-medium text-[var(--color-text-primary)]">
          ₹{formatNumber(item.lineTotal)}
        </span>
      </td>

      {/* Actions */}
      <td className="py-2 px-1 w-10">
        <button
          type="button"
          onClick={onRemove}
          className="row-actions h-7 w-7 rounded flex items-center justify-center text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-all"
          title="Remove row"
        >
          <Trash2 size={13} />
        </button>
      </td>
    </tr>
  );
}
