// Entités principales pour la gestion des données de l'application
export interface Product {
  id: string; // UUID unique pour chaque produit
  name: string; // Nom du produit
  purchasePrice: number; // Prix d'achat
  salePrice: number; // Prix de vente
  stock: number; // Quantité en stock
  supplier: string; // Nom du fournisseur
  createdAt: string; // Date ISO (ex: 2025-08-27T18:57:00Z)
  updatedAt: string; // Date de dernière mise à jour
  lastSyncTimestamp?: string; // Date ISO de la dernière sync (ex: 2025-09-15T18:00:00Z)
  version: number; // Compteur de version, incrémenté à chaque modification
  isDeleted?: boolean; // Pour marquer comme supprimé (défaut: false)
  syncStatus?: 'pending' | 'synced' | 'failed'; // État de synchronisation
}

export interface SaleItem {
  productId: string; // Référence au produit
  quantity: number; // Quantité vendue
  unitPrice: number; // Prix unitaire au moment de la vente
  totalPrice: number; // Prix total (quantity * unitPrice)
  lastSyncTimestamp?: string;
  version: number;
  isDeleted?: boolean;
  syncStatus?: 'pending' | 'synced' | 'failed';
}

export interface Sale {
  id: string; // UUID unique pour la vente
  clientId: string | null; // Référence au client, null si aucun client
  items: SaleItem[]; // Liste des produits vendus
  totalAmount: number; // Montant total de la vente
  paymentStatus: 'full' | 'partial' | 'debt'; // Statut du paiement
  paidAmount: number; // Montant payé
  debtAmount: number; // Montant dû
  date: string; // Date ISO
  lastSyncTimestamp?: string;
  version: number;
  isDeleted?: boolean;
  syncStatus?: 'pending' | 'synced' | 'failed';
}

export interface Purchase {
  id: string; // UUID unique pour l'achat
  productId: string; // Référence au produit
  quantity: number; // Quantité achetée
  purchasePrice: number; // Prix d'achat unitaire
  totalPrice: number; // Prix total (quantity * purchasePrice)
  supplier: string; // Nom du fournisseur
  date: string; // Date ISO
  lastSyncTimestamp?: string;
  version: number;
  isDeleted?: boolean;
  syncStatus?: 'pending' | 'synced' | 'failed';
}

export interface Client {
  id: string; // UUID unique pour le client
  name: string; // Nom du client
  purchaseCount: number; // Nombre d'achats effectués
  totalSpent: number; // Total dépensé par le client
  debtAmount: number; // Dette totale
  createdAt: string; // Date ISO
  lastSyncTimestamp?: string;
  version: number;
  isDeleted?: boolean;
  syncStatus?: 'pending' | 'synced' | 'failed';
}

export interface Debt {
  id: string; // UUID unique pour la dette
  saleId: string; // Référence à la vente associée
  clientId: string; // Référence au client
  amount: number; // Montant de la dette
  createdAt: string; // Date ISO
  paymentHistory: DebtPayment[]; // Historique des paiements
  lastSyncTimestamp?: string;
  version: number;
  isDeleted?: boolean;
  syncStatus?: 'pending' | 'synced' | 'failed';

}

export interface DebtPayment {
  id: string; // UUID unique pour le paiement
  debtId: string; // Référence à la dette
  amount: number; // Montant payé
  date: string; // Date ISO
}

// Nouvelle entité pour l'audit et la journalisation
export interface AuditLog {
  id: string; // UUID unique pour l'entrée de log
  eventType: 'create' | 'update' | 'delete' | 'view' | 'export' | 'import' | 'login' | 'error'; // Type d'événement (création, mise à jour, suppression, etc.)
  entityType: 'product' | 'sale' | 'purchase' | 'client' | 'debt' | 'payment' | 'config' | 'backup'|'data'; // Type d'entité concernée
  entityId: string | null; // ID de l'entité concernée (null si non applicable)
  userName: string; // Nom de l'utilisateur qui a effectué l'action (de AppConfig)
  description: string; // Description détaillée de l'événement (ex: "Vente ID xyz créée avec montant 100$")
  changes?: Record<string, { old: any; new: any }>; // Optionnel: Détails des changements pour les mises à jour
  timestamp: string; // Date ISO (ex: 2025-08-27T18:57:00Z)
  status: 'success' | 'failure'; // Statut de l'opération
  errorMessage?: string; // Optionnel: Message d'erreur si échec
  lastSyncTimestamp?: string;
  version: number;
  isDeleted?: boolean;
  syncStatus?: 'pending' | 'synced' | 'failed';
}

