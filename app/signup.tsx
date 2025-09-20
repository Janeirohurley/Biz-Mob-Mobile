import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import * as Crypto from "expo-crypto";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
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
import { currencies } from "../static/currencies";
import { languages } from "../static/languages";
import { AppConfig, BackupData } from "../types/business";

export default function SignupScreen() {
  const { importData, setConfig } = useBusiness();
  const router = useRouter();
  const [formData, setFormData] = useState({
    businessName: "",
    userName: "",
    password: "",
    confirmPassword: "",
    currencyCode: "FBU",
    currencySymbol: "F",
    currency: "Franc Burundais",
    language: "en" as AppConfig["language"],
    customCurrencyCode: "",
    customSymbol: "",
    customCurrency: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showImport, setShowImport] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCurrencyChange = (code: string) => {
    if (code === "OTHER") {
      setFormData((p) => ({
        ...p,
        currencyCode: "OTHER",
        currencySymbol: "",
        customCurrencyCode: "",
        customSymbol: "",
        currency: ""
      }));
    } else {
      const c = currencies.find((x) => x.code === code);
      setFormData((p) => ({
        ...p,
        currencyCode: c?.code || "FBU",
        currencySymbol: c?.symbol || "F",
        currency: c?.name || "Franc Burundais",
        customCurrencyCode: "",
        customSymbol: "",
      }));
    }
    setErrors((e) => {
      const next = { ...e };
      delete next.customCurrencyCode;
      delete next.customSymbol;
      delete next.currency;
      return next;
    });
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    if (!formData.businessName.trim()) next.businessName = "Business name is required";
    if (!formData.userName.trim()) next.userName = "User name is required";
    if (!formData.password) next.password = "Password is required";
    if (formData.password && formData.password.length < 4)
      next.password = "Password must be at least 4 characters";
    if (formData.password !== formData.confirmPassword)
      next.confirmPassword = "Passwords do not match";

    if (formData.currencyCode === "OTHER") {
      if (!formData.customCurrencyCode.trim()) next.customCurrencyCode = "Enter a custom currency code";
      if (!formData.customSymbol.trim()) next.customSymbol = "Enter a custom currency symbol";
      if (!formData.customCurrency.trim()) next.customCurrency = "Enter a custom currency name";
    }

    if (!formData.language) next.language = "Please select a language";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const isFormValid = useMemo(() => {
    if (!formData.businessName.trim() || !formData.userName.trim()) return false;
    if (!formData.password || formData.password.length < 4) return false;
    if (formData.password !== formData.confirmPassword) return false;
    if (formData.currencyCode === "OTHER" && (!formData.customCurrencyCode.trim() || !formData.customSymbol.trim() || !formData.customCurrency.trim()))
      return false;
    if (!formData.language) return false;
    return true;
  }, [formData]);

  const tryReadFile = async (uri: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      return await response.text();
    } catch {
      try {
        return await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
      } catch {
        throw new Error("Cannot read file content.");
      }
    }
  };

  const handleFileImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      const file = result.assets?.[0];
      if (!file || !file.uri) {
        Alert.alert("Error", "No file selected");
        return;
      }

      const name = (file.name || "").toLowerCase();
      if (!name.endsWith(".json")) {
        Alert.alert("Error", "Invalid file type. Please select a JSON file.");
        return;
      }

      const text = await tryReadFile(file.uri);

      let importedData: BackupData;
      try {
        importedData = JSON.parse(text);
      } catch {
        Alert.alert("Error", "Invalid JSON format. Please select a valid BizMob file.");
        return;
      }

      if (!importedData.config || !importedData.config.businessName) {
        Alert.alert("Error", "Invalid BizMob file. Missing config data.");
        return;
      }

      const cfg = importedData.config;

      setFormData((p) => ({
        ...p,
        businessName: cfg.businessName || "",
        userName: cfg.userName || "",
        password: "",
        confirmPassword: "",
        currency: cfg.currency || "Franc Burundais",
        currencyCode: cfg.currencyCode || "FBU",
        currencySymbol: cfg.currencySymbol || "F",
        customCurrencyCode: "",
        customSymbol: "",
        customCurrency: "",
        language: cfg.language || "en",
      }));

      importData?.(importedData);
      setShowImport(false);
      setErrors({});
      Alert.alert("Success", "Data imported successfully! Please set a new password.");
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Unexpected error while importing file.");
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    console.log("data")
    const finalCurrencyCode =
      formData.currencyCode === "OTHER"
        ? formData.customCurrencyCode.trim().toUpperCase()
        : formData.currencyCode;
    const finalSymbol =
      formData.currencyCode === "OTHER"
        ? formData.customSymbol.trim()
        : formData.currencySymbol;
    const finalCurrency = formData.currencyCode === "OTHER"
      ? formData.customCurrency.trim() : formData.currency

    const passwordHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      formData.password
    );

    setIsSubmitting(true);
    try {
      setConfig({
        version: 1,
        lastSyncTimestamp: undefined,
        businessName: formData.businessName.trim(),
        userName: formData.userName.trim(),
        passwordHash,
        currencyCode: finalCurrencyCode,
        currencySymbol: finalSymbol,
        currency: finalCurrency,
        language: formData.language,
        isRTL: formData.language === "ar"
      });
      router.replace("/login");
    } finally {
      setIsSubmitting(false);
    }

  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Ionicons name="book-outline" size={36} color="#007AFF" />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Set up your business profile</Text>
          </View>

          <View style={styles.form}>
            {!showImport ? (
              <TouchableOpacity
                style={styles.importButton}
                onPress={() => setShowImport(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="cloud-download-outline" size={20} color="#007AFF" />
                <Text style={styles.importButtonText}>Import Existing Data</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.importBox}>
                <Ionicons name="document-text-outline" size={32} color="#8E8E93" />
                <Text style={styles.importText}>Import your BizMob .json file</Text>
                <TouchableOpacity
                  onPress={handleFileImport}
                  style={styles.fileButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="folder-open-outline" size={18} color="#007AFF" />
                  <Text style={styles.fileButtonText}>Choose JSON file</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowImport(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Business Name *</Text>
              <TextInput
                style={[styles.input, errors.businessName && styles.inputError]}
                placeholder="Enter your business name"
                placeholderTextColor="#8E8E93"
                value={formData.businessName}
                onChangeText={(text) => setFormData((p) => ({ ...p, businessName: text }))}
              />
              {errors.businessName && <Text style={styles.errorText}>{errors.businessName}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Your Name *</Text>
              <TextInput
                style={[styles.input, errors.userName && styles.inputError]}
                placeholder="Enter your name"
                placeholderTextColor="#8E8E93"
                value={formData.userName}
                onChangeText={(text) => setFormData((p) => ({ ...p, userName: text }))}
              />
              {errors.userName && <Text style={styles.errorText}>{errors.userName}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Currency *</Text>
              <View style={[styles.pickerContainer, errors.currency && styles.inputError]}>
                <Picker
                  selectedValue={formData.currencyCode}
                  onValueChange={handleCurrencyChange}
                  style={styles.picker}
                >
                  {currencies.map((c) => (
                    <Picker.Item
                      key={c.code}
                      label={`${c.name}${c.symbol ? ` (${c.symbol})` : ""}`}
                      value={c.code}
                       style={styles.input}
                    />
                  ))}
                </Picker>
              </View>
              {errors.currency && <Text style={styles.errorText}>{errors.currency}</Text>}
            </View>

            {formData.currencyCode === "OTHER" && (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>Currency Name *</Text>
                  <TextInput
                    style={[styles.input, errors.customCurrency && styles.inputError]}
                    placeholder="e.g., Franc Burundais"
                    placeholderTextColor="#8E8E93"
                    value={formData.customCurrency}
                    onChangeText={(text) => setFormData((p) => ({ ...p, customCurrency: text }))}
                  />
                  {errors.customCurrency && <Text style={styles.errorText}>{errors.customCurrency}</Text>}
                </View>

                <View style={styles.row}>
                  <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>Currency Code *</Text>
                    <TextInput
                      style={[styles.input, errors.customCurrencyCode && styles.inputError]}
                      placeholder="e.g., FBU"
                      placeholderTextColor="#8E8E93"
                      autoCapitalize="characters"
                      value={formData.customCurrencyCode}
                      onChangeText={(text) => setFormData((p) => ({ ...p, customCurrencyCode: text }))}
                    />
                    {errors.customCurrencyCode && <Text style={styles.errorText}>{errors.customCurrencyCode}</Text>}
                  </View>

                  <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>Symbol *</Text>
                    <TextInput
                      style={[styles.input, errors.customSymbol && styles.inputError]}
                      placeholder="e.g., F"
                      placeholderTextColor="#8E8E93"
                      value={formData.customSymbol}
                      onChangeText={(text) => setFormData((p) => ({ ...p, customSymbol: text }))}
                    />
                    {errors.customSymbol && <Text style={styles.errorText}>{errors.customSymbol}</Text>}
                  </View>
                </View>
              </>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Language *</Text>
              <View style={[styles.pickerContainer, errors.language && styles.inputError]}>
                <Picker
                  selectedValue={formData.language}
                  onValueChange={(code) => setFormData((p) => ({ ...p, language: code as AppConfig["language"] }))}
                  style={styles.picker}

                >
                  {languages.map((l) => (
                    <Picker.Item key={l.code} label={l.name} value={l.code}  style={styles.input} />
                  ))}
                </Picker>
              </View>
              {errors.language && <Text style={styles.errorText}>{errors.language}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password *</Text>
              <View style={[styles.passwordContainer, errors.password && styles.inputError]}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Create a secure password"
                  placeholderTextColor="#8E8E93"
                  secureTextEntry={!showPassword}
                  value={formData.password}
                  onChangeText={(text) => setFormData((p) => ({ ...p, password: text }))}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#8E8E93"
                  />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Confirm Password *</Text>
              <View style={[styles.passwordContainer, errors.confirmPassword && styles.inputError]}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm your password"
                  placeholderTextColor="#8E8E93"
                  secureTextEntry={!showConfirm}
                  value={formData.confirmPassword}
                  onChangeText={(text) => setFormData((p) => ({ ...p, confirmPassword: text }))}
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                  <Ionicons
                    name={showConfirm ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#8E8E93"
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>

            <TouchableOpacity
              style={[styles.submitButton, (!isFormValid || isSubmitting) && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              activeOpacity={0.7}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => router.push('/login')}
              activeOpacity={0.7}
            >
              <Text style={styles.loginLinkText}>Already have an account? Sign In</Text>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              All data is stored locally on your device. No internet connection required.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 20,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: "#8E8E93",
  },
  form: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
  },
  importButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 20,
    gap: 8,
  },
  importButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#007AFF",
  },
  importBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
  },
  importText: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 12,
    marginBottom: 16,
    textAlign: "center",
  },
  fileButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  fileButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontSize: 13,
    color: "#8E8E93",
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
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 13,
    color: "#000000",
    borderWidth: 1,
    borderColor: "#00000000",
  },
  inputError: {
    borderColor: "#FF3B30",
  },
  pickerContainer: {
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#00000000",
    overflow: "hidden",
  },
  picker: {
    color: "#000000",
  },
  row: {
    flexDirection: "row",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#00000000",
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: "#000000",
  },
  errorText: {
    fontSize: 12,
    color: "#FF3B30",
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  loginLink: {
    alignItems: "center",
    marginTop: 20,
  },
  loginLinkText: {
    fontSize: 13,
    color: "#007AFF",
  },
  disclaimer: {
    fontSize: 12,
    color: "#8E8E93",
    textAlign: "center",
    marginTop: 20,
    lineHeight: 20,
  },
});