import { useState, useEffect } from 'react';
import { BusinessData, Purchase, Sale, Product, Client, Debt, DebtPayment, AuditLog } from '../types/business';
import { saveToStorage, loadFromStorage, STORAGE_KEYS } from '../utils/storageUtils';
import { createAuditLog, saveAuditLog, getAuditLogs, compareObjects } from '../utils/auditUtils';
import { 
  updateProductsFromPurchases, 
  updateProductsFromSales, 
  updateClientsFromSales,
  checkDebtNotifications,
  formatNumber
} from '../utils/businessLogic';

export const useBusinessData = () => {
  const [businessData, setBusinessData] = useState<BusinessData>({
    businessName: "",
    userName: "",
    password: "",
    isSetup: false,
    currency: "FBU",
    currencySymbol: "F",
  });
  
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [debtPayments, setDebtPayments] = useState<DebtPayment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);

  // Load data from localStorage on startup
  useEffect(() => {
    const savedBusinessData = loadFromStorage(STORAGE_KEYS.BUSINESS_DATA, {
      businessName: "",
      userName: "",
      password: "",
      isSetup: false,
      currency: "USD",
      currencySymbol: "$",
    });
    setBusinessData(savedBusinessData);

    setPurchases(loadFromStorage(STORAGE_KEYS.PURCHASES, []));
    setSales(loadFromStorage(STORAGE_KEYS.SALES, []));
    setDebts(loadFromStorage(STORAGE_KEYS.DEBTS, []));
    setProducts(loadFromStorage(STORAGE_KEYS.PRODUCTS, []));
    setClients(loadFromStorage(STORAGE_KEYS.CLIENTS, []));
    setDebtPayments(loadFromStorage(STORAGE_KEYS.DEBT_PAYMENTS, []));
    setAuditLogs(loadFromStorage(STORAGE_KEYS.AUDIT_LOGS, []));
  }, []);

  // Update products when purchases change
  useEffect(() => {
    if (purchases.length > 0 || products.length > 0) {
      const updatedProducts = updateProductsFromPurchases(products, purchases);
      const finalProducts = updateProductsFromSales(updatedProducts, sales);
      setProducts(finalProducts);
      saveToStorage(STORAGE_KEYS.PRODUCTS, finalProducts);
    }
  }, [purchases]);

  // Update products and clients when sales change
  useEffect(() => {
    if (sales.length > 0) {
      // Update products
      const updatedProducts = updateProductsFromSales(products, sales);
      setProducts(updatedProducts);
      saveToStorage(STORAGE_KEYS.PRODUCTS, updatedProducts);

      // Update clients
      const updatedClients = updateClientsFromSales(clients, sales);
      setClients(updatedClients);
      saveToStorage(STORAGE_KEYS.CLIENTS, updatedClients);
    }
  }, [sales]);

  // Check for debt notifications
  useEffect(() => {
    const debtNotifications = checkDebtNotifications(debts, sales);
    setNotifications(debtNotifications);
  }, [debts, sales]);

  const updateBusinessData = (newData: Partial<BusinessData>) => {
    const updated = { ...businessData, ...newData };
    setBusinessData(updated);
    saveToStorage(STORAGE_KEYS.BUSINESS_DATA, updated);
  };

  const addPurchase = (purchase: Omit<Purchase, "id" | "date">) => {
    const newPurchase: Purchase = {
      ...purchase,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };
    const updatedPurchases = [...purchases, newPurchase];
    setPurchases(updatedPurchases);
    saveToStorage(STORAGE_KEYS.PURCHASES, updatedPurchases);

    // Create audit log
    const auditLog = createAuditLog(
      'CREATE',
      'PURCHASE',
      newPurchase.id,
      newPurchase.productName,
      businessData.userName,
      [
        { field: 'supplierName', oldValue: null, newValue: purchase.supplierName },
        { field: 'productName', oldValue: null, newValue: purchase.productName },
        { field: 'quantity', oldValue: null, newValue: purchase.quantity },
        { field: 'unitPrice', oldValue: null, newValue: purchase.unitPrice },
        { field: 'totalPrice', oldValue: null, newValue: purchase.totalPrice }
      ],
      `Achat créé: ${purchase.productName} (${purchase.quantity} unités) de ${purchase.supplierName}`,
      {
        productName: purchase.productName,
        amount: purchase.totalPrice
      }
    );
    saveAuditLog(auditLog);
    setAuditLogs(prev => [auditLog, ...prev]);
  };

  const addSale = (sale: Omit<Sale, "id" | "date">) => {
    // Check stock availability
    for (const item of sale.items) {
      const product = products.find((p) => p.name === item.productName);
      if (!product || product.currentStock < item.quantity) {
        throw new Error(
          `Insufficient stock for ${item.productName}. Available: ${product?.currentStock || 0}, Required: ${item.quantity}`,
        );
      }
    }

    const newSale: Sale = {
      ...sale,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };

    const updatedSales = [...sales, newSale];
    setSales(updatedSales);
    saveToStorage(STORAGE_KEYS.SALES, updatedSales);

    // Create audit log
    const auditLog = createAuditLog(
      'CREATE',
      'SALE',
      newSale.id,
      `Vente à ${sale.clientName}`,
      businessData.userName,
      [
        { field: 'clientName', oldValue: null, newValue: sale.clientName },
        { field: 'items', oldValue: null, newValue: sale.items },
        { field: 'totalAmount', oldValue: null, newValue: sale.totalAmount },
        { field: 'paymentStatus', oldValue: null, newValue: sale.paymentStatus }
      ],
      `Vente créée: ${sale.items.map(item => `${item.productName} (${item.quantity})`).join(', ')} pour ${sale.clientName}`,
      {
        clientName: sale.clientName,
        amount: sale.totalAmount
      }
    );
    saveAuditLog(auditLog);
    setAuditLogs(prev => [auditLog, ...prev]);

    // Update debts if needed
    if (sale.paymentStatus === "debt" || (sale.paymentStatus === "partial" && sale.remainingDebt && sale.remainingDebt > 0)) {
      updateDebts(newSale);
    }
  };

  const updateDebts = (sale: Sale) => {
    const debtAmount = sale.paymentStatus === "debt" ? sale.totalAmount : sale.remainingDebt || 0;
    const existingDebtIndex = debts.findIndex((debt) => debt.clientName === sale.clientName);

    let updatedDebts = [...debts];
    if (existingDebtIndex >= 0) {
      updatedDebts[existingDebtIndex] = {
        ...updatedDebts[existingDebtIndex],
        totalDebt: updatedDebts[existingDebtIndex].totalDebt + debtAmount,
        salesIds: [...updatedDebts[existingDebtIndex].salesIds, sale.id],
      };
    } else {
      updatedDebts.push({
        id: Date.now().toString(),
        clientName: sale.clientName,
        totalDebt: debtAmount,
        salesIds: [sale.id],
      });
    }

    setDebts(updatedDebts);
    saveToStorage(STORAGE_KEYS.DEBTS, updatedDebts);
  };

  const recordDebtPayment = (debtId: string, amountPaid: number, paymentMethod?: string) => {
    const debt = debts.find(d => d.id === debtId);
    if (!debt) return;

    const previousDebt = debt.totalDebt;
    const newDebt = Math.max(0, previousDebt - amountPaid);

    const payment: DebtPayment = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      clientName: debt.clientName,
      debtId,
      amountPaid,
      previousDebt,
      newDebt,
      paymentMethod,
    };

    const updatedPayments = [...debtPayments, payment];
    setDebtPayments(updatedPayments);
    saveToStorage(STORAGE_KEYS.DEBT_PAYMENTS, updatedPayments);

    // Create audit log for payment
    const auditLog = createAuditLog(
      'PAYMENT',
      'DEBT',
      debtId,
      debt.clientName,
      businessData.userName,
      [
        { field: 'totalDebt', oldValue: previousDebt, newValue: newDebt },
        { field: 'amountPaid', oldValue: 0, newValue: amountPaid }
      ],
      `Paiement de ${amountPaid} enregistré pour ${debt.clientName}. Dette réduite de ${previousDebt} à ${newDebt}`,
      {
        clientName: debt.clientName,
        amount: amountPaid,
        paymentMethod: paymentMethod || 'cash'
      }
    );
    saveAuditLog(auditLog);
    setAuditLogs(prev => [auditLog, ...prev]);

    // Update debt
    const updatedDebts = debts.map((d) =>
      d.id === debtId ? { ...d, totalDebt: newDebt } : d,
    );
    setDebts(updatedDebts);
    saveToStorage(STORAGE_KEYS.DEBTS, updatedDebts);

    // Update client debt
    const updatedClients = clients.map(client => 
      client.name === debt.clientName 
        ? { ...client, totalDebt: Math.max(0, client.totalDebt - amountPaid) }
        : client
    );
    setClients(updatedClients);
    saveToStorage(STORAGE_KEYS.CLIENTS, updatedClients);
  };

  const formatCurrency = (amount: number) => {
    return `${amount} ${businessData.currencySymbol}`;
  };

  const updatePurchase = (purchaseId: string, updatedData: Partial<Purchase>) => {
    const existingPurchase = purchases.find(p => p.id === purchaseId);
    if (!existingPurchase) return;

    const changes = compareObjects(existingPurchase, { ...existingPurchase, ...updatedData });
    
    const updatedPurchases = purchases.map(p => 
      p.id === purchaseId ? { ...p, ...updatedData } : p
    );
    setPurchases(updatedPurchases);
    saveToStorage(STORAGE_KEYS.PURCHASES, updatedPurchases);

    // Create audit log
    if (changes.length > 0) {
      const auditLog = createAuditLog(
        'UPDATE',
        'PURCHASE',
        purchaseId,
        existingPurchase.productName,
        businessData.userName,
        changes,
        `Achat modifié: ${existingPurchase.productName}`,
        {
          productName: existingPurchase.productName,
          amount: existingPurchase.totalPrice
        }
      );
      saveAuditLog(auditLog);
      setAuditLogs(prev => [auditLog, ...prev]);
    }
  };

  const updateSale = (saleId: string, updatedData: Partial<Sale>) => {
    const existingSale = sales.find(s => s.id === saleId);
    if (!existingSale) return;

    const changes = compareObjects(existingSale, { ...existingSale, ...updatedData });
    
    const updatedSales = sales.map(s => 
      s.id === saleId ? { ...s, ...updatedData } : s
    );
    setSales(updatedSales);
    saveToStorage(STORAGE_KEYS.SALES, updatedSales);

    // Create audit log
    if (changes.length > 0) {
      const auditLog = createAuditLog(
        'UPDATE',
        'SALE',
        saleId,
        `Vente à ${existingSale.clientName}`,
        businessData.userName,
        changes,
        `Vente modifiée: ${existingSale.clientName}`,
        {
          clientName: existingSale.clientName,
          amount: existingSale.totalAmount
        }
      );
      saveAuditLog(auditLog);
      setAuditLogs(prev => [auditLog, ...prev]);
    }
  };

  const deletePurchase = (purchaseId: string) => {
    const existingPurchase = purchases.find(p => p.id === purchaseId);
    if (!existingPurchase) return;

    const updatedPurchases = purchases.filter(p => p.id !== purchaseId);
    setPurchases(updatedPurchases);
    saveToStorage(STORAGE_KEYS.PURCHASES, updatedPurchases);

    // Create audit log
    const auditLog = createAuditLog(
      'DELETE',
      'PURCHASE',
      purchaseId,
      existingPurchase.productName,
      businessData.userName,
      [
        { field: 'deleted', oldValue: false, newValue: true }
      ],
      `Achat supprimé: ${existingPurchase.productName} de ${existingPurchase.supplierName}`,
      {
        productName: existingPurchase.productName,
        amount: existingPurchase.totalPrice
      }
    );
    saveAuditLog(auditLog);
    setAuditLogs(prev => [auditLog, ...prev]);
  };

  const deleteSale = (saleId: string) => {
    const existingSale = sales.find(s => s.id === saleId);
    if (!existingSale) return;

    // Check if sale has associated debt payments
    const hasPayments = debtPayments.some(payment => 
      payment.debtId === saleId || 
      debts.some(debt => debt.salesIds.includes(saleId) && debt.id === payment.debtId)
    );

    if (hasPayments) {
      throw new Error('Cette vente a des paiements associés et ne peut pas être supprimée');
    }

    const updatedSales = sales.filter(s => s.id !== saleId);
    setSales(updatedSales);
    saveToStorage(STORAGE_KEYS.SALES, updatedSales);

    // Create audit log
    const auditLog = createAuditLog(
      'DELETE',
      'SALE',
      saleId,
      `Vente à ${existingSale.clientName}`,
      businessData.userName,
      [
        { field: 'deleted', oldValue: false, newValue: true }
      ],
      `Vente supprimée: ${existingSale.clientName}`,
      {
        clientName: existingSale.clientName,
        amount: existingSale.totalAmount
      }
    );
    saveAuditLog(auditLog);
    setAuditLogs(prev => [auditLog, ...prev]);
  };


  return {
    businessData,
    purchases,
    sales,
    debts,
    products,
    clients,
    debtPayments,
    auditLogs,
    notifications,
    updateBusinessData,
    addPurchase,
    addSale,
    updatePurchase,
    updateSale,
    deletePurchase,
    deleteSale,
    recordDebtPayment,
    formatCurrency,
  };
};