CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_path TEXT,
  address TEXT,
  gstin TEXT,
  phone TEXT,
  email TEXT,
  bank_name TEXT,
  bank_account TEXT,
  bank_ifsc TEXT,
  bank_branch TEXT,
  upi_qr_path TEXT,
  terms TEXT,
  signature_path TEXT,
  seal_path TEXT,
  invoice_prefix TEXT DEFAULT '',
  invoice_year_format TEXT DEFAULT 'FY',
  invoice_separator TEXT DEFAULT '-',
  invoice_padding INTEGER DEFAULT 3,
  invoice_start_number INTEGER DEFAULT 1,
  accent_color TEXT DEFAULT '#6366F1',
  template_id TEXT DEFAULT 'minimal-modern',
  is_default INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  gstin TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  invoice_number TEXT NOT NULL,
  invoice_date TEXT NOT NULL,
  due_date TEXT,
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  customer_address TEXT,
  customer_gstin TEXT,
  customer_notes TEXT,
  subtotal REAL DEFAULT 0,
  discount_type TEXT DEFAULT 'percentage',
  discount_value REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  round_off REAL DEFAULT 0,
  grand_total REAL DEFAULT 0,
  amount_in_words TEXT,
  template_id TEXT,
  theme_overrides TEXT,
  invoice_language TEXT DEFAULT 'en',
  pdf_path TEXT,
  status TEXT DEFAULT 'draft',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  sr_no INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  isbn TEXT,
  quantity INTEGER DEFAULT 1,
  unit_price REAL DEFAULT 0,
  line_total REAL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS invoice_sequences (
  business_id TEXT NOT NULL,
  year_key TEXT NOT NULL,
  last_number INTEGER DEFAULT 0,
  PRIMARY KEY (business_id, year_key)
);

CREATE INDEX IF NOT EXISTS idx_invoices_business_id ON invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_name ON invoices(customer_name);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
