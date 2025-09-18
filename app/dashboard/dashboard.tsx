import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBusiness } from "../../context/BusinessContext";
import HistoryItemCard from "@/components/HistoryItemCard";
import { createHistoryItems, groupByDate } from "@/utils/logicBusinness";
import { HistoryItem } from "@/types/business";
import EmptyState from "@/components/EmptyState";
import { filterItems } from "@/utils/generique/filterItems";
const StatCard = ({
  title,
  value,
  icon,
  color,
  onPress,
}: {
  title: string;
  value: string | number;
  icon: any;
  color: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.6}>
    <View style={styles.cardContent}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardValue}>{value}</Text>
      </View>
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <Ionicons name={icon} size={20} color="#FFFFFF" />
      </View>
    </View>
  </TouchableOpacity>
);

export default function Dashboard() {
  const { config, products, sales, clients, debts, purchases } = useBusiness();
  const router = useRouter();

  // Calculs basés sur les vraies données
  const totalProducts = products.length;
  const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalClients = clients.length;
  const totalDebts = debts.reduce((sum, debt) => {
    const totalPaid = debt.paymentHistory.reduce((paidSum, payment) => paidSum + payment.amount, 0);
    return sum + Math.max(0, debt.amount - totalPaid);
  }, 0);
  const totalCollected = totalSales - totalDebts

  const lowStockProducts = products.filter((p) => p.stock < 10);
  const unpaidDebts = debts.filter((d) => {
    const totalPaid = d.paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
    return totalPaid < d.amount;
  });

  // Statistiques avancées
  const todaySales = sales.filter(sale => {
    const today = new Date().toDateString();
    return new Date(sale.date).toDateString() === today;
  });
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);

  const topClient = clients.reduce((top, client) =>
    client.totalSpent > (top?.totalSpent || 0) ? client : top, null as any
  );
  const historyItems = createHistoryItems(
    { sales, purchases, debts, clients, products }
  );

  const filteredItems = filterItems<HistoryItem>({
    items: historyItems,
    typeField: "type",
    searchFields: ["title", "subtitle", "status"],
    filterMapping: {
      sales: "sale",
      purchases: "purchase",
      payments: "payment",
      audit: "audit",
    },
    start: 0,
    end: 10
  });



  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Good morning</Text>
          <Text style={styles.subtitle}>{config?.userName || "User"}</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            title="Total Sales"
            value={`${config?.currencySymbol || "$"}${totalSales.toLocaleString()}`}
            icon="trending-up"
            color="#34C759"
          />
          <StatCard
            title="Products"
            value={totalProducts}
            icon="cube"
            color="#007AFF"
          />
          <StatCard
            title="Collected Amount"
            value={totalCollected}
            icon="wallet-outline"
            color="#FF9500"
          />
          <StatCard
            title="Outstanding"
            value={`${config?.currencySymbol || "$"}${totalDebts.toLocaleString()}`}
            icon="help-outline"
            color="#FF3B30"
          />
        </View>

        {/* Today's Performance */}
        <View style={styles.todaySection}>
          <Text style={styles.sectionTitle}>Today's Performance</Text>
          <View style={styles.todayCard}>
            <View style={styles.todayItem}>
              <Text style={styles.todayLabel}>Sales Today</Text>
              <Text style={styles.todayValue}>{todaySales.length}</Text>
            </View>
            <View style={styles.todayItem}>
              <Text style={styles.todayLabel}>Revenue Today</Text>
              <Text style={styles.todayValue}>
                {config?.currencySymbol || "$"}{todayRevenue.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Top Client */}
        {topClient && (
          <View style={styles.topClientSection}>
            <Text style={styles.sectionTitle}>Top Client</Text>
            <View style={styles.topClientCard}>
              <View style={styles.clientAvatar}>
                <Text style={styles.clientAvatarText}>
                  {topClient.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{topClient.name}</Text>
                <Text style={styles.clientStats}>
                  {topClient.purchaseCount} purchases • {config?.currencySymbol || "$"}{topClient.totalSpent.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Alerts */}
        {(lowStockProducts.length > 0 || unpaidDebts.length > 0) && (
          <View style={styles.alertsSection}>
            <Text style={styles.sectionTitle}>Alerts</Text>
            {lowStockProducts.length > 0 && (
              <View style={styles.alertCard}>
                <View style={styles.alertIcon}>
                  <Ionicons name="warning" size={16} color="#FF9500" />
                </View>
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>Low Stock Alert</Text>
                  <Text style={styles.alertText}>
                    {lowStockProducts.length} product{lowStockProducts.length > 1 ? "s" : ""} running low
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
              </View>
            )}
            {unpaidDebts.length > 0 && (
              <TouchableOpacity style={styles.alertCard} onPress={() => router.push("/debts")}>
                <View style={styles.alertIcon}>
                  <Ionicons name="time" size={16} color="#FF3B30" />
                </View>
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>Payment Due</Text>
                  <Text style={styles.alertText}>
                    {unpaidDebts.length} payment{unpaidDebts.length > 1 ? "s" : ""} overdue
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionButton} activeOpacity={0.6} onPress={() => router.push('/add-sale')}>
              <View style={[styles.actionIcon, { backgroundColor: "#34C759" }]}>
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>New Sale</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} activeOpacity={0.6} onPress={() => router.push('/add-product')}>
              <View style={[styles.actionIcon, { backgroundColor: "#007AFF" }]}>
                <Ionicons name="cube" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>Add Product</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionButton} activeOpacity={0.6} onPress={() => router.push("/reports")}>
              <View style={[styles.actionIcon, { backgroundColor: "#5856D6" }]}>
                <Ionicons name="bar-chart" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>Reports</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* dernier operation recente */}
        <View style={{ flex: 1 }}>
          {filteredItems.length === 0 ? (
            <EmptyState
              iconName="time-outline"
              iconSize={64}
              iconColor="#CBD5E1"
              title="No Recently activity availible"
            />
          ) : (
            <SectionList
                sections={groupByDate({
                  items: filteredItems,
                  dateField: "date",
                  locale: "fr-FR",
                })}
              keyExtractor={(item: HistoryItem) => item.id}
              renderItem={({ item }) => (
                <HistoryItemCard item={item} currencySymbol={config?.currencySymbol} />
              )}
              renderSectionHeader={({ section: { title } }) => (
                <Text style={styles.sectionHeader}>{title}</Text>
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingBottom: Platform.OS === "android" ? 40 : 20,
              }}
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: "#8E8E93",
  },
  statsGrid: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 32,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLeft: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 13,
    color: "#8E8E93",
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  todaySection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12,
  },
  todayCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  todayItem: {
    alignItems: "center",
  },
  todayLabel: {
    fontSize: 13,
    color: "#8E8E93",
    marginBottom: 4,
  },
  todayValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
  },
  topClientSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  topClientCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  clientAvatarText: {
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
  },
  alertsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  alertCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  alertIcon: {
    width: 20,
    height: 20,
    borderRadius: 14,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 2,
  },
  alertText: {
    fontSize: 13,
    color: "#8E8E93",
  },
  quickActions: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 13,
    alignItems: "center",
  },
  actionIcon: {
    width: 35,
    height: 35,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#000000",
  },
  resetButton: {
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  resetText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#FF3B30",
  },

  sectionHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
  },
});