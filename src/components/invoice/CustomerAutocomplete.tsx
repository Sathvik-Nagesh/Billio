import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui';
import { customerRepository } from '@/lib/db/repositories/customerRepository';
import type { Customer } from '@/types';
import { User } from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect: (customer: Customer) => void;
  placeholder?: string;
  id?: string;
}

export function CustomerAutocomplete({ value, onChange, onSelect, placeholder, id }: Props) {
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (val: string) => {
    onChange(val);
    if (val.length >= 1) {
      const results = customerRepository.search(val);
      setSuggestions(results);
      setOpen(results.length > 0);
    } else {
      setSuggestions([]);
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
        placeholder={placeholder ?? 'Customer name'}
        autoComplete="off"
      />
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-[var(--shadow-lg)] overflow-hidden animate-fade-in-up">
          {suggestions.map((c) => (
            <button
              key={c.id}
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[var(--color-surface-tertiary)] transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(c);
                setOpen(false);
              }}
            >
              <div className="w-7 h-7 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center flex-shrink-0">
                <User size={13} className="text-[var(--color-primary-600)]" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-[var(--color-text-primary)] truncate">{c.name}</div>
                {c.phone && <div className="text-xs text-[var(--color-text-muted)]">{c.phone}</div>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
