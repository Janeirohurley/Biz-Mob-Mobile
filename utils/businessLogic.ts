import { Client, Debt, Product, Purchase, Sale } from '../types/business';

export const calculateProductStock = (
  productName: string,
  purchases: Purchase[],
  sales: Sale[]
): number => {
  const totalPurchased = purchases
    .filter(p => p.productName === productName)
    .reduce((sum, p) => sum + p.quantity, 0);

  const totalSold = sales
    .flatMap(s => s.items)
    .filter(item => item.productName === productName)
    .reduce((sum, item) => sum + item.quantity, 0);

  return Math.max(0, totalPurchased - totalSold);
};

export const updateProductsFromPurchases = (
  existingProducts: Product[],
  purchases: Purchase[]
): Product[] => {
  const productMap = new Map<string, Product>();

  // Initialize from existing products
  existingProducts.forEach((product) => {
    productMap.set(product.name, { ...product });
  });

  // Reset calculated values to recalculate from scratch
  productMap.forEach((product) => {
    product.totalPurchased = 0;
    product.currentStock = 0;
    product.averagePurchasePrice = 0;
  });

  // Process purchases
  purchases.forEach((purchase) => {
    const existing = productMap.get(purchase.productName);
    if (existing) {
      const oldTotal = existing.totalPurchased;
      existing.totalPurchased += purchase.quantity;
      existing.lastPurchasePrice = purchase.unitPrice;

      // Update initialSalePrice if provided in newer purchases
      if (purchase.initialSalePrice) {
        existing.initialSalePrice = purchase.initialSalePrice;
      }

      // Recalculate average purchase price
      existing.averagePurchasePrice =
        (existing.averagePurchasePrice * oldTotal + purchase.unitPrice * purchase.quantity) /
        existing.totalPurchased;
    } else {
      productMap.set(purchase.productName, {
        id: Date.now().toString() + purchase.productName,
        name: purchase.productName,
        currentStock: 0, // Will be calculated later
        totalPurchased: purchase.quantity,
        totalSold: 0,
        lastPurchasePrice: purchase.unitPrice,
        averagePurchasePrice: purchase.unitPrice,
        initialSalePrice: purchase.initialSalePrice || purchase.unitPrice * 1.2,
      });
    }
  });

  return Array.from(productMap.values());
};

export const updateProductsFromSales = (
  products: Product[],
  sales: Sale[]
): Product[] => {
  // Create a copy and reset sold quantities
  const updatedProducts = products.map(p => ({ ...p, totalSold: 0 }));

  // Recalculate total sold from all sales
  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      const productIndex = updatedProducts.findIndex(
        (p) => p.name === item.productName,
      );
      if (productIndex >= 0) {
        updatedProducts[productIndex].totalSold += item.quantity;
      }
    });
  });

  // Update current stock
  updatedProducts.forEach(product => {
    product.currentStock = Math.max(0, product.totalPurchased - product.totalSold);
  });

  return updatedProducts;
};

export const updateClientsFromSales = (
  existingClients: Client[],
  sales: Sale[]
): Client[] => {
  const clientMap = new Map<string, Client>();

  // Initialize from existing clients
  existingClients.forEach((client) => {
    clientMap.set(client.name, {
      ...client,
      totalPurchases: 0,
      totalDebt: 0,
      transactionCount: 0,
      lastTransactionDate: client.lastTransactionDate
    });
  });

  // Recalculate from all sales
  sales.forEach((sale) => {
    const existing = clientMap.get(sale.clientName);
    if (existing) {
      existing.totalPurchases += sale.totalAmount;
      existing.transactionCount += 1;

      // Update last transaction date if this sale is more recent
      if (new Date(sale.date) > new Date(existing.lastTransactionDate)) {
        existing.lastTransactionDate = sale.date;
      }

      if (sale.paymentStatus === "debt" || (sale.paymentStatus === "partial" && sale.remainingDebt)) {
        existing.totalDebt += sale.remainingDebt || sale.totalAmount;
      }
    } else {
      clientMap.set(sale.clientName, {
        id: Date.now().toString() + sale.clientName + Math.random(),
        name: sale.clientName,
        totalPurchases: sale.totalAmount,
        totalDebt: sale.paymentStatus === "debt" || sale.remainingDebt
          ? sale.remainingDebt || sale.totalAmount
          : 0,
        transactionCount: 1,
        lastTransactionDate: sale.date,
      });
    }
  });

  return Array.from(clientMap.values()).sort(
    (a, b) => b.transactionCount - a.transactionCount,
  );
};

export const checkDebtNotifications = (debts: Debt[], sales: Sale[]): string[] => {
  const notifications: string[] = [];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  debts.forEach(debt => {
    if (debt.totalDebt > 0) {
      // Find the oldest unpaid sale for this client
      const clientSales = sales.filter(sale =>
        sale.clientName === debt.clientName &&
        (sale.paymentStatus === 'debt' || sale.remainingDebt)
      );

      const oldestSale = clientSales.sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )[0];

      if (oldestSale && new Date(oldestSale.date) < thirtyDaysAgo) {
        notifications.push(
          `💰 ${debt.clientName} has an overdue debt of $${debt.totalDebt.toFixed(2)} from ${new Date(oldestSale.date).toLocaleDateString()}`
        );
      } else {
        notifications.push(
          `💰 ${debt.clientName} has depassed an overdue debt of $${debt.totalDebt.toFixed(2)} from ${new Date(oldestSale.date).toLocaleDateString()}`
        );
      }
    }
  });

  return notifications;
};

// Format compact (1k, 1.2M, etc.)
export const formatNumber = (n: number) => {
  if (n < 0) {
    n = n * (-1)
    if (n >= 1_000_000) return `-${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
    if (n >= 1_000) return `-${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}k`;
    return n.toString();
  } else {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1) + 'k';
    return n.toString();
  }

};