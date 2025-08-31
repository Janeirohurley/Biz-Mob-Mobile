import Header from "@/components/header";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBusiness } from "../../context/BusinessContext";
import { Client } from "../../types/business";

export default function Clients() {
  const { clients, config, sales, debts } = useBusiness();
  const router = useRouter();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getAvatarColor = (id: string) => {
    const colors = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#5856D6', '#AF52DE'];
    const index = parseInt(id) % colors.length;
    return colors[index];
  };

  const getClientSales = (clientId: string) => {
    return sales.filter(sale => sale.clientId === clientId);
  };

  const getClientDebts = (clientId: string) => {
    return debts.filter(debt => debt.clientId === clientId);
  };

  const getOutstandingDebt = (clientId: string) => {
    const clientDebts = getClientDebts(clientId);
    return clientDebts.reduce((total, debt) => {
      const totalPaid = debt.paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
      return total + Math.max(0, debt.amount - totalPaid);
    }, 0);
  };

  const renderClient = ({ item }: { item: Client }) => {
    const clientSales = getClientSales(item.id);
    const outstandingDebt = getOutstandingDebt(item.id);
    const lastSale = clientSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    return (
      <TouchableOpacity style={styles.clientCard} activeOpacity={0.6} onPress={() => router.push(`/client-details?clientId=${item.id}`)}>
        <View style={styles.clientHeader}>
          <View style={[styles.avatarContainer, { backgroundColor: getAvatarColor(item.id) }]}>
            <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
          </View>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{item.name}</Text>
            <Text style={styles.clientStats}>
              {item.purchaseCount} purchase{item.purchaseCount !== 1 ? 's' : ''} • {config?.currencySymbol || "$"}{item.totalSpent.toLocaleString()} total
            </Text>
            <Text style={styles.clientDate}>
              Customer since {new Date(item.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric'
              })}
            </Text>
            {lastSale && (
              <Text style={styles.lastSaleText}>
                Last purchase: {new Date(lastSale.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </Text>
            )}
          </View>
          <View style={styles.clientRight}>
            {outstandingDebt > 0 ? (
              <View style={styles.debtBadge}>
                <Ionicons name="time" size={12} color="#FFFFFF" />
                <Text style={styles.debtText}>
                  {config?.currencySymbol || "$"}{outstandingDebt.toLocaleString()}
                </Text>
              </View>
            ) : (
              <View style={styles.paidBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#34C759" />
              </View>
            )}
          </View>
        </View>

        {/* Client Performance */}
        <View style={styles.performanceSection}>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Average Order</Text>
            <Text style={styles.performanceValue}>
              {config?.currencySymbol || "$"}{item.purchaseCount > 0 ? (item.totalSpent / item.purchaseCount).toFixed(0) : '0'}
            </Text>
          </View>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Total Debt</Text>
            <Text style={[styles.performanceValue, { color: outstandingDebt > 0 ? "#FF3B30" : "#34C759" }]}>
              {config?.currencySymbol || "$"}{outstandingDebt.toLocaleString()}
            </Text>
          </View>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Status</Text>
            <Text style={[styles.performanceValue, {
              color: outstandingDebt > 0 ? "#FF3B30" : "#34C759",
              fontSize: 13
            }]}>
              {outstandingDebt > 0 ? "Has Debt" : "Clear"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Calculs statistiques
  const totalClients = clients.length;
  const clientsWithDebt = clients.filter(c => getOutstandingDebt(c.id) > 0).length;
  const totalDebt = clients.reduce((sum, client) => sum + getOutstandingDebt(client.id), 0);
  const totalRevenue = clients.reduce((sum, client) => sum + client.totalSpent, 0);
  const averageSpending = clients.length > 0 ? totalRevenue / clients.length : 0;

  // Top clients
  const topClients = [...clients].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 3);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Clients" showBack={false} />

      {/* Summary Section */}
      <View style={styles.summarySection}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{totalClients}</Text>
            <Text style={styles.summaryLabel}>Total Clients</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: clientsWithDebt > 0 ? "#FF3B30" : "#34C759" }]}>
              {clientsWithDebt}
            </Text>
            <Text style={styles.summaryLabel}>With Debt</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: totalDebt > 0 ? "#FF3B30" : "#34C759" }]}>
              {config?.currencySymbol || "$"}{totalDebt.toLocaleString()}
            </Text>
            <Text style={styles.summaryLabel}>Total Debt</Text>
          </View>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Revenue</Text>
              <Text style={styles.statValue}>
                {config?.currencySymbol || "$"}{totalRevenue.toLocaleString()}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Average Spending</Text>
              <Text style={styles.statValue}>
                {config?.currencySymbol || "$"}{averageSpending.toFixed(0)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {clients.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Clients Yet</Text>
          <Text style={styles.emptyText}>Add your first client to get started</Text>
        </View>
      ) : (
        <FlatList
          data={clients.sort((a, b) => b.totalSpent - a.totalSpent)}
          renderItem={renderClient}
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  summarySection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 10,
    color: "#8E8E93",
  },
  statsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#8E8E93",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  clientCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  clientHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  avatarContainer: {
    width: 45,
    height: 45,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  clientStats: {
    fontSize: 13,
    color: "#8E8E93",
    marginBottom: 2,
  },
  clientDate: {
    fontSize: 12,
    color: "#C7C7CC",
    marginBottom: 2,
  },
  lastSaleText: {
    fontSize: 12,
    color: "#007AFF",
  },
  clientRight: {
    alignItems: "center",
    justifyContent: "center",
  },
  debtBadge: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  debtText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  paidBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  performanceSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F2F2F7",
  },
  performanceItem: {
    alignItems: "center",
  },
  performanceLabel: {
    fontSize: 11,
    color: "#8E8E93",
    marginBottom: 4,
  },
  performanceValue: {
    fontSize: 13,
    fontWeight: "500",
    color: "#000000",
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