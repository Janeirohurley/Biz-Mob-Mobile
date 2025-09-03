import React from "react";
import { ScrollView, Text, View, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useBusiness } from "../context/BusinessContext";
import { SummaryCard } from "@/components/SummaryCard";
import { BarChartComponent } from "@/components/BarChartComponent";
import { LineChartComponent } from "@/components/LineChartComponent";
import { ListCard } from "@/components/ListCard";
import Header from "@/components/header";



export default function Reports() {
  const { sales, products, clients, config } = useBusiness();
  const router = useRouter();

  // -----------------------
  // Résumé global
  // -----------------------
  const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalProfit = sales.reduce((sum, sale) => {
    const profit = sale.items.reduce((itemSum, item) => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return itemSum;
      return itemSum + (item.unitPrice - product.purchasePrice) * item.quantity;
    }, 0);
    return sum + profit;
  }, 0);
  const saleAmounts = sales.map(s => s.totalAmount);
  const minSale = Math.min(...saleAmounts) || 0;
  const maxSale = Math.max(...saleAmounts) || 0;
  const avgSale = saleAmounts.reduce((a, b) => a + b, 0) / (saleAmounts.length || 1);
  const medianSale = [...saleAmounts].sort((a, b) => a - b)[Math.floor(saleAmounts.length / 2)] || 0;

  // -----------------------
  // Profit par produit
  // -----------------------
  const productProfits = (() => {
    const map = new Map();
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product) return;
        const profit = (item.unitPrice - product.purchasePrice) * item.quantity;
        const current = map.get(item.productId) || { quantity: 0, revenue: 0, profit: 0 };
        map.set(item.productId, {
          quantity: current.quantity + item.quantity,
          revenue: current.revenue + item.totalPrice,
          profit: current.profit + profit
        });
      });
    });
    return Array.from(map.entries())
      .map(([id, data]) => ({ id, name: products.find(p => p.id === id)?.name || "Unknown", ...data }))
      .sort((a, b) => b.profit - a.profit);
  })();

  // -----------------------
  // Analyse bivariée : Profit vs Quantité
  // -----------------------
  const quantityVsProfit = productProfits.map(p => ({ name: p.name, profit: p.profit, quantity: p.quantity }));

  // -----------------------
  // Analyse multivariée : Profit par produit par mois
  // -----------------------
  const profitByProductAndMonth = productProfits.map(p => {
    const monthlyProfits = Array(6).fill(0);
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1).getMonth();
      sales.forEach(sale => {
        sale.items.forEach(item => {
          if (item.productId === p.id) {
            const saleMonth = new Date(sale.date).getMonth();
            if (saleMonth === month) {
              const prod = products.find(pr => pr.id === item.productId);
              if (prod) monthlyProfits[5 - i] += (item.unitPrice - prod.purchasePrice) * item.quantity;
            }
          }
        });
      });
    }
    return { name: p.name, monthlyProfits };
  });

  // -----------------------
  // Top clients
  // -----------------------
  const topClients = [...clients].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header title="Reports" />
      <ScrollView style={[styles.content, { paddingBottom: Platform.OS === 'android' ? 40 : 20, }]} showsVerticalScrollIndicator={false}>
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <SummaryCard value={`${config?.currencySymbol || "$"}${totalRevenue.toLocaleString()}`} label="Total Revenue" />
          <SummaryCard value={`${config?.currencySymbol || "$"}${totalProfit.toLocaleString()}`} label="Total Profit" color="#34C759" />
        </View>
        <View style={styles.summaryRow}>
          <SummaryCard value={sales.length} label="Total Sales" />
          <SummaryCard value={avgSale.toFixed(0)} label="Avg Sale" />
        </View>
        <View style={styles.summaryRow}>
          <SummaryCard value={minSale} label="Min Sale" />
          <SummaryCard value={maxSale} label="Max Sale" />
          <SummaryCard value={medianSale} label="Median Sale" />
        </View>

        {/* Bivariate Analysis */}
        <Text style={styles.sectionTitle}>Profit vs Quantity per Product</Text>
        <BarChartComponent
          labels={quantityVsProfit.map(p => p.name)}
          data={quantityVsProfit.map(p => p.profit)}
          yAxisLabel={config?.currencySymbol || "$"}
        />

        {/* Multivariate Analysis */}
        <Text style={styles.sectionTitle}>Profit per Product (Last 6 Months)</Text>
        {profitByProductAndMonth.map(p => (
          <LineChartComponent
            key={p.name}
            labels={Array.from({ length: 6 }, (_, i) => {
              const d = new Date(); d.setMonth(d.getMonth() - 5 + i);
              return d.toLocaleDateString('en-US', { month: 'short' });
            })}
            data={p.monthlyProfits}
            color="#34C759"
            yAxisLabel={config?.currencySymbol || "$"}
          />
        ))}

        {/* Product Profits */}
        <Text style={styles.sectionTitle}>Product Profits</Text>
        <ListCard items={productProfits.map(p => ({
          id: p.id,
          name: p.name,
          subtext: `${p.quantity} sold`,
          value: `${config?.currencySymbol || "$"}${p.profit.toLocaleString()}`
        }))} />

        {/* Top Clients */}
        <Text style={styles.sectionTitle}>Top Clients</Text>
        <ListCard items={topClients.map((c, index) => ({
          id: c.id,
          name: c.name,
          subtext: `${c.purchaseCount} purchases`,
          value: `${config?.currencySymbol || "$"}${c.totalSpent.toLocaleString()}`
        }))} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F7" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, backgroundColor: "#FFF", borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  backButton: { padding: 4 },
  title: { fontSize: 18, fontWeight: "600", color: "#000" },
  placeholder: { width: 32 },
  content: { flex: 1, paddingHorizontal: 20 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12, gap: 3 },
  sectionTitle: { fontSize: 15, fontWeight: "600", marginVertical: 12, color: "#000" },
});
