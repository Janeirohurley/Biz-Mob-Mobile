import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBusiness } from "../context/BusinessContext";
import Header from "@/components/header";
import { Debt, Sale } from "@/types/business";

export default function ClientDetails() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const router = useRouter();
  const { clients, sales, debts, config, products, deleteClient } = useBusiness();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'sales' | 'debts'>('overview');

  const client = clients.find(c => c.id === clientId);
  const clientSales = sales.filter(sale => sale.clientId === clientId);
  const clientDebts = debts.filter(debt => debt.clientId === clientId);
  const formatDate = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };


  if (!client) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Client not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || "Unknown Product";
  };

  const getOutstandingDebt = () => {
    return clientDebts.reduce((total, debt) => {
      const totalPaid = debt.paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
      return total + Math.max(0, debt.amount - totalPaid);
    }, 0);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleDeleteClient = () => {
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to delete client ${client.name}? This will also delete all associated sales and debts.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteClient(clientId);
            Alert.alert("Success", "Client deleted successfully!");
            router.back();
          },
        },
      ]
    );
  };

  const outstandingDebt = getOutstandingDebt();
  const averageOrderValue = clientSales.length > 0 ? client.totalSpent / clientSales.length : 0;
  const lastSale = clientSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const renderSale = ({ item }: { item: Sale }) => (
    <TouchableOpacity style={styles.listItem} activeOpacity={0.6}>
      <View style={styles.listItemHeader}>
        <Text style={styles.listItemTitle}>Sale #{item.id.slice(-4).toUpperCase()}</Text>
        <Text style={styles.listItemAmount}>
          {config?.currencySymbol || "$"}{item.totalAmount.toLocaleString()}
        </Text>
      </View>
      <Text style={styles.listItemSubtitle}>
        {item.items.length} item{item.items.length !== 1 ? 's' : ''} • {new Date(item.date).toLocaleDateString()}
      </Text>
      <View style={styles.listItemFooter}>
        <View style={[styles.statusBadge,
        item.paymentStatus === 'full' && styles.paidBadge,
        item.paymentStatus === 'debt' && styles.debtBadge,
        item.paymentStatus === 'partial' && styles.partialBadge
        ]}>
          <Text style={[styles.statusText,
          item.paymentStatus === 'full' && styles.paidText,
          item.paymentStatus === 'debt' && styles.debtText,
          item.paymentStatus === 'partial' && styles.partialText
          ]}>
            {item.paymentStatus === 'full' ? 'Paid' :
              item.paymentStatus === 'debt' ? 'Unpaid' : 'Partial'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderDebt = ({ item }: { item: Debt }) => {
    const totalPaid = item.paymentHistory.reduce((sum: number, payment: any) => sum + payment.amount, 0);
    const remaining = Math.max(0, item.amount - totalPaid);

    return (
      <TouchableOpacity style={styles.listItem} activeOpacity={0.6}>
        <View style={styles.listItemHeader}>
          <Text style={styles.listItemTitle}>Debt #{item.id.slice(-4).toUpperCase()}</Text>
          <Text style={[styles.listItemAmount, { color: remaining > 0 ? "#FF3B30" : "#34C759" }]}>
            {config?.currencySymbol || "$"}{remaining.toLocaleString()}
          </Text>
        </View>
        <Text style={styles.listItemSubtitle}>
          Created: {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        <View style={styles.debtProgress}>
          <Text style={styles.debtProgressText}>
            Paid: {config?.currencySymbol || "$"}{totalPaid.toLocaleString()} of {config?.currencySymbol || "$"}{item.amount.toLocaleString()}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${(totalPaid / item.amount) * 100}%` }]}
            />
          </View>
        </View>
        {item.paymentHistory.length > 0 && (
          <View style={styles.paymentHistory}>
            <Text style={styles.sectionTitle}>Payment History</Text>
            {item.paymentHistory.map((payment) => (
              <View key={payment.id} style={styles.paymentItem}>
                <Text style={styles.paymentText}>
                  {formatDate(payment.date)}: {config?.currencySymbol || "$"}{payment.amount.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Client Details"
        right={
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteClient}
              activeOpacity={0.6}
              accessibilityLabel={`Delete client ${client.name}`}
            >
              <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        }
      />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Client Profile */}
        <View style={styles.profileSection}>
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{getInitials(client.name)}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.clientName}>{client.name}</Text>
              <Text style={styles.clientSince}>
                Customer since {new Date(client.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                })}
              </Text>
              {lastSale && (
                <Text style={styles.lastActivity}>
                  Last purchase: {new Date(lastSale.date).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{client.purchaseCount}</Text>
              <Text style={styles.statLabel}>Total Orders</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {config?.currencySymbol || "$"}{client.totalSpent.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {config?.currencySymbol || "$"}{averageOrderValue.toFixed(0)}
              </Text>
              <Text style={styles.statLabel}>Avg. Order</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: outstandingDebt > 0 ? "#FF3B30" : "#34C759" }]}>
                {config?.currencySymbol || "$"}{outstandingDebt.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Outstanding</Text>
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabSection}>
          {(['overview', 'sales', 'debts'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.tabActive]}
              onPress={() => setSelectedTab(tab)}
              activeOpacity={0.6}
            >
              <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'sales' && ` (${clientSales.length})`}
                {tab === 'debts' && ` (${clientDebts.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {selectedTab === 'overview' && (
            <View style={styles.overviewContent}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              {clientSales.slice(0, 3).map((sale, index) => (
                <View key={sale.id} style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <Ionicons name="trending-up" size={16} color="#34C759" />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>
                      Purchase of {config?.currencySymbol || "$"}{sale.totalAmount.toLocaleString()}
                    </Text>
                    <Text style={styles.activityDate}>
                      {new Date(sale.date).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))}

              {outstandingDebt > 0 && (
                <View style={styles.debtAlert}>
                  <Ionicons name="warning" size={20} color="#FF9500" />
                  <Text style={styles.debtAlertText}>
                    This client has {config?.currencySymbol || "$"}{outstandingDebt.toLocaleString()} in outstanding debt
                  </Text>
                </View>
              )}
            </View>
          )}

          {selectedTab === 'sales' && (
            <FlatList
              data={clientSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
              renderItem={renderSale}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No sales found</Text>
                </View>
              }
            />
          )}

          {selectedTab === 'debts' && (
            <FlatList
              data={clientDebts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())}
              renderItem={renderDebt}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No debts found</Text>
                </View>
              }
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  content: {
    flex: 1,
  },
  profileSection: {
    padding: 20,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 45,
    height: 45,
    borderRadius: 30,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  avatarText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  profileInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },
  clientSince: {
    fontSize: 10,
    color: "#8E8E93",
    marginBottom: 2,
  },
  lastActivity: {
    fontSize: 15,
    color: "#007AFF",
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: "#8E8E93",
  },
  tabSection: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#007AFF",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#000000",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  overviewContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 13,
    color: "#8E8E93",
  },
  debtAlert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  debtAlertText: {
    fontSize: 15,
    color: "#E65100",
    marginLeft: 8,
    flex: 1,
  },
  listItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  listItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  listItemAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#34C759",
  },
  listItemSubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 8,
  },
  listItemFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
  paidText: {
    color: "#FFFFFF",
  },
  debtText: {
    color: "#FFFFFF",
  },
  partialText: {
    color: "#FFFFFF",
  },
  debtProgress: {
    marginTop: 8,
  },
  debtProgressText: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#F2F2F7",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#34C759",
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: "#8E8E93",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    color: "#FF3B30",
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 22,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
  },
  paymentHistory: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  paymentItem: {
    marginBottom: 6,
  },
  paymentText: {
    fontSize: 12,
    color: "#000000",
  },
  paymentBox: {
    marginTop: 12,
  },  
  subText: {
    fontSize: 12,
    color: "#8E8E93",
  },
});