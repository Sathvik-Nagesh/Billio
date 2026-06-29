import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus } from 'lucide-react';
import { bookRepository } from '@/lib/db/repositories/bookRepository';
import type { Book } from '@/types';
import { formatINR } from '@/lib/utils/currency';

interface BookAutocompleteProps {
  id?: string;
  value: string;
  onChange: (val: string) => void;
  onSelectBook?: (book: Book) => void;
  placeholder?: string;
  className?: string;
}

export function BookAutocomplete({
  id,
  value,
  onChange,
  onSelectBook,
  placeholder = "Book / Product Name",
  className = ""
}: BookAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Book[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const results = bookRepository.search(value);
      setSuggestions(results);
      setActiveIndex(-1);
    }
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

  const handleSelect = (book: Book) => {
    onChange(book.name);
    if (onSelectBook) onSelectBook(book);
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
      />
      
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md shadow-lg max-h-60 overflow-y-auto">
            <ul>
              {suggestions.map((book, index) => (
                <li
                  key={book.id}
                  onClick={() => handleSelect(book)}
                  className={`px-3 py-2 cursor-pointer text-sm flex items-center justify-between ${
                    index === activeIndex
                      ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-700)] dark:bg-[var(--color-primary-900)] dark:text-[var(--color-primary-100)]'
                      : 'hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)]'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="truncate font-medium">{book.name}</div>
                    {book.author && (
                      <div className="text-xs text-[var(--color-text-muted)] truncate">{book.author}</div>
                    )}
                  </div>
                  <span className="text-xs font-mono text-[var(--color-text-muted)] shrink-0">
                    {formatINR(book.unitPrice)}
                  </span>
                </li>
              ))}
            </ul>
        </div>
      )}
    </div>
  );
}
