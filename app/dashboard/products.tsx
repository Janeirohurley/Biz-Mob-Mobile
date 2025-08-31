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
import { Product } from "../../types/business";

export default function Products() {
  const { products, config } = useBusiness();
  const router = useRouter();

  const renderProduct = ({ item }: { item: Product }) => {
    const profit = item.salePrice - item.purchasePrice;
    const profitMargin = ((profit / item.purchasePrice) * 100).toFixed(1);
    const totalValue = item.stock * item.purchasePrice;
    
    return (
      <TouchableOpacity 
        style={styles.productCard} 
        activeOpacity={0.6}
        onPress={() => router.push({ pathname: "/product-details", params: { id: item.id } })}
      >
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{item.name}</Text>
          <View style={[styles.stockBadge, item.stock < 10 && styles.lowStockBadge]}>
            <Text style={[styles.stockText, item.stock < 10 && styles.lowStockText]}>
              {item.stock}
            </Text>
          </View>
        </View>
        
        <View style={styles.priceRow}>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Cost</Text>
            <Text style={styles.priceValue}>
              {config?.currencySymbol || "$"}{item.purchasePrice.toLocaleString()}
            </Text>
          </View>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Sell</Text>
            <Text style={styles.salePriceValue}>
              {config?.currencySymbol || "$"}{item.salePrice.toLocaleString()}
            </Text>
          </View>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Profit</Text>
            <Text style={styles.profitValue}>
              {config?.currencySymbol || "$"}{profit.toLocaleString()}
            </Text>
          </View>
        </View>
        
        <View style={styles.productFooter}>
          <Text style={styles.marginText}>
            Margin: {profitMargin}%
          </Text>
          <Text style={styles.valueText}>
            Stock Value: {config?.currencySymbol || "$"}{totalValue.toLocaleString()}
          </Text>
        </View>
        
        <Text style={styles.dateText}>
          Added: {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </TouchableOpacity>
    );
  };

  const totalStockValue = products.reduce((sum, product) => 
    sum + (product.stock * product.purchasePrice), 0
  );
  
  const lowStockCount = products.filter(p => p.stock < 10).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Products</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/add-product')}
          activeOpacity={0.6}
        >
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summarySection}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{products.length}</Text>
            <Text style={styles.summaryLabel}>Total Products</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: "#FF9500" }]}>
              {lowStockCount}
            </Text>
            <Text style={styles.summaryLabel}>Low Stock</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: "#FF3B30" }]}>
              {outOfStockCount}
            </Text>
            <Text style={styles.summaryLabel}>Out of Stock</Text>
          </View>
        </View>
        
        <View style={styles.valueCard}>
          <Text style={styles.valueLabel}>Total Stock Value</Text>
          <Text style={styles.totalValue}>
            {config?.currencySymbol || "$"}{totalStockValue.toLocaleString()}
          </Text>
        </View>
      </View>

      {products.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cube-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Products Yet</Text>
          <Text style={styles.emptyText}>Add your first product to get started</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
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
    fontSize: 15,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 10,
    color: "#8E8E93",
  },
  valueCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  valueLabel: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#34C759",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  productName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
    flex: 1,
  },
  stockBadge: {
    backgroundColor: "#34C759",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: "center",
  },
  lowStockBadge: {
    backgroundColor: "#FF3B30",
  },
  stockText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  lowStockText: {
    color: "#FFFFFF",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  priceItem: {
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 10,
    color: "#8E8E93",
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 12,
    fontWeight: "500",
    color: "#000000",
  },
  salePriceValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#007AFF",
  },
  profitValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#34C759",
  },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F2F2F7",
    marginBottom: 8,
  },
  marginText: {
    fontSize: 13,
    color: "#8E8E93",
  },
  valueText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#000000",
  },
  dateText: {
    fontSize: 9,
    color: "#C7C7CC",
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