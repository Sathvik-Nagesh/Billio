import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useInvoiceStore } from '@/stores/useInvoiceStore';
import { bookRepository } from '@/lib/db/repositories/bookRepository';

interface AuthorAutocompleteProps {
  id?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export function AuthorAutocomplete({
  id,
  value,
  onChange,
  placeholder = "Author / Translator",
  className = ""
}: AuthorAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { form } = useInvoiceStore();

  // Merge authors from: (1) full book catalog, (2) current invoice items
  // This ensures the dropdown is populated even on a brand-new invoice
  const allAuthors = useMemo(() => {
    const unique = new Map<string, string>();

    // Source 1: Book catalog (all authors ever saved across all invoices)
    bookRepository.getAll().forEach(book => {
      if (book.author && book.author.trim()) {
        const lower = book.author.trim().toLowerCase();
        if (!unique.has(lower)) unique.set(lower, book.author.trim());
      }
    });

    // Source 2: Current invoice items (in-progress entries)
    form.items.forEach(item => {
      if (item.author && item.author.trim()) {
        const lower = item.author.trim().toLowerCase();
        if (!unique.has(lower)) unique.set(lower, item.author.trim());
      }
    });

    return Array.from(unique.values()).sort((a, b) => a.localeCompare(b));
  }, [form.items]);

  const suggestions = useMemo(() => {
    if (!value || !value.trim()) return allAuthors;
    const lowerVal = value.trim().toLowerCase();
    return allAuthors.filter(a => a.toLowerCase().includes(lowerVal));
  }, [value, allAuthors]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [value, isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelect(suggestions[activeIndex]);
      } else {
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (author: string) => {
    onChange(author);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] focus:border-transparent transition-all placeholder:text-[var(--color-text-muted)] ${className}`}
        autoComplete="off"
      />
      
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md shadow-lg max-h-60 overflow-y-auto">
            <ul>
              {suggestions.map((author, index) => (
                <li
                  key={author}
                  onClick={() => handleSelect(author)}
                  className={`px-3 py-2 cursor-pointer text-sm flex items-center justify-between ${
                    index === activeIndex
                      ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-700)] dark:bg-[var(--color-primary-900)] dark:text-[var(--color-primary-100)]'
                      : 'hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)]'
                  }`}
                >
                  <span className="truncate">{author}</span>
                </li>
              ))}
            </ul>
        </div>
      )}
    </div>
  );
}
