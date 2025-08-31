import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBusiness } from "../context/BusinessContext";
import { AuditLog } from "../types/business";
import Header from "@/components/header";

export default function AuditLogs() {
  const { auditLogs } = useBusiness();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'create' | 'update' | 'delete' | 'login' | 'error'>('all');

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'create': return 'add-circle';
      case 'update': return 'create';
      case 'delete': return 'trash';
      case 'login': return 'log-in';
      case 'error': return 'warning';
      case 'export': return 'download';
      case 'import': return 'cloud-upload';
      default: return 'information-circle';
    }
  };

  const getEventColor = (eventType: string, status: string) => {
    if (status === 'failure') return '#FF3B30';
    switch (eventType) {
      case 'create': return '#34C759';
      case 'update': return '#007AFF';
      case 'delete': return '#FF3B30';
      case 'login': return '#5856D6';
      case 'error': return '#FF3B30';
      case 'export': return '#FF9500';
      case 'import': return '#AF52DE';
      default: return '#8E8E93';
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesFilter = selectedFilter === 'all' || log.eventType === selectedFilter;
    const matchesSearch = searchQuery === '' || 
                         log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.entityType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const renderLogItem = ({ item }: { item: AuditLog }) => (
    <View style={styles.logItem}>
      <View style={[styles.iconContainer, { backgroundColor: getEventColor(item.eventType, item.status) }]}>
        <Ionicons name={getEventIcon(item.eventType) as any} size={16} color="#FFFFFF" />
      </View>
      <View style={styles.logContent}>
        <View style={styles.logHeader}>
          <Text style={styles.logTitle}>
            {item.eventType.charAt(0).toUpperCase() + item.eventType.slice(1)} {item.entityType}
          </Text>
          <Text style={styles.logTime}>
            {new Date(item.timestamp).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
        <Text style={styles.logDescription}>{item.description}</Text>
        <View style={styles.logFooter}>
          <Text style={styles.logUser}>by {item.userName}</Text>
          <View style={[styles.statusBadge, 
            item.status === 'success' && styles.successBadge,
            item.status === 'failure' && styles.failureBadge
          ]}>
            <Text style={[styles.statusText,
              item.status === 'success' && styles.successText,
              item.status === 'failure' && styles.failureText
            ]}>
              {item.status}
            </Text>
          </View>
        </View>
        <Text style={styles.logDate}>
          {new Date(item.timestamp).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
          })}
        </Text>
        {item.errorMessage && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{item.errorMessage}</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} >
      <Header title="Audit Logs" showBack  />
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search logs..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#8E8E93"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterSection}>
        {(['all', 'create', 'update', 'delete', 'login', 'error'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterTab, selectedFilter === filter && styles.filterTabActive]}
            onPress={() => setSelectedFilter(filter)}
            activeOpacity={0.6}
          >
            <Text style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Stats */}
      <View style={styles.statsSection}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{auditLogs.length}</Text>
            <Text style={styles.statLabel}>Total Events</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: "#34C759" }]}>
              {auditLogs.filter(log => log.status === 'success').length}
            </Text>
            <Text style={styles.statLabel}>Successful</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: "#FF3B30" }]}>
              {auditLogs.filter(log => log.status === 'failure').length}
            </Text>
            <Text style={styles.statLabel}>Failed</Text>
          </View>
        </View>
      </View>

      {/* Logs List */}
      {filteredLogs.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Logs Found</Text>
          <Text style={styles.emptyText}>
            {searchQuery ? 'Try adjusting your search' : 'Audit logs will appear here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredLogs}
          renderItem={renderLogItem}
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  placeholder: {
    width: 32,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#000000",
  },
  filterSection: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
  },
  filterTabActive: {
    backgroundColor: "#007AFF",
  },
  filterText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#000000",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#8E8E93",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  logItem: {
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
  logContent: {
    flex: 1,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  logTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
  },
  logTime: {
    fontSize: 13,
    color: "#8E8E93",
  },
  logDescription: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 8,
    lineHeight: 20,
  },
  logFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  logUser: {
    fontSize: 13,
    color: "#8E8E93",
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  successBadge: {
    backgroundColor: "#34C759",
  },
  failureBadge: {
    backgroundColor: "#FF3B30",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  successText: {
    color: "#FFFFFF",
  },
  failureText: {
    color: "#FFFFFF",
  },
  logDate: {
    fontSize: 12,
    color: "#C7C7CC",
  },
  errorContainer: {
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  errorText: {
    fontSize: 13,
    color: "#DC2626",
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