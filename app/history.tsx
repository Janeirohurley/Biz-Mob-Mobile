import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBusiness } from "../context/BusinessContext";
import Header from "@/components/header";

type HistoryItem = {
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

export default function History() {
  const { sales, purchases, debts, auditLogs, config, clients, products } = useBusiness();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'sales' | 'purchases' | 'payments' | 'audit'>('all');

  const getClientName = (clientId: string | null) => {
    if (!clientId) return "Walk-in Customer";
    const client = clients.find(c => c.id === clientId);
    return client?.name || "Unknown Client";
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || "Unknown Product";
  };

  // Créer la liste d'historique combinée
  const createHistoryItems = (): HistoryItem[] => {
    const items: HistoryItem[] = [];

    // Ajouter les ventes
    sales.forEach(sale => {
      items.push({
        id: `sale-${sale.id}`,
        type: 'sale',
        title: `Sale #${sale.id.slice(-4).toUpperCase()}`,
        subtitle: `${getClientName(sale.clientId)} • ${sale.items.length} item${sale.items.length !== 1 ? 's' : ''}`,
        amount: sale.totalAmount,
        date: sale.date,
        status: sale.paymentStatus,
        icon: 'trending-up',
        color: '#34C759'
      });
    });

    // Ajouter les achats
    purchases.forEach(purchase => {
      items.push({
        id: `purchase-${purchase.id}`,
        type: 'purchase',
        title: `Purchase #${purchase.id.slice(-4).toUpperCase()}`,
        subtitle: `${getProductName(purchase.productId)} • ${purchase.quantity} units from ${purchase.supplier}`,
        amount: purchase.totalPrice,
        date: purchase.date,
        icon: 'cube',
        color: '#007AFF'
      });
    });

    // Ajouter les paiements de dettes
    debts.forEach(debt => {
      debt.paymentHistory.forEach(payment => {
        items.push({
          id: `payment-${payment.id}`,
          type: 'payment',
          title: `Payment #${payment.id.slice(-4).toUpperCase()}`,
          subtitle: `Debt payment for ${getClientName(debt.clientId)}`,
          amount: payment.amount,
          date: payment.date,
          icon: 'card',
          color: '#FF9500'
        });
      });
    });

    // Ajouter les logs d'audit importants
    auditLogs.filter(log => ['create', 'update', 'delete', 'login'].includes(log.eventType)).forEach(log => {
      items.push({
        id: `audit-${log.id}`,
        type: 'audit',
        title: `${log.eventType.charAt(0).toUpperCase() + log.eventType.slice(1)} ${log.entityType}`,
        subtitle: log.description,
        date: log.timestamp,
        status: log.status,
        icon: log.eventType === 'create' ? 'add-circle' : 
              log.eventType === 'update' ? 'create' :
              log.eventType === 'delete' ? 'trash' : 'log-in',
        color: log.status === 'success' ? '#8E8E93' : '#FF3B30'
      });
    });

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const historyItems = createHistoryItems();

  // Filtrer les éléments
  const filteredItems = historyItems.filter(item => {
    const matchesFilter = selectedFilter === 'all' || 
                         (selectedFilter === 'sales' && item.type === 'sale') ||
                         (selectedFilter === 'purchases' && item.type === 'purchase') ||
                         (selectedFilter === 'payments' && item.type === 'payment') ||
                         (selectedFilter === 'audit' && item.type === 'audit');
    
    const matchesSearch = searchQuery === '' || 
                         item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const renderHistoryItem = ({ item }: { item: HistoryItem }) => (
    <TouchableOpacity style={styles.historyItem} activeOpacity={0.6}>
      <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon as any} size={16} color="#FFFFFF" />
      </View>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemDate}>
            {new Date(item.date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
        <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
        <View style={styles.itemFooter}>
          {item.amount && (
            <Text style={[styles.itemAmount, { color: item.type === 'purchase' ? '#FF3B30' : '#34C759' }]}>
              {item.type === 'purchase' ? '-' : '+'}{config?.currencySymbol || "$"}{item.amount.toLocaleString()}
            </Text>
          )}
          {item.status && (
            <View style={[styles.statusBadge, 
              item.status === 'success' && styles.successBadge,
              item.status === 'failure' && styles.failureBadge,
              item.status === 'full' && styles.paidBadge,
              item.status === 'debt' && styles.debtBadge,
              item.status === 'partial' && styles.partialBadge
            ]}>
              <Text style={[styles.statusText,
                (item.status === 'success' || item.status === 'full') && styles.successText,
                (item.status === 'failure' || item.status === 'debt') && styles.failureText,
                item.status === 'partial' && styles.partialText
              ]}>
                {item.status === 'full' ? 'Paid' : 
                 item.status === 'debt' ? 'Unpaid' : 
                 item.status === 'partial' ? 'Partial' :
                 item.status}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="History" />

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search history... "
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#8E8E93"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterSection}>
        {(['all', 'sales', 'purchases', 'payments', 'audit'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterTab, selectedFilter === filter && styles.filterTabActive]}
            onPress={() => setSelectedFilter(filter)}
            activeOpacity={0.6}
          >
            <Text style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* History List */}
      {filteredItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No History Found</Text>
          <Text style={styles.emptyText}>
            {searchQuery ? 'Try adjusting your search' : 'Your activity will appear here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  placeholder: {
    width: 32,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#000000",
  },
  filterSection: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
  },
  filterTabActive: {
    backgroundColor: "#007AFF",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  historyItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  itemDate: {
    fontSize: 13,
    color: "#8E8E93",
  },
  itemSubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  successBadge: {
    backgroundColor: "#34C759",
  },
  failureBadge: {
    backgroundColor: "#FF3B30",
  },
  paidBadge: {
    backgroundColor: "#34C759",
  },
  debtBadge: {
    backgroundColor: "#FF3B30",
  },
  partialBadge: {
    backgroundColor: "#FF9500",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  successText: {
    color: "#FFFFFF",
  },
  failureText: {
    color: "#FFFFFF",
  },
  partialText: {
    color: "#FFFFFF",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1E293B",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
  },
});