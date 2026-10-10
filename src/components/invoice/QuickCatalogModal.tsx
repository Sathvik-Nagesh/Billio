import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Plus, Check, BookOpen, X, Sparkles } from 'lucide-react';
import { bookRepository } from '@/lib/db/repositories/bookRepository';
import { formatINR } from '@/lib/utils/currency';
import type { Book } from '@/types';

interface QuickCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBook: (book: Book) => void;
  onAddMultiple: (books: Book[]) => void;
}

export function QuickCatalogModal({ isOpen, onClose, onAddBook, onAddMultiple }: QuickCatalogModalProps) {
  const [search, setSearch] = useState('');
  const [selectedBookIds, setSelectedBookIds] = useState<Set<string>>(new Set());
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const books = useMemo(() => {
    return bookRepository.getAll();
  }, [isOpen]);

  const filteredBooks = useMemo(() => {
    if (!search.trim()) return books;
    const query = search.toLowerCase();
    return books.filter(
      b => b.name.toLowerCase().includes(query) || (b.author && b.author.toLowerCase().includes(query))
    );
  }, [books, search]);

  useEffect(() => {
    if (isOpen) {
      setSelectedBookIds(new Set());
      setSearch('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSingleAdd = (book: Book) => {
    onAddBook(book);
    setRecentlyAddedId(book.id);
    setTimeout(() => {
      setRecentlyAddedId(null);
    }, 1200);
  };

  const toggleSelect = (id: string) => {
    setSelectedBookIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddSelected = () => {
    const selected = books.filter(b => selectedBookIds.has(b.id));
    if (selected.length > 0) {
      onAddMultiple(selected);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div 
        className="w-[calc(100vw-24px)] max-w-2xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl flex flex-col max-h-[88dvh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center font-bold shrink-0">
              <BookOpen size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)]">Quick Book Catalog</h3>
              <p className="text-[11px] sm:text-xs text-[var(--color-text-muted)]">Tap or select books to instantly add them to the bill</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={16} />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search title, author, or keywords..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Book List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-[var(--color-border-light)]">
          {filteredBooks.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--color-text-muted)]">
              {search ? 'No matching books found in catalog.' : 'Your book catalog is empty. Books you bill are automatically saved here!'}
            </div>
          ) : (
            filteredBooks.map(book => {
              const isSelected = selectedBookIds.has(book.id);
              const isJustAdded = recentlyAddedId === book.id;

              return (
                <div
                  key={book.id}
                  className={`flex items-center justify-between py-2.5 px-3 rounded-xl transition-colors ${
                    isSelected ? 'bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)]/40 border border-[var(--color-primary-200)] dark:border-[var(--color-primary-800)]' : 'hover:bg-[var(--color-surface-secondary)]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(book.id)}
                      className="w-4 h-4 rounded accent-[var(--color-primary)] cursor-pointer"
                    />
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{book.name}</div>
                      <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                        {book.author && <span className="truncate">by {book.author}</span>}
                        {book.usageCount > 1 && (
                          <span className="flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                            <Sparkles size={10} /> {book.usageCount} billed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-[var(--color-text-primary)] whitespace-nowrap">
                      {formatINR(book.unitPrice)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSingleAdd(book)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isJustAdded
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 active:scale-95 shadow-xs'
                      }`}
                    >
                      {isJustAdded ? (
                        <>
                          <Check size={13} />
                          Added
                        </>
                      ) : (
                        <>
                          <Plus size={13} />
                          Add
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-secondary)]/50 flex items-center justify-between">
          <div className="text-xs text-[var(--color-text-muted)]">
            {selectedBookIds.size > 0 ? `${selectedBookIds.size} book(s) selected` : `${filteredBooks.length} books in catalog`}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
            >
              Done
            </button>
            {selectedBookIds.size > 0 && (
              <button
                type="button"
                onClick={handleAddSelected}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 transition-all shadow-xs"
              >
                Add {selectedBookIds.size} Selected Book(s)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
