import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import React, { createContext, useContext, useEffect, useState } from "react";
import {
    AppConfig,
    AuditLog,
    BackupData,
    Client,
    Debt,
    DebtPayment,
    Product,
    Purchase,
    Sale,
} from "../types/business";

interface BusinessContextType {
    config?: AppConfig;
    setConfig: React.Dispatch<React.SetStateAction<AppConfig | undefined>>;
    importData: (data: BackupData) => void;
    logAudit: (log: AuditLog) => void;
    auditLogs: AuditLog[];
    setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
    isAuthenticated: boolean;
    login: (password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    resetApp: () => Promise<void>;
    products: Product[];
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    addProduct: (product: Product) => void;
    updateProduct: (product: Product) => void;
    deleteProduct: (id: string) => void;
    sales: Sale[];
    setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
    addSale: (sale: Sale) => void;
    deleteSale: (id: string) => void;
    purchases: Purchase[];
    setPurchases: React.Dispatch<React.SetStateAction<Purchase[]>>;
    addPurchase: (purchase: Purchase) => void;
    deletePurchase: (id: string) => void;
    clients: Client[];
    setClients: React.Dispatch<React.SetStateAction<Client[]>>;
    addClient: (client: Client) => void;
    updateClient: (client: Client) => void;
    deleteClient: (id: string) => void;
    debts: Debt[];
    setDebts: React.Dispatch<React.SetStateAction<Debt[]>>;
    addDebt: (debt: Debt) => void;
    deleteDebt: (id: string) => void;
    addDebtPayment: (payment: DebtPayment) => void;
    deleteDebtPayment: (debtId: string, paymentId: string) => void;
    generateId: () => string;
    getProductById: (id: string) => Product | undefined;
    updateConfig: (newConfig: Partial<AppConfig>) => void
}

const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<AppConfig | undefined>(undefined);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [debts, setDebts] = useState<Debt[]>([]);

