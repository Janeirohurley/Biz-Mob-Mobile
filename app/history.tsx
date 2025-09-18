import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Platform,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBusiness } from "../context/BusinessContext";
import Header from "@/components/header";
import { HistoryItem } from "@/types/business";
import { createHistoryItems, groupByDate } from "@/utils/logicBusinness";
import HistoryItemCard from "@/components/HistoryItemCard";
import FilterTabs from "@/components/FilterTabs";
import SearchBar from "@/components/SearchBar";
import { filterItems } from "@/utils/generique/filterItems";
import EmptyState from "@/components/EmptyState";


export default function History() {
  const { sales, purchases, debts, config, clients, products } = useBusiness();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'sale' | 'purchase' | 'payment'>('all');



  const historyItems = createHistoryItems(
    { sales, purchases, debts, clients, products }
  );

  const filteredItems = filterItems<HistoryItem>({
    items: historyItems,
    selectedFilter,
    searchQuery,
    typeField: "type",
    searchFields: ["title", "subtitle", "status"],
    filterMapping: {
      sale: "sale",
      purchase: "purchase",
      payment: "payment",
      audit: "audit",
    },
    start:0,
    end:10
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header title="History" />

      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search history..."
      />

      {/* Filter Tabs */}

      <FilterTabs<'all' | 'sale' | 'purchase' | 'payment' >
        options={["all", "sale", "purchase", "payment"]}
        selected={selectedFilter}
        onSelect={(filter) => setSelectedFilter(filter)}
      />

      {/* History List Grouped by Date */}
      {filteredItems.length === 0 ? (
        <EmptyState
          iconName="time-outline"
          iconSize={64}
          iconColor="#CBD5E1"
          title="No History Found"
          subtitle={searchQuery ? "Try adjusting your search" : "Your activity will appear here"}
        />
      ) : (
        <SectionList
          sections={groupByDate({
            items: filteredItems,
            dateField: "date",
            locale: "fr-FR",
          })}
          keyExtractor={(item: HistoryItem) => item.id}
          renderItem={({ item }) => (
            <HistoryItemCard item={item} currencySymbol={config?.currencySymbol} />
          )}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: Platform.OS === "android" ? 40 : 20,
          }}
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


  sectionHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
  },


});