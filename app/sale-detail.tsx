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
                            activeOpacity={0.6}
                            accessibilityLabel="Edit sale"
                        >
                            <Ionicons name="create-outline" size={24} color="#007AFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={handleDeleteSale}
                            activeOpacity={0.6}
                            accessibilityLabel={`Delete sale ${sale.id.slice(-4).toUpperCase()}`}
                        >
                            <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                }
            />
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.saleCard}>
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
                                {config?.currencySymbol || "$"}
                                {sale.totalAmount.toLocaleString()}
                            </Text>
                            <View
                                style={[
                                    styles.statusBadge,
                                    sale.paymentStatus === "full" && styles.paidBadge,
                                    sale.paymentStatus === "debt" && styles.debtBadge,
                                    sale.paymentStatus === "partial" && styles.partialBadge,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.statusText,
                                        sale.paymentStatus === "full" && styles.paidText,
                                        sale.paymentStatus === "debt" && styles.debtText,
                                        sale.paymentStatus === "partial" && styles.partialText,
                                    ]}
                                >
                                    {sale.paymentStatus === "full"
                                        ? "Paid"
                                        : sale.paymentStatus === "debt"
                                            ? "Unpaid"
                                            : "Partial"}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Items Section */}
                    <View style={styles.itemsSection}>
                        <Text style={styles.itemsTitle}>
                            {itemsCount} item{itemsCount !== 1 ? "s" : ""}:
                        </Text>
                        {sale.items.map((saleItem, index) => (
                            <Text key={index} style={styles.itemText}>
                                {saleItem.quantity}x {getProductName(saleItem.productId)} @{" "}
                                {config?.currencySymbol || "$"}
                                {saleItem.unitPrice.toLocaleString()} - {config?.currencySymbol || "$"}
                                {saleItem.totalPrice.toLocaleString()}
                            </Text>
                        ))}
                    </View>

                    {/* Payment Info */}
                    {sale.paymentStatus !== "full" && (
                        <View style={styles.paymentInfo}>
                            <View style={styles.paymentRow}>
                                <Text style={styles.paymentLabel}>Paid:</Text>
                                <Text style={styles.paymentValue}>
                                    {config?.currencySymbol || "$"}
                                    {sale.paidAmount.toLocaleString()}
                                </Text>
                            </View>
                            <View style={styles.paymentRow}>
                                <Text style={styles.paymentLabel}>Outstanding:</Text>
                                <Text style={[styles.paymentValue, { color: "#FF3B30" }]}>
                                    {config?.currencySymbol || "$"}
                                    {sale.debtAmount.toLocaleString()}
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
    clientName: {
        fontSize: 15,
        color: "#007AFF",
        marginBottom: 4,
    },
    saleDate: {
        fontSize: 12,
        color: "#8E8E93",
    },
    saleRight: {
        alignItems: "flex-end",
    },
    saleAmount: {
        fontSize: 15,
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
        fontSize: 12,
        color: "#8E8E93",
        marginBottom: 2,
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
    },
    deleteButton: {
        width: 40,
        height: 40,
        borderRadius: 22,
        backgroundColor: "#FF3B30",
        alignItems: "center",
        justifyContent: "center",
    },
});