    const logAudit = (log: AuditLog) => {
        setAuditLogs((prev) => [...prev, log]);
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const savedConfig = await AsyncStorage.getItem("appConfig");
                if (savedConfig) setConfig(JSON.parse(savedConfig));
                const authStatus = await AsyncStorage.getItem("isAuthenticated");
                if (authStatus === "true") setIsAuthenticated(true);
                const savedLogs = await AsyncStorage.getItem("auditLogs");
                if (savedLogs) setAuditLogs(JSON.parse(savedLogs));
                const savedProducts = await AsyncStorage.getItem("products");
                if (savedProducts) setProducts(JSON.parse(savedProducts));
                const savedSales = await AsyncStorage.getItem("sales");
                if (savedSales) setSales(JSON.parse(savedSales));
                const savedPurchases = await AsyncStorage.getItem("purchases");
                if (savedPurchases) setPurchases(JSON.parse(savedPurchases));
                const savedClients = await AsyncStorage.getItem("clients");
                if (savedClients) setClients(JSON.parse(savedClients));
                const savedDebts = await AsyncStorage.getItem("debts");
                if (savedDebts) setDebts(JSON.parse(savedDebts));
            } catch (error) {
                console.error("Erreur lors du chargement des données:", error);
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        const saveData = async () => {
            try {
                if (config) await AsyncStorage.setItem("appConfig", JSON.stringify(config));
                await AsyncStorage.setItem("auditLogs", JSON.stringify(auditLogs));
                await AsyncStorage.setItem("products", JSON.stringify(products));
                await AsyncStorage.setItem("sales", JSON.stringify(sales));
                await AsyncStorage.setItem("purchases", JSON.stringify(purchases));
                await AsyncStorage.setItem("clients", JSON.stringify(clients));
                await AsyncStorage.setItem("debts", JSON.stringify(debts));
            } catch (error) {
                console.error("Erreur lors de la sauvegarde des données:", error);
            }
        };
        if (config || auditLogs.length > 0 || products.length > 0 || sales.length > 0 || purchases.length > 0 || clients.length > 0 || debts.length > 0) {
            saveData();
        }
    }, [config, auditLogs, products, sales, purchases, clients, debts]);

    // const importData = (data: BackupData) => {
    //     if (data.config) {
    //         setConfig(data.config);
    //         setProducts(data.products || []);
    //         setSales(data.sales || []);
    //         setPurchases(data.purchases || []);
    //         setClients(data.clients || []);
    //         setDebts(data.debts || []);
    //         setAuditLogs(data.auditLogs || []);
    //         logAudit({
    //             id: generateId(),
    //             eventType: "import",
    //             entityType: "backup",
    //             entityId: null,
    //             userName: data.config?.userName || "unknown",
    //             description: "Importation des données de sauvegarde",
    //             timestamp: new Date().toISOString(),
    //             status: "success",
    //         });
    //     }
    // };

    const login = async (password: string) => {
        if (!config) return false;
        const hashedPassword = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            password
        );
        const isValid = config.passwordHash === hashedPassword;
        if (isValid) {
            setIsAuthenticated(true);
            await AsyncStorage.setItem("isAuthenticated", "true");
            logAudit({
                id: generateId(),
                eventType: "login",
                entityType: "config",
                entityId: null,
                userName: config.userName,
                description: `Connexion réussie pour l'utilisateur ${config.userName}`,
                timestamp: new Date().toISOString(),
                status: "success",
            });
        } else {
            logAudit({
                id: generateId(),
                eventType: "login",
                entityType: "config",
                entityId: null,
                userName: config.userName || "unknown",
                description: "Échec de la connexion (mot de passe incorrect)",
                timestamp: new Date().toISOString(),
                status: "failure",
                errorMessage: "Mot de passe incorrect",
            });
        }
        return isValid;
    };

    const addProduct = (product: Product) => {
        setProducts((prev) => [...prev, product]);
        logAudit({
            id: generateId(),
            eventType: "create",
            entityType: "product",
            entityId: product.id,
            userName: config?.userName || "unknown",
            description: `Produit ${product.name} ajouté`,
            timestamp: new Date().toISOString(),
            status: "success",
        });
    };

    const getProductById = (id: string) => {
        return products.find((p) => p.id === id);
    };

    const updateProduct = (updatedProduct: Product) => {
        const oldProduct = products.find(p => p.id === updatedProduct.id);
        setProducts((prev) =>
            prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
        );
        logAudit({
            id: generateId(),
            eventType: "update",
            entityType: "product",
            entityId: updatedProduct.id,
            userName: config?.userName || "unknown",
            description: `Produit ${updatedProduct.name} mis à jour`,
            timestamp: new Date().toISOString(),
            status: "success",
            changes: { product: { old: oldProduct || {}, new: updatedProduct } },
        });
    };

    const deleteProduct = (id: string) => {
        const product = products.find((p) => p.id === id);
        if (!product) return;

        // Supprimer les achats associés
        const relatedPurchases = purchases.filter((p) => p.productId === id);
        setPurchases((prev) => prev.filter((p) => p.productId !== id));
        relatedPurchases.forEach((purchase) => {
            logAudit({
                id: generateId(),
                eventType: "delete",
                entityType: "purchase",
                entityId: purchase.id,
                userName: config?.userName || "unknown",
                description: `Achat ${purchase.id} supprimé en raison de la suppression du produit ${product.name}`,
                timestamp: new Date().toISOString(),
                status: "success",
            });
        });

        // Identifier les ventes contenant des SaleItem liés au produit
        const relatedSales = sales.filter((sale) =>
            sale.items.some((item) => item.productId === id)
        );
        const relatedSaleIds = relatedSales.map((sale) => sale.id);
        setSales((prev) => prev.filter((sale) => !sale.items.some((item) => item.productId === id)));
        relatedSales.forEach((sale) => {
            logAudit({
                id: generateId(),
                eventType: "delete",
                entityType: "sale",
                entityId: sale.id,
                userName: config?.userName || "unknown",
                description: `Vente ${sale.id} supprimée en raison de la suppression du produit ${product.name}`,
                timestamp: new Date().toISOString(),
                status: "success",
            });
        });

        // Supprimer les dettes associées aux ventes supprimées
        const relatedDebts = debts.filter((debt) => relatedSaleIds.includes(debt.saleId));
        setDebts((prev) => prev.filter((debt) => !relatedSaleIds.includes(debt.saleId)));
        relatedDebts.forEach((debt) => {
            logAudit({
                id: generateId(),
                eventType: "delete",
                entityType: "debt",
                entityId: debt.id,
                userName: config?.userName || "unknown",
                description: `Dette ${debt.id} supprimée en raison de la suppression de la vente associée`,
                timestamp: new Date().toISOString(),
                status: "success",
            });
        });

        // Supprimer le produit
        setProducts((prev) => prev.filter((p) => p.id !== id));
        logAudit({
            id: generateId(),
            eventType: "delete",
            entityType: "product",
            entityId: id,
            userName: config?.userName || "unknown",
            description: `Produit ${product.name || id} supprimé`,
            timestamp: new Date().toISOString(),
            status: "success",
        });
    };

    const deletePurchase = (id: string) => {
        const purchase = purchases.find((p) => p.id === id);
        if (!purchase) return;

        setPurchases((prev) => prev.filter((p) => p.id !== id));
        logAudit({
            id: generateId(),
            eventType: "delete",
            entityType: "purchase",
            entityId: id,
            userName: config?.userName || "unknown",
            description: `Achat ${id} supprimé pour le produit ${purchase.productId}`,
            timestamp: new Date().toISOString(),
            status: "success",
        });
    };

    const addSale = (sale: Sale) => {
        setSales((prev) => [...prev, sale]);
        logAudit({
            id: generateId(),
            eventType: "create",
            entityType: "sale",
            entityId: sale.id,
            userName: config?.userName || "unknown",
            description: `Vente ${sale.id} ajoutée pour un montant de ${sale.totalAmount} ${config?.currency || ""}`,
            timestamp: new Date().toISOString(),
            status: "success",
        });
    };

    const deleteSale = (id: string) => {
        const sale = sales.find((s) => s.id === id);
        if (!sale) return;

        // Supprimer les dettes associées
        const relatedDebts = debts.filter((debt) => debt.saleId === id);
        setDebts((prev) => prev.filter((debt) => debt.saleId !== id));
        relatedDebts.forEach((debt) => {
            logAudit({
                id: generateId(),
                eventType: "delete",
                entityType: "debt",
                entityId: debt.id,
                userName: config?.userName || "unknown",
                description: `Dette ${debt.id} supprimée en raison de la suppression de la vente ${id}`,
                timestamp: new Date().toISOString(),
                status: "success",
            });
        });

        // Mettre à jour client.debtAmount si le client existe
        if (sale.clientId) {
            const client = clients.find((c) => c.id === sale.clientId);
            if (client) {
                const totalDebtRemoved = relatedDebts.reduce((sum, debt) => sum + debt.amount, 0);
                const oldDebtAmount = client.debtAmount;
                const newDebtAmount = Math.max(0, client.debtAmount - totalDebtRemoved);
                setClients((prev) =>
                    prev.map((c) =>
                        c.id === sale.clientId ? { ...c, debtAmount: newDebtAmount } : c
                    )
                );
                logAudit({
                    id: generateId(),
                    eventType: "update",
                    entityType: "client",
                    entityId: client.id,
                    userName: config?.userName || "unknown",
                    description: `Montant de la dette du client ${client.name} mis à jour en raison de la suppression de la vente ${id}`,
                    timestamp: new Date().toISOString(),
                    status: "success",
                    changes: {
                        client: {
                            old: { debtAmount: oldDebtAmount },
                            new: { debtAmount: newDebtAmount },
                        },
                    },
                });
            }
        }

        // Supprimer la vente
        setSales((prev) => prev.filter((s) => s.id !== id));
        logAudit({
            id: generateId(),
            eventType: "delete",
            entityType: "sale",
            entityId: id,
            userName: config?.userName || "unknown",
            description: `Vente ${id} supprimée`,
            timestamp: new Date().toISOString(),
            status: "success",
        });
    };
    const addPurchase = (purchase: Purchase) => {
        setPurchases((prev) => [...prev, purchase]);
        setProducts(prevProducts =>
            prevProducts.map(product =>
                product.id === purchase.productId
                    ? { ...product, stock: product.stock + purchase.quantity }
                    : product
            )
        );
        logAudit({
            id: generateId(),
            eventType: "create",
            entityType: "purchase",
            entityId: purchase.id,
            userName: config?.userName || "unknown",
            description: `Achat ${purchase.id} ajouté pour le produit ${purchase.productId}`,
            timestamp: new Date().toISOString(),
            status: "success",
        });
    };

    const addClient = (client: Client) => {
        setClients((prev) => [...prev, client]);
        logAudit({
            id: generateId(),
            eventType: "create",
            entityType: "client",
            entityId: client.id,
            userName: config?.userName || "unknown",
            description: `Client ${client.name} ajouté`,
            timestamp: new Date().toISOString(),
            status: "success",
        });
    };

    const updateClient = (updatedClient: Client) => {
        const oldClient = clients.find(c => c.id === updatedClient.id);
        setClients((prev) => prev.map((c) => (c.id === updatedClient.id ? updatedClient : c)));
        logAudit({
            id: generateId(),
            eventType: "update",
            entityType: "client",
            entityId: updatedClient.id,
            userName: config?.userName || "unknown",
            description: `Client ${updatedClient.name} mis à jour`,
            timestamp: new Date().toISOString(),
            status: "success",
            changes: { client: { old: oldClient || {}, new: updatedClient } },
        });
    };

    const deleteClient = (id: string) => {
        const client = clients.find((c) => c.id === id);
        if (!client) return;

        // Supprimer les ventes associées
        const relatedSales = sales.filter((sale) => sale.clientId === id);
        const relatedSaleIds = relatedSales.map((sale) => sale.id);
        setSales((prev) => prev.filter((sale) => sale.clientId !== id));
        relatedSales.forEach((sale) => {
            logAudit({
                id: generateId(),
                eventType: "delete",
                entityType: "sale",
                entityId: sale.id,
                userName: config?.userName || "unknown",
                description: `Vente ${sale.id} supprimée en raison de la suppression du client ${client.name}`,
                timestamp: new Date().toISOString(),
                status: "success",
            });
        });

        // Supprimer les dettes associées aux ventes supprimées ou directement liées au client
        const relatedDebts = debts.filter((debt) => debt.clientId === id || relatedSaleIds.includes(debt.saleId));
        setDebts((prev) => prev.filter((debt) => debt.clientId !== id && !relatedSaleIds.includes(debt.saleId)));
        relatedDebts.forEach((debt) => {
            logAudit({
                id: generateId(),
                eventType: "delete",
                entityType: "debt",
                entityId: debt.id,
                userName: config?.userName || "unknown",
                description: `Dette ${debt.id} supprimée en raison de la suppression du client ${client.name} ou de la vente associée`,
                timestamp: new Date().toISOString(),
                status: "success",
            });
        });

        // Supprimer le client
        setClients((prev) => prev.filter((c) => c.id !== id));
        logAudit({
            id: generateId(),
            eventType: "delete",
            entityType: "client",
            entityId: id,
            userName: config?.userName || "unknown",
            description: `Client ${client.name || id} supprimé`,
            timestamp: new Date().toISOString(),
            status: "success",
        });
    };

    const addDebt = (debt: Debt) => {
        setDebts((prev) => [...prev, debt]);
        logAudit({
            id: generateId(),
            eventType: "create",
            entityType: "debt",
            entityId: debt.id,
            userName: config?.userName || "unknown",
            description: `Dette ${debt.id} ajoutée pour le client ${debt.clientId}`,
            timestamp: new Date().toISOString(),
            status: "success",
        });
    };

    const deleteDebt = (id: string) => {
        const debt = debts.find((d) => d.id === id);
        if (!debt) return;

        setDebts((prev) => prev.filter((d) => d.id !== id));
        logAudit({
            id: generateId(),
            eventType: "delete",
            entityType: "debt",
            entityId: id,
            userName: config?.userName || "unknown",
            description: `Dette ${id} supprimée pour le client ${debt.clientId}`,
            timestamp: new Date().toISOString(),
            status: "success",
        });
    };

    const addDebtPayment = (payment: DebtPayment) => {
        setDebts((prev) =>
            prev.map((d) =>
                d.id === payment.debtId ? { ...d, paymentHistory: [...d.paymentHistory, payment] } : d
            )
        );
        const debt = debts.find(d => d.id === payment.debtId);
        if (debt) {
            setClients(prevClients =>
                prevClients.map(client =>
                    client.id === debt.clientId
                        ? { ...client, debtAmount: Math.max(0, client.debtAmount - payment.amount) }
                        : client
                )
            );
        }
        logAudit({
            id: generateId(),
            eventType: "create",
            entityType: "payment",
            entityId: payment.id,
            userName: config?.userName || "unknown",
            description: `Paiement ${payment.id} ajouté pour la dette ${payment.debtId}`,
            timestamp: new Date().toISOString(),
            status: "success",
        });
    };

    const deleteDebtPayment = (debtId: string, paymentId: string) => {
        const debt = debts.find((d) => d.id === debtId);
        if (!debt) return;

        const payment = debt.paymentHistory.find((p) => p.id === paymentId);
        if (!payment) return;

        // Supprimer le paiement et mettre à jour l'historique
        setDebts((prev) =>
            prev.map((d) =>
                d.id === debtId
                    ? { ...d, paymentHistory: d.paymentHistory.filter((p) => p.id !== paymentId) }
                    : d
            )
        );

        // Mettre à jour le debtAmount du client
        setClients((prevClients) =>
            prevClients.map((client) =>
                client.id === debt.clientId
                    ? { ...client, debtAmount: client.debtAmount + payment.amount }
                    : client
            )
        );

        logAudit({
            id: generateId(),
            eventType: "delete",
            entityType: "payment",
            entityId: paymentId,
            userName: config?.userName || "unknown",
            description: `Paiement ${paymentId} supprimé pour la dette ${debtId}`,
            timestamp: new Date().toISOString(),
            status: "success",
        });
    };

    const logout = async () => {
        try {
            await AsyncStorage.setItem("isAuthenticated", "false");
            setIsAuthenticated(false);
            logAudit({
                id: generateId(),
                eventType: "login",
                entityType: "config",
                entityId: null,
                userName: config?.userName || "unknown",
                description: "Déconnexion de l'utilisateur",
                timestamp: new Date().toISOString(),
                status: "success",
            });
        } catch (error) {
            console.error("Erreur lors de la déconnexion:", error);
        }
    };
    const updateConfig = (newConfig: Partial<AppConfig>) => {
        setConfig((prev) => {
            // Ensure all required fields are present, fallback to previous or empty string/default
            const updatedConfig: AppConfig = {
                businessName: newConfig.businessName ?? prev?.businessName ?? "",
                userName: newConfig.userName ?? prev?.userName ?? "",
                currency: newConfig.currency ?? prev?.currency ?? "",
                currencyCode: newConfig.currencyCode ?? prev?.currencyCode ?? "",
                currencySymbol: newConfig.currencySymbol ?? prev?.currencySymbol ?? "",
                language: newConfig.language ?? prev?.language ?? "en",
                isRTL: newConfig.isRTL ?? prev?.isRTL ?? false,
                passwordHash: newConfig.passwordHash ?? prev?.passwordHash ?? "",
            };
            AsyncStorage.setItem('config', JSON.stringify(updatedConfig));
            return updatedConfig;
        });
        logAudit({
            id: generateId(),
            eventType: "update",
            entityType: "config",
            entityId: "config",
            userName: config?.userName || "unknown",
            description: `Configuration mise à jour : ${JSON.stringify(newConfig)}`,
            timestamp: new Date().toISOString(),
            status: "success",
            changes: { config: { old: config, new: newConfig } },
        });
    };

    const importData = async (data: BackupData) => {
        try {
            setProducts(data.products || []);
            setSales(data.sales || []);
            setPurchases(data.purchases || []);
            setClients(data.clients || []);
            setDebts(data.debts || []);
            setConfig(data.config || {});
            setAuditLogs(data.auditLogs || []);
            await AsyncStorage.setItem('products', JSON.stringify(data.products || []));
            await AsyncStorage.setItem('sales', JSON.stringify(data.sales || []));
            await AsyncStorage.setItem('purchases', JSON.stringify(data.purchases || []));
            await AsyncStorage.setItem('clients', JSON.stringify(data.clients || []));
            await AsyncStorage.setItem('debts', JSON.stringify(data.debts || []));
            await AsyncStorage.setItem('config', JSON.stringify(data.config || {}));
            await AsyncStorage.setItem('auditLogs', JSON.stringify(data.auditLogs || []));
            logAudit({
                id: generateId(),
                eventType: "import",
                entityType: "data",
                entityId: "all",
                userName: config?.userName || "unknown",
                description: "Données importées avec succès",
                timestamp: new Date().toISOString(),
                status: "success",
            });
        } catch (error) {
            logAudit({
                id: generateId(),
                eventType: "import",
                entityType: "data",
                entityId: "all",
                userName: config?.userName || "unknown",
                description: `Échec de l'importation des données : ${error}`,
                timestamp: new Date().toISOString(),
                status: "failure",
                errorMessage: String(error),
            });
            throw error;
        }
    };
    const resetApp = async () => {
        try {
            await AsyncStorage.multiRemove([
                "hasSeenOnboarding",
                "appConfig",
                "auditLogs",
                "products",
                "sales",
                "purchases",
                "clients",
                "debts",
                "isAuthenticated"
            ]);
            setConfig(undefined);
            setAuditLogs([]);
            setIsAuthenticated(false);
            setProducts([]);
            setSales([]);
            setPurchases([]);
            setClients([]);
            setDebts([]);
        } catch (error) {
            console.error("Erreur lors du reset:", error);
        }
    };

    return (
        <BusinessContext.Provider
            value={{
                config,
                setConfig,
                importData,
                logAudit,
                auditLogs,
                isAuthenticated,
                login,
                logout,
                products,
                addProduct,
                updateProduct,
                deleteProduct,
                sales,
                addSale,
                deleteSale,
                purchases,
                addPurchase,
                deletePurchase,
                clients,
                addClient,
                updateClient,
                deleteClient,
                debts,
                addDebt,
                deleteDebt,
                addDebtPayment,
                deleteDebtPayment,
                resetApp,
                generateId,
                setProducts,
                setSales,
                setPurchases,
                setClients,
                setDebts,
                setAuditLogs,
                getProductById,
                updateConfig
            }}
        >
            {children}
        </BusinessContext.Provider>
    );
};

export const useBusiness = () => {
    const ctx = useContext(BusinessContext);
    if (!ctx) throw new Error("useBusiness must be used inside BusinessProvider");
    return ctx;
};