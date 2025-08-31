import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBusiness } from "../../context/BusinessContext";
import { Sale } from "../../types/business";
import { useRouter } from "expo-router";
import Header from "@/components/header";

export default function Sales() {
  const { sales, config, clients, products } = useBusiness();
  const router = useRouter();
  const getClientName = (clientId: string | null) => {
    if (!clientId) return "Walk-in Customer";
    const client = clients.find(c => c.id === clientId);
    return client?.name || "Unknown Client";
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || "Unknown Product";
  };

  const renderSale = ({ item }: { item: Sale }) => {
    const clientName = getClientName(item.clientId);
    const itemsCount = item.items.reduce((sum, saleItem) => sum + saleItem.quantity, 0);

    return (
      <TouchableOpacity style={styles.saleCard} activeOpacity={0.6} onPress={() => router.push({ pathname: "/sale-detail", params: { saleId: item.id } })}>
        <View style={styles.saleHeader}>
          <View style={styles.saleLeft}>
            <Text style={styles.saleId}>Sale #{item.id.slice(-4).toUpperCase()}</Text>
            <Text style={styles.clientName}>{clientName}</Text>
            <Text style={styles.saleDate}>
              {new Date(item.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
          <View style={styles.saleRight}>
            <Text style={styles.saleAmount}>
              {config?.currencySymbol || "$"}{item.totalAmount.toLocaleString()}
            </Text>
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
        </View>

        {/* Items Summary */}
        <View style={styles.itemsSection}>
          <Text style={styles.itemsTitle}>
            {itemsCount} item{itemsCount !== 1 ? 's' : ''}:
          </Text>
          {item.items.slice(0, 2).map((saleItem, index) => (
            <Text key={index} style={styles.itemText}>
              {saleItem.quantity}x {getProductName(saleItem.productId)} - {config?.currencySymbol || "$"}{saleItem.totalPrice}
            </Text>
          ))}
          {item.items.length > 2 && (
            <Text style={styles.moreItemsText}>
              +{item.items.length - 2} more item{item.items.length - 2 !== 1 ? 's' : ''}
            </Text>
          )}
        </View>

        {/* Payment Info */}
        {item.paymentStatus !== 'full' && (
          <View style={styles.paymentInfo}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Paid:</Text>
              <Text style={styles.paymentValue}>
                {config?.currencySymbol || "$"}{item.paidAmount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Outstanding:</Text>
              <Text style={[styles.paymentValue, { color: "#FF3B30" }]}>
                {config?.currencySymbol || "$"}{item.debtAmount.toLocaleString()}
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Calculs statistiques
  const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const paidSales = sales.reduce((sum, sale) => sum + sale.paidAmount, 0);
  const outstandingSales = sales.reduce((sum, sale) => sum + sale.debtAmount, 0);
  const averageSale = sales.length > 0 ? totalSales / sales.length : 0;

  // Ventes par statut
  const paidSalesCount = sales.filter(s => s.paymentStatus === 'full').length;
  const unpaidSalesCount = sales.filter(s => s.paymentStatus === 'debt').length;
  const partialSalesCount = sales.filter(s => s.paymentStatus === 'partial').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Sales" showBack={false} right={
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/add-sale")}
          activeOpacity={0.6}
        >
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      } />

      {/* Summary Section */}
      <View style={styles.summarySection}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>
              {config?.currencySymbol || "$"}{totalSales.toLocaleString()}
            </Text>
            <Text style={styles.summaryLabel}>Total Sales</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: "#34C759" }]}>
              {config?.currencySymbol || "$"}{paidSales.toLocaleString()}
            </Text>
            <Text style={styles.summaryLabel}>Collected</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: "#FF3B30" }]}>
              {config?.currencySymbol || "$"}{outstandingSales.toLocaleString()}
            </Text>
            <Text style={styles.summaryLabel}>Outstanding</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{sales.length}</Text>
            <Text style={styles.statLabel}>Total Sales</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {config?.currencySymbol || "$"}{averageSale.toFixed(0)}
            </Text>
            <Text style={styles.statLabel}>Average Sale</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: "#34C759" }]}>{paidSalesCount}</Text>
            <Text style={styles.statLabel}>Paid</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: "#FF3B30" }]}>{unpaidSalesCount}</Text>
            <Text style={styles.statLabel}>Unpaid</Text>
          </View>
        </View>
      </View>

      {sales.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="trending-up-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Sales Yet</Text>
          <Text style={styles.emptyText}>Record your first sale to get started</Text>
        </View>
      ) : (
        <FlatList
          data={sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
          renderItem={renderSale}
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
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
    fontSize: 13,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 9,
    color: "#8E8E93",
  },
  statsRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 9,
    color: "#8E8E93",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  saleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  saleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  saleLeft: {
    flex: 1,
  },
  saleId: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  clientName: {
    fontSize: 11,
    color: "#007AFF",
    marginBottom: 4,
  },
  saleDate: {
    fontSize: 9,
    color: "#8E8E93",
  },
  saleRight: {
    alignItems: "flex-end",
  },
  saleAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 6,
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
    fontSize: 10,
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
  itemsSection: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F2F2F7",
  },
  itemsTitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 6,
  },
  itemText: {
    fontSize: 10,
    color: "#8E8E93",
    marginBottom: 2,
  },
  moreItemsText: {
    fontSize: 14,
    color: "#007AFF",
    fontStyle: "italic",
  },
  paymentInfo: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F2F2F7",
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  paymentLabel: {
    fontSize: 15,
    color: "#8E8E93",
  },
  paymentValue: {
    fontSize: 15,
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