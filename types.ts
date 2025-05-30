
export interface CompanyDetails {
  name: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string; // Will store base64 data URL
}

export interface ClientDetails {
  name: string;
  address: string;
  email: string;
  // phone?: string; // Optional: if you want to store client phone separately
}

// For client auto-suggestion and management
export interface Client extends ClientDetails {
  id: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number; // Prices in LKR
  discountPercentage?: number; // Item-specific discount percentage (e.g., 10 for 10%)
}

export interface InventoryItem {
  id: string;
  name: string;
  unitPrice: number; // Prices in LKR
}

export interface InvoiceData {
  companyDetails: CompanyDetails;
  clientDetails: ClientDetails;
  invoiceNumber: string; // Or Quotation Number
  invoiceDate: string;
  dueDate: string; // Or Valid Until
  items: InvoiceItem[];
  notes: string; // General notes, separate from terms
  taxRate: number; // Percentage, e.g., 8 for 8%. Sample has 0.
  documentType: 'invoice' | 'quotation';
  documentSubtitle?: string; // New: e.g., "10Kw Solar System Maintenance"
  termsAndConditions?: string; // New: For the second page of the PDF
}

export interface TextInputProps {
  label: string;
  id: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  isTextArea?: boolean;
  rows?: number;
  list?: string; // For datalist suggestions
}

export interface SectionTitleProps {
  title: string;
}
