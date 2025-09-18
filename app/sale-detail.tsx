import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBusiness } from "@/context/BusinessContext";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import Header from "@/components/header";

export default function SaleDetail() {
    const { sales, config, clients, getProductById, deleteSale } = useBusiness();
    const route = useRoute();
    const navigation = useNavigation();
    const { saleId } = route.params as { saleId: string };
    const router = useRouter();
    const sale = sales.find((s) => s.id === saleId);

    if (!sale) {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <View style={styles.emptyState}>
                    <Ionicons name="alert-circle-outline" size={64} color="#CBD5E1" />
                    <Text style={styles.emptyTitle}>Sale Not Found</Text>
                    <Text style={styles.emptyText}>The requested sale does not exist.</Text>
                </View>
            </SafeAreaView>
        );
    }

    const getClientName = (clientId: string | null) => {
        if (!clientId) return "Walk-in Customer";
        const client = clients.find((c) => c.id === clientId);
        return client?.name || "Unknown Client";
    };

    const getProductName = (productId: string) => {
        const product = getProductById(productId);
        return product?.name || "Unknown Product";
    };

    const handleDeleteSale = () => {
        Alert.alert(
            "Confirm Deletion",
            `Are you sure you want to delete Sale #${sale.id.slice(-4).toUpperCase()}?`,
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        deleteSale(saleId);
                        Alert.alert("Success", "Sale deleted successfully!");
                        router.back();
                    },
                },
            ]
        );
    };

    const itemsCount = sale.items.reduce((sum, saleItem) => sum + saleItem.quantity, 0);

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <Header
                title={`Sale #${sale.id.slice(-4).toUpperCase()}`}
                right={
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => router.push({ pathname: "/add-sale", params: { saleId } })}
                        >
                            <Ionicons name="create-outline" size={22} color="#007AFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={handleDeleteSale}
                        >
                            <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                }
            />

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.saleCard}>
                    {/* Infos Client et Montant */}
                    <View style={styles.saleHeader}>
                        <View style={styles.saleLeft}>
                            <Text style={styles.clientName}>{getClientName(sale.clientId)}</Text>
                            <Text style={styles.saleDate}>
                                {new Date(sale.date).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </Text>
                        </View>
                        <View style={styles.saleRight}>
                            <Text style={styles.saleAmount}>
                                {config?.currencySymbol || "$"}{sale.totalAmount.toLocaleString()}
                            </Text>
                            <View style={[
                                styles.statusBadge,
                                sale.paymentStatus === "full" && styles.paidBadge,
                                sale.paymentStatus === "debt" && styles.debtBadge,
                                sale.paymentStatus === "partial" && styles.partialBadge,
                            ]}>
                                <Text style={styles.statusText}>
                                    {sale.paymentStatus === "full"
                                        ? "Paid"
                                        : sale.paymentStatus === "debt"
                                            ? "Unpaid"
                                            : "Partial"}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Liste des Produits */}
                    <View style={styles.itemsSection}>
                        <Text style={styles.itemsTitle}>
                            {itemsCount} item{itemsCount !== 1 ? "s" : ""}:
                        </Text>
                        {sale.items.map((item, index) => (
                            <View key={index} style={styles.itemRow}>
                                <Text style={styles.itemName}>
                                    {item.quantity}× {getProductName(item.productId)}
                                </Text>
                                <Text style={styles.itemPrice}>
                                    {config?.currencySymbol || "$"}{item.totalPrice.toLocaleString()}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Paiement */}
                    {sale.paymentStatus !== "full" && (
                        <View style={styles.paymentInfo}>
                            <View style={styles.paymentRow}>
                                <Text style={styles.paymentLabel}>Paid:</Text>
                                <Text style={styles.paymentValue}>
                                    {config?.currencySymbol || "$"}{sale.paidAmount.toLocaleString()}
                                </Text>
                            </View>
                            <View style={styles.paymentRow}>
                                <Text style={styles.paymentLabel}>Outstanding:</Text>
                                <Text style={[styles.paymentValue, { color: "#FF3B30" }]}>
                                    {config?.currencySymbol || "$"}{sale.debtAmount.toLocaleString()}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F2F2F7",
    },
    content: {
        paddingHorizontal: 16,
        paddingVertical: 20,
    },
    saleCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: "white",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0,
        shadowRadius: 4,
        elevation: 2,
    },

    // HEADER (client + date + montant + statut)
    saleHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 16,
    },
    saleLeft: {
        flex: 1,
    },
    clientName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#007AFF",
        marginBottom: 4,
    },
    saleDate: {
        fontSize: 13,
        color: "#8E8E93",
    },
    saleRight: {
        alignItems: "flex-end",
    },
    saleAmount: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 6,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    paidBadge: { backgroundColor: "#34C759" },
    debtBadge: { backgroundColor: "#FF3B30" },
    partialBadge: { backgroundColor: "#FF9500" },
    statusText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#FFFFFF",
        textTransform: "uppercase",
    },

    // PRODUITS
    itemsSection: {
        marginBottom: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#F2F2F7",
    },
    itemsTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
    },
    itemRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6,
    },
    itemName: {
        fontSize: 14,
        color: "#111827",
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: "500",
        color: "#374151",
    },

    // PAIEMENT
    paymentInfo: {
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#F2F2F7",
        marginTop: 8,
    },
    paymentRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6,
    },
    paymentLabel: {
        fontSize: 14,
        color: "#6B7280",
    },
    paymentValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
    },

    // EMPTY STATE
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
        fontSize: 15,
        color: "#64748B",
        textAlign: "center",
    },

    // ACTION BUTTONS
    actionButtons: {
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
    },
    editButton: {
        width: 40,
        height: 40,
        borderRadius: 22,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    deleteButton: {
        width: 40,
        height: 40,
        borderRadius: 22,
        backgroundColor: "#FF3B30",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
});
