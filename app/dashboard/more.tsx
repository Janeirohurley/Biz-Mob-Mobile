import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBusiness } from "../../context/BusinessContext";
import Header from "@/components/header";

const MenuItem = ({
  icon,
  title,
  subtitle,
  onPress,
  color = "#007AFF",
}: {
  icon: any;
  title: string;
  subtitle: string;
  onPress: () => void;
  color?: string;
}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.6}>
    <View style={[styles.iconContainer, { backgroundColor: color }]}>
      <Ionicons name={icon} size={20} color="#FFFFFF" />
    </View>
    <View style={styles.menuContent}>
      <Text style={styles.menuTitle}>{title}</Text>
      <Text style={styles.menuSubtitle}>{subtitle}</Text>
    </View>
    <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
  </TouchableOpacity>
);

export default function More() {
  const { config, auditLogs, sales, purchases, debts } = useBusiness();
  const router = useRouter();

  const totalActivities = sales.length + purchases.length + debts.reduce((sum, debt) => sum + debt.paymentHistory.length, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>


      <Header title="More" showBack={false} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Business Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon="bar-chart"
              title="Reports"
              subtitle="Analytics and insights"
              onPress={() => router.push('/reports')}
              color="#34C759"
            />
            <MenuItem
              icon="time"
              title="History"
              subtitle={`${totalActivities} activities recorded`}
              onPress={() => router.push('/history')}
              color="#FF9500"
            />
          </View>
        </View>

        {/* System Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon="document-text"
              title="Audit Logs"
              subtitle={`${auditLogs.length} system events`}
              onPress={() => router.push('/audit-logs')}
              color="#5856D6"
            />
            <MenuItem
              icon="settings"
              title="Settings"
              subtitle="App preferences and account"
              onPress={() => router.push('/settings')}
              color="#8E8E93"
            />
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{sales.length}</Text>
                <Text style={styles.statLabel}>Sales</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{purchases.length}</Text>
                <Text style={styles.statLabel}>Purchases</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{auditLogs.length}</Text>
                <Text style={styles.statLabel}>Log Entries</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Business Info */}
        <View style={styles.businessSection}>
          <View style={styles.businessCard}>
            <View style={styles.businessIcon}>
              <Ionicons name="business" size={24} color="#007AFF" />
            </View>
            <View style={styles.businessInfo}>
              <Text style={styles.businessName}>{config?.businessName || "My Business"}</Text>
              <Text style={styles.businessOwner}>Owned by {config?.userName || "User"}</Text>
              <Text style={styles.businessCurrency}>
                Currency: {config?.currency || "US Dollar"} ({config?.currencySymbol || "$"})
              </Text>
            </View>
          </View>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  menuGroup: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    borderRadius: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 11,
    color: "#8E8E93",
  },
  statsSection: {
    marginBottom: 32,
  },
  statsCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#8E8E93",
  },
  businessSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  businessCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  businessIcon: {
    width: 40,
    height: 40,
    borderRadius: 24,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  businessOwner: {
    fontSize: 13,
    color: "#8E8E93",
    marginBottom: 2,
  },
  businessCurrency: {
    fontSize: 11,
    color: "#C7C7CC",
  },
});