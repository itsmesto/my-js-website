
import { InvoiceData, Client } from './types'; // Assuming Client might be used here later, if not remove

const today = new Date();
const validUntilDate = new Date();
validUntilDate.setDate(today.getDate() + 15); // Default valid for 15 days for quotations

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const generateNewDocumentNumber = (existingDocuments: InvoiceData[] = [], type: 'invoice' | 'quotation'): string => {
  const prefix = type === 'invoice' ? 'INV' : 'QTN';
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0'); // KP/2025/03/54 format implies year/month
  
  let maxNum = 0;
  const currentYearMonthPrefix = `${prefix}/${year}/${month}/`; // Example: QTN/2024/07/

  existingDocuments.forEach(doc => {
    if (doc.invoiceNumber.startsWith(currentYearMonthPrefix)) {
      const numPart = parseInt(doc.invoiceNumber.split('/').pop() || '0');
      if (numPart > maxNum) {
        maxNum = numPart;
      }
    }
  });
  // For a format like KP/2025/03/54, the prefix needs to be more dynamic or user-configurable.
  // Using a simpler sequential number for now. The sample has "KP" prefix - this might be user-defined.
  // For this iteration, keeping simple prefix, year, sequential.
  // If KP/2025/03/54 is rigid, the prefix logic needs external input.
  // Simplified:
  return `${prefix}-${year}${month}-${String(maxNum + 1).padStart(3, '0')}`;
};


export const INITIAL_COMPANY_DETAILS = {
  name: 'Your Company (PVT) LTD',
  address: '123, Main Street, Colombo 07, Sri Lanka',
  phone: '+94 11 222 3333',
  email: 'info@yourcompany.lk',
  logoUrl: '', 
};

export const createInitialInvoiceData = (existingDocuments?: InvoiceData[], docType: 'invoice' | 'quotation' = 'invoice'): InvoiceData => ({
  companyDetails: { ...INITIAL_COMPANY_DETAILS },
  clientDetails: {
    name: '',
    address: '',
    email: '',
  },
  invoiceNumber: generateNewDocumentNumber(existingDocuments, docType),
  invoiceDate: formatDate(today),
  dueDate: formatDate(docType === 'quotation' ? validUntilDate : new Date(today.setDate(today.getDate() + 30))), // Due date or Valid until
  items: [
    { id: crypto.randomUUID(), description: 'Sample Product A (LKR)', quantity: 2, unitPrice: 1500.00, discountPercentage: 0 },
    { id: crypto.randomUUID(), description: 'Sample Service B (LKR)', quantity: 1, unitPrice: 7500.00, discountPercentage: 10 },
  ],
  notes: 'Thank you for your business! All amounts in Sri Lankan Rupees (LKR).',
  taxRate: 0, // Default to 0% tax as per sample
  documentType: docType,
  documentSubtitle: docType === 'quotation' ? 'System Maintenance Quotation' : 'Service Invoice',
  termsAndConditions: "1. Payment to be made within 30 days.\n2. Goods once sold will not be taken back.\n3. Interest at 2% per month will be charged on overdue accounts.",
});
