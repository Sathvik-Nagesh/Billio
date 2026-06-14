export const kannadaLabels = {
  // Invoice header
  invoice: 'ಇನ್ವಾಯ್ಸ್',
  bill: 'ಬಿಲ್',
  taxInvoice: 'ತೆರಿಗೆ ಇನ್ವಾಯ್ಸ್',
  invoiceNumber: 'ಇನ್ವಾಯ್ಸ್ ಸಂಖ್ಯೆ',
  invoiceDate: 'ಇನ್ವಾಯ್ಸ್ ದಿನಾಂಕ',
  dueDate: 'ಪಾವತಿ ದಿನಾಂಕ',

  // Bill to
  billTo: 'ಬಿಲ್ ಮಾಡಲಾಗಿದೆ',
  gstin: 'ಜಿಎಸ್ಟಿಐಎನ್',
  phone: 'ಫೋನ್',
  email: 'ಇಮೇಲ್',

  // Table headers
  srNo: 'ಕ್ರ.ಸಂ',
  description: 'ವಿವರಣೆ',
  isbn: 'ಐಎಸ್ಬಿಎನ್',
  quantity: 'ಪ್ರಮಾಣ',
  unitPrice: 'ಒಂದು ಬೆಲೆ',
  amount: 'ಮೊತ್ತ',

  // Totals
  subtotal: 'ಉಪಮೊತ್ತ',
  discount: 'ರಿಯಾಯಿತಿ',
  roundOff: 'ರೌಂಡ್ ಆಫ್',
  grandTotal: 'ಒಟ್ಟು ಮೊತ್ತ',
  amountInWords: 'ಮೊತ್ತ ಅಕ್ಷರಗಳಲ್ಲಿ',

  // New
  author: 'ಲೇಖಕರು / ಅನುವಾದಕರು',
  isbnLabel: 'ಐಎಸ್ಬಿಎನ್',
  selectionNo: 'ಆಯ್ಕೆ ಸಂಖ್ಯೆ',

  // Bank details
  bankDetails: 'ಬ್ಯಾಂಕ್ ವಿವರಗಳು',
  bankName: 'ಬ್ಯಾಂಕ್ ಹೆಸರು',
  accountNumber: 'ಖಾತೆ ಸಂಖ್ಯೆ',
  ifscCode: 'ಐಎಫ್ಎಸ್ಸಿ ಕೋಡ್',
  branch: 'ಶಾಖೆ',

  // Footer
  termsAndConditions: 'ನಿಯಮಗಳು ಮತ್ತು ಷರತ್ತುಗಳು',
  authorizedSignatory: 'ಅಧಿಕೃತ ಸಹಿ',
  forCompany: 'ಕಂಪನಿಗಾಗಿ',

  // Status
  original: 'ಮೂಲ',
  duplicate: 'ಪ್ರತಿ',
};

export const englishLabels = {
  invoice: 'INVOICE',
  bill: 'BILL',
  taxInvoice: 'TAX INVOICE',
  invoiceNumber: 'Invoice No.',
  invoiceDate: 'Invoice Date',
  dueDate: 'Due Date',
  billTo: 'Bill To',
  gstin: 'GSTIN',
  phone: 'Phone',
  email: 'Email',
  srNo: 'Sr. No.',
  description: 'Description / Book Title',
  author: 'Author / Translator',
  isbnLabel: 'ISBN',
  selectionNo: 'Selection No.',
  isbn: 'ISBN',
  quantity: 'Qty',
  unitPrice: 'Unit Price',
  amount: 'Amount',
  subtotal: 'Subtotal',
  discount: 'Discount',
  roundOff: 'Round Off',
  grandTotal: 'Grand Total',
  amountInWords: 'Amount in Words',
  bankDetails: 'Bank Details',
  bankName: 'Bank Name',
  accountNumber: 'Account No.',
  ifscCode: 'IFSC Code',
  branch: 'Branch',
  termsAndConditions: 'Terms & Conditions',
  authorizedSignatory: 'Authorized Signatory',
  forCompany: 'For',
  original: 'ORIGINAL',
  duplicate: 'DUPLICATE',
};

export function getLabels(language: 'en' | 'kn') {
  return language === 'kn' ? kannadaLabels : englishLabels;
}
