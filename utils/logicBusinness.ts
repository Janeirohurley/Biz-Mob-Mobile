import { Debt, HistoryItem, Purchase, Sale } from "@/types/business";

export type FilterType = "all" | "sales" | "purchases" | "payments" | "audit";


type BusinessData = {
    sales: Sale[];
    purchases: Purchase[];
    debts: Debt[];
    auditLogs: any[];
    clients: any[];
    products: any[];
};

export const createHistoryItems = ({
    sales = [],
    purchases = [],
    debts = [],
    auditLogs = [],
    clients = [],
    products = [],
}: Partial<BusinessData> = {}): HistoryItem[] => {
    const getClientName = (clientId: string | null) => clients.find(c => c.id === clientId)?.name || (clientId ? "Unknown Client" : "Walk-in Customer");
    const getProductName = (productId: string) => products.find(p => p.id === productId)?.name || "Unknown Product";

    const items: HistoryItem[] = [];

    sales.forEach(sale => items.push({
        id: `sale-${sale.id}`,
        type: "sale",
        title: `Sale #${sale.id.slice(-4).toUpperCase()}`,
        subtitle: `${getClientName(sale.clientId)} • ${sale.items.length} item${sale.items.length !== 1 ? "s" : ""}`,
        amount: sale.totalAmount,
        date: sale.date,
        status: sale.paymentStatus,
        icon: "trending-up",
        color: "#34C759",
    }));

    purchases.forEach(purchase => items.push({
        id: `purchase-${purchase.id}`,
        type: "purchase",
        title: `Purchase #${purchase.id.slice(-4).toUpperCase()}`,
        subtitle: `${getProductName(purchase.productId)} • ${purchase.quantity} units from ${purchase.supplier}`,
        amount: purchase.totalPrice,
        date: purchase.date,
        icon: "cube",
        color: "#007AFF",
    }));

    debts.forEach(debt => debt.paymentHistory.forEach(payment => items.push({
        id: `payment-${payment.id}`,
        type: "payment",
        title: `Payment #${payment.id.slice(-4).toUpperCase()}`,
        subtitle: `Debt payment for ${getClientName(debt.clientId)}`,
        amount: payment.amount,
        date: payment.date,
        icon: "card",
        color: "#FF9500",
    })));

    auditLogs
        .filter(log => ["create", "update", "delete", "login"].includes(log.eventType))
        .forEach(log => items.push({
            id: `audit-${log.id}`,
            type: "audit",
            title: `${log.eventType.charAt(0).toUpperCase() + log.eventType.slice(1)} ${log.entityType}`,
            subtitle: log.description,
            date: log.timestamp,
            status: log.status,
            icon: log.eventType === "create" ? "add-circle"
                : log.eventType === "update" ? "create"
                    : log.eventType === "delete" ? "trash"
                        : "log-in",
            color: log.status === "success" ? "#8E8E93" : "#FF3B30",
        }));

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};


export function groupByDate<T extends Record<string, any>>({
    items,
    dateField,
    locale = "fr-FR",
}: {
    items: T[];
    dateField: keyof T; // champ à utiliser comme date
    locale?: string;    // locale pour l’affichage
}): { title: string; data: T[] }[] {
    const groups: Record<string, T[]> = {};

    items.forEach((item) => {
        const rawDate = item[dateField];
        if (!rawDate) return;

        const dateKey = new Date(rawDate as string).toISOString().split("T")[0]; // yyyy-mm-dd
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(item);
    });

    return Object.keys(groups)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()) // tri descendant
        .map((dateKey) => ({
            title: new Date(dateKey).toLocaleDateString(locale, {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
            }),
            data: groups[dateKey],
        }));
}


