import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface SummaryCardProps {
  value: string | number;
  label: string;
  color?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ value, label, color }) => {
  return (
    <View style={styles.card}>
      <Text style={[styles.value, { color: color || "#000" }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 8,
  },
  value: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  label: { fontSize: 11, color: "#8E8E93" },
});
