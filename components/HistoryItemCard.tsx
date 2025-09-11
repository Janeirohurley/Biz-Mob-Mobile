import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HistoryItem } from "@/types/business";

type Props = {
    item: HistoryItem;
    currencySymbol?: string;
    onPress?: (item: HistoryItem) => void;
};

const HistoryItemCard: React.FC<Props> = ({ item, currencySymbol = "$", onPress }) => {
    return (
        <TouchableOpacity
            style={styles.historyItem}
            activeOpacity={0.6}
            onPress={() => onPress?.(item)}
        >
            <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon as any} size={16} color="#FFFFFF" />
            </View>

            <View style={styles.itemContent}>
                {/* Header */}
                <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemDate}>
                        {new Date(item.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </Text>
                </View>

                {/* Subtitle */}
                <Text style={styles.itemSubtitle}>{item.subtitle}</Text>

                {/* Footer */}
                <View style={styles.itemFooter}>
                    {item.amount && (
                        <Text
                            style={[
                                styles.itemAmount,
                                { color: item.type === "purchase" ? "#FF3B30" : "#34C759" },
                            ]}
                        >
                            {item.type === "purchase" ? "-" : "+"}
                            {currencySymbol}
                            {item.amount.toLocaleString()}
                        </Text>
                    )}

                    {item.status && (
                        <View
                            style={[
                                styles.statusBadge,
                                item.status === "success" && styles.successBadge,
                                item.status === "failure" && styles.failureBadge,
                                item.status === "full" && styles.paidBadge,
                                item.status === "debt" && styles.debtBadge,
                                item.status === "partial" && styles.partialBadge,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.statusText,
                                    (item.status === "success" || item.status === "full") &&
                                    styles.successText,
                                    (item.status === "failure" || item.status === "debt") &&
                                    styles.failureText,
                                    item.status === "partial" && styles.partialText,
                                ]}
                            >
                                {item.status === "full"
                                    ? "Paid"
                                    : item.status === "debt"
                                        ? "Unpaid"
                                        : item.status === "partial"
                                            ? "Partial"
                                            : item.status}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default HistoryItemCard;


const styles = StyleSheet.create({
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
   
});
