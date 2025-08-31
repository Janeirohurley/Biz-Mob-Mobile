import AsyncStorage from "@react-native-async-storage/async-storage";

export const STORAGE_KEYS = {
  BUSINESS_DATA: "bizmob_business_data",
  PURCHASES: "bizmob_purchases",
  SALES: "bizmob_sales",
  DEBTS: "bizmob_debts",
  PRODUCTS: "bizmob_products",
  CLIENTS: "bizmob_clients",
  DEBT_PAYMENTS: "bizmob_debt_payments",
  AUDIT_LOGS: "bizmob_audit_logs",
  LANGUAGE: "bizmob_language",
} as const;

// Save
export async function saveToStorage<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving to AsyncStorage:", error);
  }
}

// Load
export async function loadFromStorage<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const stored = await AsyncStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error("Error loading from AsyncStorage:", error);
    return defaultValue;
  }
}

// Clear
export async function clearStorage(): Promise<void> {
  try {
    await Promise.all(
      Object.values(STORAGE_KEYS).map((key) => AsyncStorage.removeItem(key))
    );
  } catch (error) {
    console.error("Error clearing AsyncStorage:", error);
  }
}
