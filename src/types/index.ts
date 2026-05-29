export interface Business {
  id: string;
  name: string;
  logoPath?: string;
  address?: string;
  gstin?: string;
  phone?: string;
  email?: string;
  bankName?: string;
  bankAccount?: string;
  bankIfsc?: string;
  bankBranch?: string;
  upiQrPath?: string;
  terms?: string;
  signaturePath?: string;
  sealPath?: string;
  invoicePrefix?: string;
  invoiceYearFormat: 'YYYY' | 'FY' | 'YY' | 'none';
  invoiceSeparator: string;
  invoicePadding: number;
  invoiceStartNumber: number;
  accentColor: string;
  templateId: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  gstin?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Book {
  id: string;
  name: string;
  unitPrice: number;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}
export interface InvoiceItem {
  id: string;
  invoiceId: string;
  srNo: number;
  slNo?: string;
  productName: string;
  isbn?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  sortOrder: number;
}

export interface Invoice {
  id: string;
  businessId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerGstin?: string;
  customerNotes?: string;
  subtotal: number;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  discountAmount: number;
  roundOff: number;
  grandTotal: number;
  amountInWords?: string;
  templateId?: string;
  themeOverrides?: ThemeOverrides;
  invoiceLanguage: 'en' | 'kn';
  pdfPath?: string;
  status: 'draft' | 'final';
  createdAt: string;
  updatedAt: string;
  // Joined fields
  items?: InvoiceItem[];
  business?: Business;
}

export interface ThemeOverrides {
  accentColor?: string;
  fontFamily?: string;
  fontWeight?: 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  fontSize?: '80' | '90' | '100' | '110' | '120' | '130';
  printFriendly?: boolean;
  highContrast?: boolean;
  headerLayout?: 'centered' | 'left' | 'split';
  footerStyle?: 'full' | 'minimal' | 'none';
  logoSize?: 'small' | 'medium' | 'large';
  showWatermark?: boolean;
  watermarkText?: string;
  borderStyle?: 'lines' | 'boxed' | 'minimal' | 'none';
  lineSpacing?: 'compact' | 'normal' | 'relaxed';
}

export interface InvoiceFormState {
  businessId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  customerGstin: string;
  customerNotes: string;
  items: InvoiceItemForm[];
  discountType: 'percentage' | 'flat';
  discountValue: number;
  invoiceLanguage: 'en' | 'kn';
  templateId: string;
  themeOverrides: ThemeOverrides;
  status: 'draft' | 'final';
  showIsbn: boolean;
  showSlNo: boolean;
}

export interface InvoiceItemForm {
  id: string;
  srNo: number;
  slNo: string;
  productName: string;
  isbn: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface InvoiceCalculations {
  subtotal: number;
  discountAmount: number;
  roundOff: number;
  grandTotal: number;
  amountInWords: string;
}

export type AppPage =
  | 'home'
  | 'new-invoice'
  | 'edit-invoice'
  | 'invoice-history'
  | 'business-profiles'
  | 'business-form'
  | 'settings';

export interface AppSettings {
  theme: 'light' | 'dark';
  defaultTemplateId: string;
  dateFormat: string;
  printFriendly: boolean;
  highContrast: boolean;
  defaultLanguage: 'en' | 'kn';
  defaultBusinessId?: string;
}
