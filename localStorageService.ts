
import { InvoiceData, InventoryItem, Client } from './types';

const INVENTORY_KEY = 'invoiceAppInventory_v2'; // Consider versioning if structure changes
const SAVED_DOCUMENTS_KEY = 'invoiceAppSavedDocuments_v2';
const CLIENTS_KEY = 'invoiceAppClients_v2';

export const loadInventory = (): InventoryItem[] => {
  const storedInventory = localStorage.getItem(INVENTORY_KEY);
  return storedInventory ? JSON.parse(storedInventory) : [];
};

export const saveInventory = (inventory: InventoryItem[]): void => {
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
};

export const loadSavedDocuments = (): InvoiceData[] => {
  const storedInvoices = localStorage.getItem(SAVED_DOCUMENTS_KEY);
  return storedInvoices ? JSON.parse(storedInvoices) : [];
};

export const saveSavedDocuments = (invoices: InvoiceData[]): void => {
  localStorage.setItem(SAVED_DOCUMENTS_KEY, JSON.stringify(invoices));
};

export const loadClients = (): Client[] => {
  const storedClients = localStorage.getItem(CLIENTS_KEY);
  return storedClients ? JSON.parse(storedClients) : [];
};

export const saveClients = (clients: Client[]): void => {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
};
