import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBusiness } from "../context/BusinessContext";
import { Product } from "../types/business";
import Header from "@/components/header";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function AddOrEditProduct() {
  const { addProduct, updateProduct, generateId, config, getProductById } = useBusiness();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>(); // récupère param id si edition
  const editing = Boolean(id);

  const [formData, setFormData] = useState({
    name: "",
    purchasePrice: "",
    salePrice: "",
    stock: "",
    supplier: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    isDeleted: false,
    syncStatus: 'pending',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // si edition → charger produit
  useEffect(() => {
    if (editing && id) {
      const product = getProductById(id);
      if (product) {
        setFormData({
          name: product.name,
          purchasePrice: String(product.purchasePrice),
          salePrice: String(product.salePrice),
          stock: String(product.stock),
          supplier: product.supplier,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          version: product.version,
          isDeleted: product.isDeleted ?? false,
          syncStatus: product.syncStatus ?? 'pending',
        });
        setSelectedDate(new Date(product.createdAt));
      }
    }
  }, [editing, id]);


  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Product name is required";
    if (!formData.supplier.trim()) newErrors.supplier = "Supplier name is required";
    if (!formData.purchasePrice || isNaN(Number(formData.purchasePrice)) || Number(formData.purchasePrice) <= 0) {
      newErrors.purchasePrice = "Valid purchase price is required";
    }
    if (!formData.salePrice || isNaN(Number(formData.salePrice)) || Number(formData.salePrice) <= 0) {
      newErrors.salePrice = "Valid sale price is required";
    }
    if (!formData.stock || isNaN(Number(formData.stock)) || Number(formData.stock) < 0) {
      newErrors.stock = "Valid stock quantity is required";
    }
    if (Number(formData.salePrice) <= Number(formData.purchasePrice)) {
      newErrors.salePrice = "Sale price must be higher than purchase price";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDateChange = (event: any, newDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (newDate) {
      setSelectedDate(newDate);
    }
  };

  const handleSave = () => {
    if (!validate()) return;

    const timestamp = new Date().toISOString();

    if (editing && id) {
      const updatedProduct: Product = {
        id,
        name: formData.name.trim(),
        purchasePrice: Number(formData.purchasePrice),
        salePrice: Number(formData.salePrice),
        stock: Number(formData.stock),
        supplier: formData.supplier.trim(),
        createdAt: formData.createdAt || timestamp, // garder la date de création originale
        updatedAt: timestamp,
        version: formData.version + 1 || 1, // incrémenter la version
        isDeleted: formData.isDeleted || false,
        syncStatus: 'pending', // nouveau changement non synchronisé
      };
      updateProduct(updatedProduct);
      Alert.alert("Success", "Product updated successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } else {
      const newProduct: Product = {
        id: generateId(),
        name: formData.name.trim(),
        purchasePrice: Number(formData.purchasePrice),
        salePrice: Number(formData.salePrice),
        stock: Number(formData.stock),
        supplier: formData.supplier.trim(),
        createdAt: timestamp,
        updatedAt: timestamp,
        version: 1,
        isDeleted: false,
        syncStatus: 'pending',
      };
      addProduct(newProduct);
      Alert.alert("Success", "Product added successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    }
  };


  const profit = Number(formData.salePrice) - Number(formData.purchasePrice);
  const profitMargin =
    Number(formData.purchasePrice) > 0
      ? (profit / Number(formData.purchasePrice)) * 100
      : 0;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* HEADER */}
        <Header title={editing ? "Edit Product" : "Add Product"} right={
          <TouchableOpacity
            onPress={handleSave}
            style={[
              styles.saveButton,
              (!formData.name ||
                !formData.supplier ||
                !formData.purchasePrice ||
                !formData.salePrice) &&
              styles.saveButtonDisabled,
            ]}
            disabled={
              !formData.name ||
              !formData.supplier ||
              !formData.purchasePrice ||
              !formData.salePrice
            }
          >
            <Text
              style={[
                styles.saveText,
                (!formData.name ||
                  !formData.supplier ||
                  !formData.purchasePrice ||
                  !formData.salePrice) &&
                styles.saveTextDisabled,
              ]}
            >
              {editing ? "Update" : "Save"}
            </Text>
          </TouchableOpacity>
        } />
        {/* FORM */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Product Name *</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="Enter product name"
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholderTextColor="#8E8E93"
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Supplier *</Text>
              <TextInput
                style={[styles.input, errors.supplier && styles.inputError]}
                placeholder="Enter supplier name"
                value={formData.supplier}
                onChangeText={(text) => setFormData(prev => ({ ...prev, supplier: text }))}
                placeholderTextColor="#8E8E93"
              />
              {errors.supplier && <Text style={styles.errorText}>{errors.supplier}</Text>}
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Purchase Price *</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.currencySymbol}>{config?.currencySymbol || "$"}</Text>
                  <TextInput
                    style={[styles.input, styles.priceInput, errors.purchasePrice && styles.inputError]}
                    placeholder="0.00"
                    value={formData.purchasePrice}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, purchasePrice: text }))}
                    keyboardType="numeric"
                    placeholderTextColor="#8E8E93"
                  />
                </View>
                {errors.purchasePrice && <Text style={styles.errorText}>{errors.purchasePrice}</Text>}
              </View>

              <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Sale Price *</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.currencySymbol}>{config?.currencySymbol || "$"}</Text>
                  <TextInput
                    style={[styles.input, styles.priceInput, errors.salePrice && styles.inputError]}
                    placeholder="0.00"
                    value={formData.salePrice}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, salePrice: text }))}
                    keyboardType="numeric"
                    placeholderTextColor="#8E8E93"
                  />
                </View>
                {errors.salePrice && <Text style={styles.errorText}>{errors.salePrice}</Text>}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Initial Stock *</Text>
              <TextInput
                style={[styles.input, errors.stock && styles.inputError]}
                placeholder="Enter quantity"
                value={formData.stock}
                onChangeText={(text) => setFormData(prev => ({ ...prev, stock: text }))}
                keyboardType="numeric"
                placeholderTextColor="#8E8E93"
              />
              {errors.stock && <Text style={styles.errorText}>{errors.stock}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Creation Date *</Text>
              <TouchableOpacity
                style={[styles.input, errors.date && styles.inputError]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>

            {/* Profit Calculation */}
            {formData.purchasePrice && formData.salePrice && Number(formData.salePrice) > Number(formData.purchasePrice) && (
              <View style={styles.profitCard}>
                <Text style={styles.profitTitle}>Profit Analysis</Text>
                <View style={styles.profitRow}>
                  <Text style={styles.profitLabel}>Profit per unit:</Text>
                  <Text style={styles.profitValue}>
                    {config?.currencySymbol || "$"}{profit.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.profitRow}>
                  <Text style={styles.profitLabel}>Profit margin:</Text>
                  <Text style={[styles.profitValue, { color: profitMargin > 20 ? "#34C759" : profitMargin > 10 ? "#FF9500" : "#FF3B30" }]}>
                    {profitMargin.toFixed(1)}%
                  </Text>
                </View>
                {formData.stock && (
                  <View style={styles.profitRow}>
                    <Text style={styles.profitLabel}>Total potential profit:</Text>
                    <Text style={styles.profitValue}>
                      {config?.currencySymbol || "$"}{(profit * Number(formData.stock)).toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export const styles = StyleSheet.create({
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
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: "#E2E8F0",
  },
  saveText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  saveTextDisabled: {
    color: "#8E8E93",
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 13,
    color: "#000000",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inputError: {
    borderColor: "#FF3B30",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  currencySymbol: {
    fontSize: 13,
    fontWeight: "500",
    color: "#8E8E93",
    paddingLeft: 16,
  },
  priceInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  row: {
    flexDirection: "row",
  },
  errorText: {
    fontSize: 12,
    color: "#FF3B30",
    marginTop: 4,
  },
  profitCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  profitTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12,
  },
  profitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  profitLabel: {
    fontSize: 12,
    color: "#8E8E93",
  },
  profitValue: {
    fontSize: 11,
    fontWeight: "600",
    color: "#34C759",
  },
  dateText: {
    fontSize: 13,
    color: "#000000",
  },
});