import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface ListItem {
  id: string | number;
  name: string;
  subtext?: string;
  value: number | string;
}

interface ListCardProps {
  items: ListItem[];
}

export const ListCard: React.FC<ListCardProps> = ({ items }) => {
  return (
    <View style={styles.card}>
      {items.map((item, index) => (
        <View key={item.id} style={styles.listItem}>
          <View style={styles.left}>
            <Text style={styles.rank}>#{index + 1}</Text>
            <View>
              <Text style={styles.name}>{item.name}</Text>
              {item.subtext && <Text style={styles.subtext}>{item.subtext}</Text>}
            </View>
          </View>
          <Text style={styles.value}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFF", borderRadius: 12, padding: 16, marginBottom: 16 },
  listItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F2F2F7" },
  left: { flexDirection: "row", alignItems: "center", flex: 1 },
  rank: { width: 30, fontSize: 16, fontWeight: "600", color: "#007AFF" },
  name: { fontSize: 16, fontWeight: "500", color: "#000", marginBottom: 2 },
  subtext: { fontSize: 14, color: "#8E8E93" },
  value: { fontSize: 16, fontWeight: "600", color: "#000" },
});
