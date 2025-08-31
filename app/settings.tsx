import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useBusiness } from "../context/BusinessContext";
import Header from "@/components/header";
import * as Crypto from "expo-crypto";
import { SettingItem } from "@/components/SettingItem";

export default function Settings() {
  const { config, resetApp, logout, updateConfig, importData, clients, sales, debts, products, auditLogs } = useBusiness();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState<"business" | "currency" | "security" | null>(null);
  const [businessName, setBusinessName] = useState(config?.businessName || "");
  const [userName, setUserName] = useState(config?.userName || "");
  const [currency, setCurrency] = useState(config?.currency || "US Dollar");
  const [currencySymbol, setCurrencySymbol] = useState(config?.currencySymbol || "$");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleReset = async () => {
    try {
      await resetApp();
      Alert.alert("Success", "App has been reset successfully!");
      router.replace('/login');
    } catch (error) {
      Alert.alert("Error", "Failed to reset the app. Please try again.");
    }
  };

  const handleUpdateBusinessInfo = () => {
    if (!businessName || !userName) {
      Alert.alert("Error", "Business name and user name are required.");
      return;
    }
    updateConfig({ businessName, userName });
    Alert.alert("Success", "Business information updated successfully!");
    setModalVisible(null);
  };

  const handleUpdateCurrency = () => {
    const currencies = {
      "US Dollar": "$",
      "Euro": "€",
      "Pound Sterling": "£",
      "Yen": "¥",
    };
    updateConfig({ currency, currencySymbol: currencies[currency as keyof typeof currencies] });
    Alert.alert("Success", "Currency updated successfully!");
    setModalVisible(null);
  };

  const handleUpdatePassword = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long.");
      return;
    }
    const passwordHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password
    );
    // Simuler la mise à jour du mot de passe (pas de système d'authentification réel ici)
    updateConfig({ passwordHash }); // À remplacer par une vraie logique d'authentification
    Alert.alert("Success", "Password updated successfully!");
    setModalVisible(null);
    setPassword("");
    setConfirmPassword("");
  };

  const handleExportData = async () => {
    try {
      const data = { config, clients, sales, debts, products, auditLogs };
      // Ask user to select a folder
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (!permissions.granted) {
        Alert.alert("Permission denied", "Cannot save backup without storage access.");
        return;
      }

      // Create a file in the selected directory
      const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        "bizmob_backup.json",
        "application/json"
      );

      // Write JSON content into the file
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(data, null, 2), {
        encoding: FileSystem.EncodingType.UTF8,
      });

      Alert.alert("Success", "Backup saved to selected folder!");
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert("Error", "Failed to export data.");
    }
  };
  const handleImportData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json", // limit to JSON files
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return; // user cancelled picker
      }

      const fileUri = result.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const data = JSON.parse(fileContent);
      await importData(data);

      Alert.alert("Success", "Data imported successfully!");
    } catch (error) {
      console.error("Import error:", error);
      Alert.alert("Error", "Failed to import data. Please ensure the file is valid JSON.");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Settings" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {config?.userName?.charAt(0).toUpperCase() || "U"}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{config?.userName || "User"}</Text>
              <Text style={styles.profileBusiness}>{config?.businessName || "My Business"}</Text>
              <Text style={styles.profileCurrency}>
                {config?.currency || "US Dollar"} ({config?.currencySymbol || "$"})
              </Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setModalVisible("business")}
              activeOpacity={0.6}
            >
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Business Settings */}
        <View style={styles.section}>
          <SettingItem
            icon="business"
            title="Business Information"
            subtitle="Update your business details"
            onPress={() => setModalVisible("business")}
            color="#007AFF"
          />
          <SettingItem
            icon="card"
            title="Currency & Pricing"
            subtitle={`${config?.currency || "US Dollar"} (${config?.currencySymbol || "$"})`}
            onPress={() => setModalVisible("currency")}
            color="#34C759"
          />
          <SettingItem
            icon="language"
            title="Language"
            subtitle={config?.language === 'en' ? 'English' : config?.language === 'fr' ? 'Français' : config?.language === 'es' ? 'Español' : config?.language === 'ar' ? 'العربية' : 'English'}
            onPress={() => Alert.alert("Coming Soon", "Language settings will be available soon!")}
            color="#FF9500"
          />
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <SettingItem
            icon="cloud-download"
            title="Export Data"
            subtitle="Download your business data"
            onPress={handleExportData}
            color="#5856D6"
          />
          <SettingItem
            icon="cloud-upload"
            title="Import Data"
            subtitle="Restore from backup file"
            onPress={handleImportData}
            color="#AF52DE"
          />
          <SettingItem
            icon="sync"
            title="Backup & Sync"
            subtitle="Automatic data backup"
            onPress={() => Alert.alert("Coming Soon", "Backup & sync will be available soon!")}
            color="#00C7BE"
          />
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <SettingItem
            icon="notifications"
            title="Notifications"
            subtitle="Manage your alerts"
            onPress={() => Alert.alert("Coming Soon", "Notification settings will be available soon!")}
            color="#FF9500"
          />
          <SettingItem
            icon="lock-closed"
            title="Security"
            subtitle="Password and privacy"
            onPress={() => setModalVisible("security")}
            color="#8E8E93"
          />
          <SettingItem
            icon="log-out"
            title="Logout"
            subtitle="Sign out of your account"
            onPress={() => {
              Alert.alert(
                "Logout",
                "Are you sure you want to logout?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                      await logout();
                      router.replace('/login');
                    }
                  },
                ]
              );
            }}
            color="#FF3B30"
            showChevron={false}
          />
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <SettingItem
            icon="help-circle"
            title="Help & Support"
            subtitle="Get assistance"
            onPress={() => Alert.alert("Help & Support", "Contact us at support@bizmob.com\n\nWe're here to help you succeed!")}
            color="#007AFF"
          />
          <SettingItem
            icon="information-circle"
            title="About BizMob"
            subtitle="Version 1.0.0"
            onPress={() => Alert.alert("About BizMob", "BizMob - Your Digital Business Notebook\n\nVersion 1.0.0\nBuilt with ❤️ for small businesses\n\n© 2025 BizMob. All rights reserved.")}
            color="#8E8E93"
          />
          <SettingItem
            icon="document-text"
            title="Audit Logs"
            subtitle="View system activity"
            onPress={() => router.push('/audit-logs')}
            color="#5856D6"
          />
          <SettingItem
            icon="star"
            title="Rate BizMob"
            subtitle="Share your experience"
            onPress={() => Alert.alert("Rate BizMob", "Thank you for using BizMob!\n\nYour feedback helps us improve. Rate us on the App Store!")}
            color="#FF9500"
          />
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerSection}>
          <SettingItem
            icon="trash"
            title="Reset All Data"
            subtitle="Permanently delete everything"
            onPress={() => {
              Alert.alert(
                "Reset All Data",
                "This will permanently delete all your business data including products, sales, clients, and settings.\n\nThis action cannot be undone.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Reset Everything",
                    style: "destructive",
                    onPress: handleReset
                  },
                ]
              );
            }}
            color="#FF3B30"
            showChevron={false}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with ❤️ for small businesses
          </Text>
          <Text style={styles.versionText}>
            BizMob v1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* Business Info Modal */}
      <Modal
        visible={modalVisible === "business"}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Business Information</Text>
            <TextInput
              style={styles.input}
              placeholder="Business Name"
              value={businessName}
              onChangeText={setBusinessName}
            />
            <TextInput
              style={styles.input}
              placeholder="User Name"
              value={userName}
              onChangeText={setUserName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(null)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleUpdateBusinessInfo}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Currency Modal */}
      <Modal
        visible={modalVisible === "currency"}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Currency</Text>
            {["US Dollar", "Euro", "Pound Sterling", "Yen"].map((curr) => (
              <TouchableOpacity
                key={curr}
                style={[styles.currencyOption, currency === curr && styles.currencyOptionSelected]}
                onPress={() => setCurrency(curr)}
              >
                <Text style={styles.currencyOptionText}>{curr}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(null)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleUpdateCurrency}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Security Modal */}
      <Modal
        visible={modalVisible === "security"}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Password</Text>
            <TextInput
              style={styles.input}
              placeholder="New Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(null)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleUpdatePassword}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  content: {
    flex: 1,
  },
  profileSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 32,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  profileBusiness: {
    fontSize: 15,
    color: "#8E8E93",
    marginBottom: 2,
  },
  profileCurrency: {
    fontSize: 13,
    color: "#C7C7CC",
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F2F2F7",
    borderRadius: 16,
  },
  editText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#007AFF",
  },
  section: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 17,
    fontWeight: "400",
    color: "#000000",
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 15,
    color: "#8E8E93",
  },
  dangerSection: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 32,
  },
  footer: {
    alignItems: "center",
    paddingBottom: 32,
  },
  footerText: {
    fontSize: 15,
    color: "#8E8E93",
    marginBottom: 4,
  },
  versionText: {
    fontSize: 13,
    color: "#C7C7CC",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: "#000000",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#E5E7EB",
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  currencyOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  currencyOptionSelected: {
    backgroundColor: "#F0F0F7",
  },
  currencyOptionText: {
    fontSize: 16,
    color: "#000000",
  },
});