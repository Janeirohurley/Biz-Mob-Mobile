import Header from "@/components/header";
import { useBusiness } from "@/context/BusinessContext";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProductDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { products, purchases, config, deleteProduct } = useBusiness();
  const product = products.find((p) => p.id === id);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
          <Text style={styles.notFound}>Product not found</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleDelete = async () => {
    Alert.alert(
      "Delete Product",
      `Are you sure you want to delete ${product.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            await deleteProduct(product.id);
            setIsDeleting(false);
            router.replace("/dashboard/products");
          },
        },
      ]
    );
  };

  const profit = product.salePrice - product.purchasePrice;
  const profitMargin = product.initiStock?product.initiStock:'N/A' 
  const totalValue = product.stock * product.purchasePrice;

  // récupérer les achats liés à ce produit
  const productPurchases = purchases.filter((p) => p.productId === product.id);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <Header
        title={product.name}
        right={
          <TouchableOpacity
            style={styles.headerAction}
            onPress={() =>
              router.push({ pathname: "/add-product", params: { id: product.id } })
            }
          >
            <Text style={styles.headerActionText}>Edit</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Stock & Value */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="cube-outline" size={20} color="#64748B" />
            <Text style={styles.cardTitle}>Stock</Text>
          </View>
          <View style={styles.row}>
            <Stat label="In Stock" value={`${product.stock} units`} danger={product.stock < 10} />
            <Stat
              label="Stock Value"
              value={`${config?.currencySymbol || "$"}${totalValue.toLocaleString()}`}
            />
          </View>
        </View>

        {/* Pricing */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="pricetag-outline" size={20} color="#64748B" />
            <Text style={styles.cardTitle}>Pricing</Text>
          </View>
          <View style={styles.rowWrap}>
            <Stat
              label="Purchased"
              value={`${config?.currencySymbol || "$"}${product.purchasePrice.toLocaleString()}`}
            />
            <Stat
              label="Sale Price"
              value={`${config?.currencySymbol || "$"}${product.salePrice.toLocaleString()}`}
              color="#007AFF"
            />
            <Stat
              label="Profit"
              value={`${config?.currencySymbol || "$"}${profit.toLocaleString()}`}
              color="#34C759"
            />
            <Stat label="Total" value={`${config?.currencySymbol}${profitMargin}`} color="#5856D6" />
          </View>
        </View>

        {/* Supplier */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="business-outline" size={20} color="#64748B" />
            <Text style={styles.cardTitle}>Supplier</Text>
          </View>
          {product.supplier ? (
            <View style={styles.supplierInfo}>
              <Text style={styles.supplierName}>{product.supplier}</Text>
              <TouchableOpacity style={styles.secondaryButton}>
                <Ionicons name="call-outline" size={18} color="#007AFF" />
                <Text style={styles.secondaryButtonText}>Contact</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.emptyText}>No supplier specified</Text>
          )}
        </View>

        {/* Purchase History */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="receipt-outline" size={20} color="#64748B" />
            <Text style={styles.cardTitle}>Purchase History</Text>
          </View>
          {productPurchases.length > 0 ? (
            productPurchases.map((purchase) => (
              <View key={purchase.id} style={styles.purchaseItem}>
                <Text style={styles.purchaseDate}>
                  {new Date(purchase.date).toLocaleDateString()}
                </Text>
                <Text style={styles.purchaseDetail}>
                  {purchase.quantity} × {config?.currencySymbol || "$"}
                  {purchase.purchasePrice.toLocaleString()} ={" "}
                  <Text style={styles.purchaseTotal}>
                    {config?.currencySymbol || "$"}
                    {purchase.totalPrice.toLocaleString()}
                  </Text>
                </Text>
                <Text style={styles.purchaseSupplier}>{purchase.supplier}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No purchases recorded</Text>
          )}
        </View>

        {/* Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle-outline" size={20} color="#64748B" />
            <Text style={styles.cardTitle}>Details</Text>
          </View>
          <View style={styles.rowWrap}>
            <Stat label="SKU" value={product.id.slice(0, 8)} />
            <Stat
              label="Added On"
              value={new Date(product.createdAt).toLocaleDateString()}
            />
            <Stat
              label="Last Updated"
              value={new Date(product.updatedAt).toLocaleDateString()}
            />
          </View>
        </View>

        {/* Delete */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={isDeleting}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          <Text style={styles.deleteText}>
            {isDeleting ? "Deleting..." : "Delete Product"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// small stat subcomponent for reusability
const Stat = ({
  label,
  value,
  color,
  danger,
}: {
  label: string;
  value: string;
  color?: string;
  danger?: boolean;
}) => (
  <View style={{ flex: 1, marginBottom: 12 }}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text
      style={[
        styles.statValue,
        color ? { color } : null,
        danger ? { color: "#FF3B30" } : null,
      ]}
    >
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F7" },
  scrollContent: { padding: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#000" },
  headerAction: { flexDirection: "row", alignItems: "center" },
  headerActionText: { fontSize: 16, color: "#007AFF", marginLeft: 4 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  cardTitle: { marginLeft: 8, fontSize: 16, fontWeight: "600", color: "#111" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  statLabel: { fontSize: 13, color: "#8E8E93", marginBottom: 4 },
  statValue: { fontSize: 13, fontWeight: "600", color: "#111" },
  supplierInfo: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  supplierName: { fontSize: 16, fontWeight: "500", color: "#111" },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  secondaryButtonText: { marginLeft: 6, fontSize: 15, color: "#007AFF" },
  purchaseItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#EEE" },
  purchaseDate: { fontSize: 14, fontWeight: "600", color: "#000" },
  purchaseDetail: { fontSize: 14, color: "#333", marginTop: 2 },
  purchaseTotal: { fontWeight: "600", color: "#111" },
  purchaseSupplier: { fontSize: 13, color: "#666", marginTop: 2 },
  deleteButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF0F0",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 16,
    marginBottom: 32,
  },
  deleteText: { marginLeft: 8, fontSize: 16, fontWeight: "600", color: "#FF3B30" },
  primaryButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFound: { fontSize: 18, fontWeight: "500", color: "#FF3B30", marginTop: 8 },
  emptyText: { fontSize: 14, color: "#8E8E93", fontStyle: "italic" },
});
