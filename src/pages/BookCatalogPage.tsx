import React, { useState, useEffect } from 'react';
import { Search, Plus, Download, Upload, Trash2, Edit2, BookOpen, AlertTriangle } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Label } from '@/components/ui';
import { bookRepository } from '@/lib/db/repositories/bookRepository';
import { formatINR } from '@/lib/utils/currency';
import type { Book } from '@/types';
import { toast } from 'sonner';

export function BookCatalogPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [query, setQuery] = useState('');
  
  // Edit modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editName, setEditName] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editPrice, setEditPrice] = useState('');

  const loadBooks = () => {
    setBooks(bookRepository.search(query));
  };

  useEffect(() => { loadBooks(); }, [query]);

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    setEditName(book.name);
    setEditAuthor(book.author || '');
    setEditPrice(book.unitPrice.toString());
    setIsEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingBook) return;
    if (!editName.trim()) { toast.error('Book name is required'); return; }
    
    bookRepository.update(editingBook.id, {
      name: editName.trim(),
      author: editAuthor.trim() || undefined,
      unitPrice: parseFloat(editPrice) || 0
    });
    
    toast.success('Book updated');
    setIsEditOpen(false);
    loadBooks();
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this book from the catalog?')) return;
    bookRepository.delete(id);
    toast.success('Book deleted');
    loadBooks();
  };

  const handleClearAll = () => {
    if (!confirm('WARNING: This will delete ALL books in your catalog. This cannot be undone. Proceed?')) return;
    const all = bookRepository.getAll();
    all.forEach(b => bookRepository.delete(b.id));
    toast.success('Catalog cleared');
    loadBooks();
  };

  const handleExportCSV = () => {
    const all = bookRepository.getAll();
    if (all.length === 0) { toast.error('Catalog is empty'); return; }
    
    const csvContent = 'data:text/csv;charset=utf-8,' + 
      'Name,Author,UnitPrice\n' + 
      all.map(b => `"${b.name.replace(/"/g, '""')}","${(b.author || '').replace(/"/g, '""')}",${b.unitPrice}`).join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Billio_BookCatalog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n');
      let count = 0;
      
      // Skip header (i=1)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Basic CSV parsing (handles quotes simply)
        const parts = line.split(',');
        let name = parts[0] || '';
        let author = parts[1] || '';
        let priceStr = parts[2] || '0';
        
        if (name.startsWith('"') && name.endsWith('"')) name = name.slice(1, -1);
        if (author.startsWith('"') && author.endsWith('"')) author = author.slice(1, -1);
        
        const price = parseFloat(priceStr) || 0;
        if (name) {
          bookRepository.upsert(name, price, author || undefined);
          count++;
        }
      }
      toast.success(`Imported ${count} books successfully`);
      loadBooks();
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="h-full flex flex-col p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <BookOpen className="text-[var(--color-primary)]" />
            Book Catalog
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Manage your reusable product catalog. Books are auto-saved here when you create invoices.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCSV}>
            <Download size={14} /> Export CSV
          </Button>
          <div className="relative">
            <input type="file" id="import-csv" accept=".csv" className="hidden" onChange={handleImportCSV} />
            <Button variant="outline" size="sm" className="gap-2" onClick={() => document.getElementById('import-csv')?.click()}>
              <Upload size={14} /> Import CSV
            </Button>
          </div>
          <Button variant="destructive" size="sm" className="gap-2" onClick={handleClearAll}>
            <AlertTriangle size={14} /> Clear All
          </Button>
        </div>
      </div>

      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="pb-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3 relative max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search books..."
              className="pl-9 h-9"
            />
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-0">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="sticky top-0 bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] shadow-[0_1px_0_var(--color-border)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Book Name</th>
                <th className="px-4 py-3 font-semibold">Author</th>
                <th className="px-4 py-3 font-semibold w-32">Unit Price</th>
                <th className="px-4 py-3 font-semibold w-24 text-center">Times Used</th>
                <th className="px-4 py-3 font-semibold w-32 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-[var(--color-text-muted)]">
                    {query ? 'No books match your search.' : 'Your catalog is empty. Books are automatically added when you create an invoice.'}
                  </td>
                </tr>
              ) : (
                books.map(book => (
                  <tr key={book.id} className="border-b border-[var(--color-border-light)] hover:bg-[var(--color-surface-tertiary)] group">
                    <td className="px-4 py-3 font-medium text-[var(--color-text-primary)] truncate max-w-[200px]">
                      {book.name}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)] truncate max-w-[150px]">
                      {book.author || '-'}
                    </td>
                    <td className="px-4 py-3 font-mono text-[var(--color-text-secondary)]">
                      {formatINR(book.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-center text-[var(--color-text-muted)]">
                      {book.usageCount}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(book)} className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-50)] rounded transition-colors" title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(book.id)} className="p-1.5 text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Book</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="book-name">Book Name</Label>
              <Input
                id="book-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="book-author">Author / Translator</Label>
              <Input
                id="book-author"
                value={editAuthor}
                onChange={(e) => setEditAuthor(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="book-price">Unit Price (₹)</Label>
              <Input
                id="book-price"
                type="number"
                min="0"
                step="0.01"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
