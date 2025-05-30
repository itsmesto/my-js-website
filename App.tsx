
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { InvoiceData, InvoiceItem, CompanyDetails, ClientDetails, InventoryItem, Client } from './types';
import { createInitialInvoiceData, generateNewDocumentNumber } from './constants';
import InvoiceForm from './components/InvoiceForm';
import PdfGeneratorButton from './components/PdfGeneratorButton';
import { loadInventory, saveInventory, loadSavedDocuments, saveSavedDocuments, loadClients, saveClients } from './localStorageService';

const App: React.FC = () => {
  const [savedDocuments, setSavedDocuments] = useState<InvoiceData[]>([]);
  const [currentDocumentIndex, setCurrentDocumentIndex] = useState<number>(-1); // -1 means new/unsaved
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(createInitialInvoiceData([], 'quotation')); // Start with quotation
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]); // State for client list
  const [isFormValid, setIsFormValid] = useState<boolean>(true);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadedInv = loadInventory();
    setInventory(loadedInv);
    const loadedDocs = loadSavedDocuments();
    setSavedDocuments(loadedDocs);
    const loadedClnts = loadClients();
    setClients(loadedClnts);

    if (loadedDocs.length > 0) {
      setCurrentDocumentIndex(loadedDocs.length - 1); 
      setInvoiceData(loadedDocs[loadedDocs.length - 1]);
    } else {
      setInvoiceData(createInitialInvoiceData([], 'quotation'));
    }
  }, []);

  useEffect(() => { saveInventory(inventory); }, [inventory]);
  useEffect(() => { saveSavedDocuments(savedDocuments); }, [savedDocuments]);
  useEffect(() => { saveClients(clients); }, [clients]);
  
  const showFeedback = (message: string) => {
    setFeedbackMessage(message);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleInvoiceDataChange = useCallback(<K extends keyof InvoiceData>(field: K, value: InvoiceData[K]) => {
    setInvoiceData(prev => {
      const newState = { ...prev, [field]: value };
      if (field === 'documentType') {
        if (currentDocumentIndex === -1 || (savedDocuments[currentDocumentIndex] && savedDocuments[currentDocumentIndex]?.invoiceNumber !== prev.invoiceNumber)) {
           newState.invoiceNumber = generateNewDocumentNumber(savedDocuments, value as 'invoice' | 'quotation');
        }
         // Update due date/valid until based on type
        const newDate = new Date();
        if (value === 'quotation') newDate.setDate(newDate.getDate() + 15);
        else newDate.setDate(newDate.getDate() + 30);
        newState.dueDate = newDate.toISOString().split('T')[0];
        newState.documentSubtitle = value === 'quotation' ? 'System Maintenance Quotation' : 'Service Invoice';
      }
      return newState;
    });
  }, [currentDocumentIndex, savedDocuments]);

  const handleCompanyDetailsChange = useCallback(<K extends keyof CompanyDetails>(field: K, value: CompanyDetails[K]) => {
    setInvoiceData(prev => ({ ...prev, companyDetails: { ...prev.companyDetails, [field]: value } }));
  }, []);
  
  const handleClientDetailsChange = useCallback(<K extends keyof ClientDetails>(field: K, value: ClientDetails[K]) => {
    setInvoiceData(prev => ({ ...prev, clientDetails: { ...prev.clientDetails, [field]: value } }));
  }, []);

  const handleClientSelect = useCallback((client: Client) => {
    setInvoiceData(prev => ({
      ...prev,
      clientDetails: {
        name: client.name,
        address: client.address,
        email: client.email,
      }
    }));
  }, []);

  const handleItemChange = useCallback((index: number, field: keyof InvoiceItem, value: string | number) => {
    setInvoiceData(prev => {
      const newItems = prev.items.map((currentItem, itemIndex) => {
        if (itemIndex === index) {
          return { ...currentItem, [field]: value };
        }
        return currentItem;
      });
      return { ...prev, items: newItems };
    });
  }, []);

  const handleAddItem = useCallback(() => {
    setInvoiceData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, discountPercentage: 0 },
      ],
    }));
  }, []);

  const handleDeleteItem = useCallback((id: string) => {
    setInvoiceData(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }));
  }, []);

  const handleSaveItemToInventory = useCallback((item: InvoiceItem) => {
    if (!item.description || item.unitPrice <= 0) {
      showFeedback("Item description and price are needed to save to inventory.");
      return;
    }
    setInventory(prevInventory => {
      const itemDescriptionLower = item.description.toLowerCase();
      const existingItemIndex = prevInventory.findIndex(invItem => invItem.name.toLowerCase() === itemDescriptionLower);

      if (existingItemIndex > -1) {
        const existingInventoryItem = prevInventory[existingItemIndex];
        if (existingInventoryItem.unitPrice !== item.unitPrice) {
          const updatedInventory = prevInventory.map((invItem, index) =>
            index === existingItemIndex
              ? { ...invItem, unitPrice: item.unitPrice }
              : invItem
          );
          showFeedback(`Inventory item '${item.description}' price updated.`);
          return updatedInventory;
        } else {
          showFeedback(`Item '${item.description}' already in inventory with the same price.`);
          return prevInventory; 
        }
      } else {
        showFeedback(`Item '${item.description}' saved to inventory.`);
        return [
          ...prevInventory,
          { id: crypto.randomUUID(), name: item.description, unitPrice: item.unitPrice }
        ];
      }
    });
  }, []);

  const handleLogoUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      handleCompanyDetailsChange('logoUrl', reader.result as string);
      showFeedback("Logo uploaded successfully.");
    };
    reader.readAsDataURL(file);
  }, [handleCompanyDetailsChange]);

  const handleSaveDocument = useCallback(() => {
    if (!isFormValid) {
      showFeedback("Please fill all required fields before saving.");
      return;
    }
    
    const currentClientName = invoiceData.clientDetails.name.trim();
    if (currentClientName) {
        setClients(prevClients => {
            const existingClient = prevClients.find(c => c.name.toLowerCase() === currentClientName.toLowerCase());
            if (!existingClient) {
                const newClient: Client = {
                    id: crypto.randomUUID(),
                    name: invoiceData.clientDetails.name,
                    address: invoiceData.clientDetails.address,
                    email: invoiceData.clientDetails.email,
                };
                showFeedback(`Client '${newClient.name}' added to client list.`);
                return [...prevClients, newClient];
            }
            return prevClients;
        });
    }

    setSavedDocuments(prevSaved => {
      const newSavedDocs = [...prevSaved];
      if (currentDocumentIndex > -1 && currentDocumentIndex < newSavedDocs.length) { 
        newSavedDocs[currentDocumentIndex] = invoiceData;
        showFeedback(`${invoiceData.documentType} updated.`);
        return newSavedDocs;
      } else { 
        const newIndex = newSavedDocs.length;
        setCurrentDocumentIndex(newIndex);
        showFeedback(`${invoiceData.documentType} saved.`);
        return [...newSavedDocs, invoiceData];
      }
    });
  }, [invoiceData, currentDocumentIndex, isFormValid]);

  const handleNewDocument = useCallback((type: 'invoice' | 'quotation' = 'quotation') => {
    setInvoiceData(createInitialInvoiceData(savedDocuments, type));
    setCurrentDocumentIndex(-1); 
    showFeedback(`New ${type} created.`);
  }, [savedDocuments]);

  const handleNavigate = useCallback((direction: 'prev' | 'next') => {
    if (savedDocuments.length === 0) {
        showFeedback("No saved documents to navigate.");
        return;
    }
    let newIndex = currentDocumentIndex;
    if (direction === 'prev') {
      newIndex = currentDocumentIndex <= 0 ? savedDocuments.length - 1 : currentDocumentIndex - 1;
    } else {
      newIndex = currentDocumentIndex >= savedDocuments.length - 1 || currentDocumentIndex === -1 ? 0 : currentDocumentIndex + 1;
    }
    setCurrentDocumentIndex(newIndex);
    setInvoiceData(savedDocuments[newIndex]);
     showFeedback(`Loaded ${savedDocuments[newIndex].documentType} ${savedDocuments[newIndex].invoiceNumber}.`);
  }, [currentDocumentIndex, savedDocuments]);

  const { totalPreDiscount, totalReductions, netAmount, taxAmount, grandTotal } = useMemo(() => {
    let currentTotalPreDiscount = 0;
    let currentTotalReductions = 0;

    invoiceData.items.forEach(item => {
      const itemGross = item.quantity * item.unitPrice;
      currentTotalPreDiscount += itemGross;
      currentTotalReductions += itemGross * ((item.discountPercentage || 0) / 100);
    });

    const currentNetAmount = currentTotalPreDiscount - currentTotalReductions;
    const currentTaxAmount = currentNetAmount * (invoiceData.taxRate / 100);
    const currentGrandTotal = currentNetAmount + currentTaxAmount;

    return {
      totalPreDiscount: currentTotalPreDiscount,
      totalReductions: currentTotalReductions,
      netAmount: currentNetAmount,
      taxAmount: currentTaxAmount,
      grandTotal: currentGrandTotal,
    };
  }, [invoiceData.items, invoiceData.taxRate]);


  useEffect(() => {
    const { companyDetails, clientDetails, invoiceNumber, invoiceDate, dueDate, items } = invoiceData;
    const companyValid = !!(companyDetails.name && companyDetails.address);
    const clientValid = !!(clientDetails.name && clientDetails.address && clientDetails.email);
    const itemsValid = items.length > 0 && items.every(item => item.description && item.quantity > 0 && item.unitPrice >= 0);
    const metaValid = !!(invoiceNumber && invoiceDate && dueDate);
    setIsFormValid(companyValid && clientValid && itemsValid && metaValid);
  }, [invoiceData]);

  return (
    <div className="min-h-screen bg-slate-100 py-6">
       {feedbackMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-sky-600 text-white px-6 py-3 rounded-lg shadow-lg transition-opacity duration-300">
          {feedbackMessage}
        </div>
      )}

      <div className="max-w-4xl mx-auto mb-4 p-4 bg-white shadow-md rounded-lg flex flex-wrap justify-center gap-2 md:gap-4">
        <button onClick={() => handleNewDocument('quotation')} className="px-4 py-2 text-sm bg-indigo-500 text-white rounded-md hover:bg-indigo-600">New Quotation</button>
        <button onClick={() => handleNewDocument('invoice')} className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600">New Invoice</button>
        <button onClick={handleSaveDocument} className="px-4 py-2 text-sm bg-green-500 text-white rounded-md hover:bg-green-600">Save Current</button>
        <button onClick={() => handleNavigate('prev')} disabled={savedDocuments.length === 0} className="px-4 py-2 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-300">Previous</button>
        <button onClick={() => handleNavigate('next')} disabled={savedDocuments.length === 0} className="px-4 py-2 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-300">Next</button>
         <div className="text-xs text-slate-500 self-center">
            {currentDocumentIndex !== -1 && savedDocuments.length > 0 
             ? `Viewing ${currentDocumentIndex + 1} of ${savedDocuments.length}` 
             : (savedDocuments.length > 0 ? `Viewing New (Total Saved: ${savedDocuments.length})` : 'Viewing New (No saved documents)')}
        </div>
      </div>

      <InvoiceForm
        invoiceData={invoiceData}
        onInvoiceDataChange={handleInvoiceDataChange}
        onCompanyDetailsChange={handleCompanyDetailsChange}
        onClientDetailsChange={handleClientDetailsChange}
        onItemChange={handleItemChange}
        onAddItem={handleAddItem}
        onDeleteItem={handleDeleteItem}
        onSaveItemToInventory={handleSaveItemToInventory}
        onLogoUpload={handleLogoUpload}
        clients={clients}
        onClientSelect={handleClientSelect}
        totalPreDiscount={totalPreDiscount}
        totalReductions={totalReductions}
        netAmount={netAmount}
        taxAmount={taxAmount}
        grandTotal={grandTotal}
      />
      <PdfGeneratorButton invoiceData={invoiceData} disabled={!isFormValid} />
      {!isFormValid && (
         <div 
            className="fixed bottom-24 right-8 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 text-xs rounded-md shadow-lg z-50"
            role="alert"
          >
            Please fill all required fields (*) and ensure items are valid to generate PDF.
        </div>
      )}
    </div>
  );
};

export default App;