// Configuration globale de l'application
export interface AppConfig {
  businessName: string;
  userName: string;
  currency: string;
  currencyCode: string;
  currencySymbol: string;
  language: 'en' | 'fr' | 'es' | 'ar';
  isRTL: boolean;
  passwordHash: string;
  lastSyncTimestamp?: string; // Déjà présent
  version: number; // Pour suivre les modifications de config
}

// Props des composants React pour une réutilisation modulaire
export interface AddPurchaseProps {
  onAddPurchase: (purchase: Purchase) => void; // Callback pour ajouter un achat
  products: Product[]; // Liste des produits pour sélection
  currency: string; // Devise pour affichage
  onLogAudit: (log: AuditLog) => void; // Callback pour journaliser l'action
}

export interface AddSaleProps {
  onAddSale: (sale: Sale) => void; // Callback pour ajouter une vente
  products: Product[]; // Liste des produits disponibles
  clients: Client[]; // Liste des clients pour association
  currency: string; // Devise pour affichage
  onLogAudit: (log: AuditLog) => void; // Callback pour journaliser l'action
}

export interface ClientsProps {
  clients: Client[]; // Liste des clients
  onSelectClient: (clientId: string) => void; // Callback pour sélectionner un client
  onAddClient: (client: Client) => void; // Callback pour ajouter un client
  onLogAudit: (log: AuditLog) => void; // Callback pour journaliser l'action
}

export interface DashboardProps {
  products: Product[]; // Données pour aperçu stock
  sales: Sale[]; // Données pour aperçu ventes
  clients: Client[]; // Données pour aperçu clients
  currency: string; // Devise pour affichage
  language: AppConfig['language']; // Langue pour localisation
  onLogAudit: (log: AuditLog) => void; // Callback pour journaliser les vues ou actions
}

export interface DebtsProps {
  debts: Debt[]; // Liste des dettes
  clients: Client[]; // Liste des clients pour association
  onAddPayment: (payment: DebtPayment) => void; // Callback pour ajouter un paiement
  currency: string; // Devise pour affichage
  onLogAudit: (log: AuditLog) => void; // Callback pour journaliser l'action
}

export interface HistoryProps {
  sales: Sale[]; // Historique des ventes
  purchases: Purchase[]; // Historique des achats
  debts: Debt[]; // Historique des dettes
  currency: string; // Devise pour affichage
  onLogAudit: (log: AuditLog) => void; // Callback pour journaliser les vues
}

export interface ReportsProps {
  sales: Sale[]; // Données pour rapports de ventes
  purchases: Purchase[]; // Données pour rapports d'achats
  clients: Client[]; // Données pour rapports clients
  currency: string; // Devise pour affichage
  language: AppConfig['language']; // Langue pour localisation
  onLogAudit: (log: AuditLog) => void; // Callback pour journaliser les vues ou exports
}

export interface SettingsProps {
  config: AppConfig; // Configuration actuelle
  onUpdateConfig: (config: Partial<AppConfig>) => void; // Callback pour mettre à jour la config
  onLogAudit: (log: AuditLog) => void; // Callback pour journaliser les changements
}

// Nouvelle props pour un composant d'Audit/Logs (optionnel, à ajouter si besoin d'un écran dédié)
export interface AuditLogsProps {
  logs: AuditLog[]; // Liste des logs
  onFilterLogs: (filter: { eventType?: string; entityType?: string; dateRange?: { start: string; end: string } }) => void; // Callback pour filtrer
  currency: string; // Devise pour affichage si pertinent
  language: AppConfig['language']; // Langue pour localisation
}

// Interface pour la gestion des données (export/import), incluant les logs
export interface BackupData {
  products: Product[];
  sales: Sale[];
  purchases: Purchase[];
  clients: Client[];
  debts: Debt[];
  config: AppConfig;
  auditLogs: AuditLog[];
  lastSyncTimestamp?: string; // Timestamp global de la dernière sync
  version: number; // Version du backup global
}



export type HistoryItem = {
  id: string;
  type: 'sale' | 'purchase' | 'payment' | 'audit';
  title: string;
  subtitle: string;
  amount?: number;
  date: string;
  status?: string;
  icon: string;
  color: string;
};