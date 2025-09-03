import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBusiness } from "../context/BusinessContext";
import { Debt, DebtPayment, Sale } from "@/types/business";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Header from "@/components/header";
import DateTimePicker from "@react-native-community/datetimepicker";

const Debts: React.FC = () => {
  const { debts, clients, sales, addDebtPayment, deleteDebt, generateId, config } = useBusiness();
  const router = useRouter();
  const [selectedDebt, setSelectedDebt] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  // filtrer les des dettes non payee
  const unpaidDebts = debts.filter((d) => {
    const totalPaid = d.paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
    return totalPaid < d.amount;
  });

  // Filtrer les dettes selon la recherche
  const filteredDebts = unpaidDebts.filter((debt) => {
    const client = clients.find((c) => c.id === debt.clientId);
    return client?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleAddPayment = (debtId: string) => {
    setError("");
    const debt = debts.find((d) => d.id === debtId);
    if (!debt) {
      setError("Debt not found");
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    const remaining = debt.amount - debt.paymentHistory.reduce((sum, p) => sum + p.amount, 0);
    if (amount > remaining) {
      setError("The payment exceeds the remaining debt.");
      return;
    }

    addDebtPayment({
      id: generateId(),
      debtId,
      amount,
      date: paymentDate.toISOString(),
    });

    setPaymentAmount("");
    setPaymentDate(new Date());
    setSelectedDebt(null);
    Alert.alert("Success", "Payment added successfully!");
  };

  const handleDeleteDebt = (debtId: string, clientName: string) => {
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to delete the debt for ${clientName} (ID: ${debtId.slice(0, 8)})?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteDebt(debtId);
            Alert.alert("Success", "Debt deleted successfully!");
          },
        },
      ]
    );
  };

  const handleDateChange = (event: any, newDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios"); // Garde le picker ouvert sur iOS
    if (newDate) {
      setPaymentDate(newDate);
    }
  };

  const formatDate = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const renderDebt = (item: Debt) => {
    const client = clients.find((c) => c.id === item.clientId);
    const sale = sales.find((s: Sale) => s.id === item.saleId);
    const paid = item.paymentHistory.reduce((sum: number, p: DebtPayment) => sum + p.amount, 0);
    const remaining = item.amount - paid;
    return (
      <View style={styles.formCard} key={item.id}>
        <View style={styles.cardHeader}>
          <Ionicons name="cash-outline" size={24} color="#007AFF" style={styles.cardIcon} />
          <View>
            <Text style={styles.clientName}>{client?.name || "Unknown client"}</Text>
            <Text style={styles.subText}>Debt ID: {item.id.slice(0, 8)}</Text>
          </View>
        </View>
        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Initial Amount:</Text>
            <Text style={styles.detailValue}>
              {config?.currencySymbol || "$"}{item.amount.toFixed(2)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Paid:</Text>
            <Text style={styles.detailValue}>
              {config?.currencySymbol || "$"}{paid.toFixed(2)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Remaining:</Text>
            <Text style={[styles.detailValue, styles.remaining]}>
              {config?.currencySymbol || "$"}{remaining.toFixed(2)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created:</Text>
            <Text style={styles.detailValue}>{formatDate(item.createdAt)}</Text>
          </View>
          {sale && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Sale Date:</Text>
              <Text style={styles.detailValue}>{formatDate(sale.date)}</Text>
            </View>
          )}
          {item.paymentHistory.length > 0 && (
            <View style={styles.paymentHistory}>
              <Text style={styles.sectionTitle}>Payment History</Text>
              {item.paymentHistory.slice(0, 3).map((payment) => (
                <View key={payment.id} style={styles.paymentItem}>
                  <Text style={styles.paymentText}>
                    {formatDate(payment.date)}: {config?.currencySymbol || "$"}{payment.amount.toFixed(2)}
                  </Text>
                </View>
              ))}
              {item.paymentHistory.length > 3 && (
                <Text style={styles.subText}>...and {item.paymentHistory.length - 3} more</Text>
              )}
            </View>
          )}
        </View>

        {selectedDebt === item.id ? (
          <View style={styles.paymentBox}>
            <Text style={styles.sectionTitle}>Payment Amount *</Text>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              placeholder="Enter payment amount"
              keyboardType="numeric"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              placeholderTextColor="#8E8E93"
            />
            <Text style={styles.sectionTitle}>Payment Date *</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>{formatDate(paymentDate)}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={paymentDate}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={handleDateChange}
                maximumDate={new Date()} // Empêche de sélectionner une date future
              />
            )}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => handleAddPayment(item.id)}
              >
                <Text style={styles.modalButtonText}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setSelectedDebt(null);
                  setPaymentAmount("");
                  setPaymentDate(new Date());
                  setError("");
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.actionButtons}>
            {
              remaining > 0 ? <TouchableOpacity
                style={styles.addButton}
                onPress={() => setSelectedDebt(item.id)}
                activeOpacity={0.6}
              >
                <Text style={styles.addButtonText}>Add Payment</Text>
              </TouchableOpacity> : <View style={styles.addButton}><Text style={styles.addButtonText}>Full Paid</Text></View>
            }

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteDebt(item.id, client?.name || "Unknown client")}
              activeOpacity={0.6}
              accessibilityLabel={`Delete debt for ${client?.name || "Unknown client"}`}
            >
              <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };


  const groupDebtsByDate = (debts: Debt[]) => {
    const groups: { [date: string]: Debt[] } = {};

    debts.forEach(debt => {
      const dateKey = new Date(debt.createdAt).toISOString().split("T")[0]; // yyyy-mm-dd
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(debt);
    });

    return Object.keys(groups)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()) // dates descendantes
      .map(dateKey => ({
        title: new Date(dateKey).toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        data: groups[dateKey],
      }));
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <Header title="Outstanding Debts" />
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >

        {/* 🔒 Recherche FIXE en haut */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Search by Client Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter client name"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#8E8E93"
          />
        </View>

        {/* 📋 Liste scrollable avec safe area en bas */}
        <View style={{ flex: 1 }}>
          {filteredDebts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>
                {searchQuery
                  ? "No debts found for this search"
                  : "No debts recorded"}
              </Text>
              <Text style={styles.emptySubText}>
                {searchQuery
                  ? "Try a different search term"
                  : "Add a sale with debt to start tracking"}
              </Text>
            </View>
          ) : (
            <SectionList
              sections={groupDebtsByDate(filteredDebts)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => renderDebt(item)}
              renderSectionHeader={({ section: { title } }) => (
                <Text style={styles.sectionHeader}>{title}</Text>
              )}
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 40 }} // Android + iOS
              contentInset={{ bottom: 40 }} // iOS uniquement
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flex: 1,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
  },

  cardIcon: {
    marginRight: 12,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  subText: {
    fontSize: 12,
    color: "#8E8E93",
  },
  cardDetails: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: "#64748B",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "500",
    color: "#000000",
  },
  remaining: {
    color: "#FF9500",
  },
  paymentHistory: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  paymentItem: {
    marginBottom: 6,
  },
  paymentText: {
    fontSize: 12,
    color: "#000000",
  },
  paymentBox: {
    marginTop: 12,
  },
  input: {
    backgroundColor: "#F7F7F7",
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    color: "#000000",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inputError: {
    borderColor: "#FF3B30",
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12,
    marginTop: 8,
  },
  dateText: {
    fontSize: 13,
    color: "#000000",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    gap: 12,
  },
  addButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#34C759",
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
  },
  deleteButton: {
    padding: 8,
    backgroundColor: "#FF3B30",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    backgroundColor: "#34C759",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#E5E7EB",
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
  },
  errorContainer: {
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 8,
  },
  emptySubText: {
    fontSize: 10,
    color: "#8E8E93",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default Debts;