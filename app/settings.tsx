import Header from "@/components/header";
import { SettingItem } from "@/components/SettingItem";
import axios from "axios"; // Ajout de axios pour les requêtes HTTP
import * as Crypto from "expo-crypto";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { useBusiness } from "../context/BusinessContext";
import { version, name } from "../package.json";
import { BackupData } from "@/types/business";
import SyncUrlModal from "@/components/SyncUrlModal";

export default function Settings() {
  const { config, resetApp, logout, updateConfig, importData, clients, sales, debts, products, auditLogs, setClients, setSales, setAuditLogs, setDebts, setPurchases, setProducts } = useBusiness();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState<"business" | "currency" | "security" | null>(null);
  const [businessName, setBusinessName] = useState(config?.businessName || "");
  const [userName, setUserName] = useState(config?.userName || "");
  const [currency, setCurrency] = useState(config?.currency || "US Dollar");
  const [currencySymbol, setCurrencySymbol] = useState(config?.currencySymbol || "$");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSyncing, setIsSyncing] = useState(false); // Indicateur de synchronisation
  const [modalVisibleUrl, setModalVisibleUrl] = useState(false);


  const handleOpenModal = () => setModalVisibleUrl(true);

  // Fonction de synchronisation des données
  // Fonction de synchronisation des données
  const handleSyncData = async (
    endpoint?: string,
    updateProgress?: (p: number) => void
  ) => {
    const syncUrl = endpoint || "http://localhost:3000"; // URL par défaut
    setIsSyncing(true);
    try {
      if (!config) throw new Error("Configuration non disponible");

      const steps = 6; // nombre total d'étapes
      let currentStep = 0;
      const advance = () => {
        currentStep++;
        if (updateProgress) {
          updateProgress(Math.round((currentStep / steps) * 100));
        }
      };

      // 1. Préparer les données locales
      const localData: BackupData = {
        config,
        clients,
        sales,
        purchases: [],
        debts,
        products,
        auditLogs,
        lastSyncTimestamp:
          config?.lastSyncTimestamp || new Date().toISOString(),
        version: config.version || 1,
      };
      advance();

      // 2. Récupérer les données du serveur
      const response = await axios.get(`${syncUrl}/fetch`, {
        headers: { "Content-Type": "application/json" },
      });
      const serverData: BackupData = response.data;
      advance();

      // 3. Fusionner toutes les entités
      const mergeEntities = <
        T extends {
          id: string;
          version?: number;
          isDeleted?: boolean;
          updatedAt?: string;
          createdAt?: string;
        }
      >(
        local: T[],
        server: T[]
      ): T[] => {
        const map = new Map<string, T>();
        local.forEach((item) => {
          if (!item.isDeleted) map.set(item.id, item);
        });
        server.forEach((item) => {
          const existing = map.get(item.id);
          if (!existing) {
            map.set(item.id, {
              ...item,
              syncStatus: "synced",
              lastSyncTimestamp: new Date().toISOString(),
            });
          } else if (item.isDeleted) {
            map.set(item.id, {
              ...existing,
              isDeleted: true,
              syncStatus: "synced",
              lastSyncTimestamp: new Date().toISOString(),
            });
          } else if (
            (item.version || 0) > (existing.version || 0) ||
            new Date(item.updatedAt || item.createdAt || 0) >
            new Date(existing.updatedAt || existing.createdAt || 0)
          ) {
            map.set(item.id, {
              ...item,
              syncStatus: "synced",
              lastSyncTimestamp: new Date().toISOString(),
            });
          }
        });
        return Array.from(map.values());
      };

      const mergedData: BackupData = {
        config: serverData.config || localData.config,
        clients: mergeEntities(localData.clients, serverData.clients),
        sales: mergeEntities(localData.sales, serverData.sales),
        purchases: mergeEntities(
          localData.purchases || [],
          serverData.purchases || []
        ),
        debts: mergeEntities(localData.debts, serverData.debts),
        products: mergeEntities(localData.products, serverData.products),
        auditLogs: mergeEntities(localData.auditLogs, serverData.auditLogs),
        lastSyncTimestamp: new Date().toISOString(),
        version: Math.max(localData.version || 0, serverData.version || 0) + 1,
      };
      advance();

      // 4. Mettre à jour l'état local
      setClients(mergedData.clients);
      setSales(mergedData.sales);
      setPurchases(mergedData.purchases);
      setDebts(mergedData.debts);
      setProducts(mergedData.products);
      setAuditLogs(mergedData.auditLogs);
      updateConfig({
        lastSyncTimestamp: mergedData.lastSyncTimestamp,
        version: mergedData.version,
      });
      advance();

      // 5. Envoyer la fusion au serveur
      await axios.post(`${syncUrl}/sync`, mergedData, {
        headers: { "Content-Type": "application/json" },
      });
      advance();

      // 6. Terminé
      Alert.alert("Success", "Data synced successfully (merged)!");
      advance();
    } catch (error) {
      console.error("Sync error:", error);
      Alert.alert(
        "Error",
        "Failed to sync data. Please check your internet connection and try again."
      );
    } finally {
      setIsSyncing(false);
    }
  };



  const handleConfirmUrl = (url: string) => {
    setModalVisibleUrl(false);
    handleSyncData(url); // passe l’URL saisie à ta fonction de sync
  };

 

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
    updateConfig({ passwordHash });
    Alert.alert("Success", "Password updated successfully!");
    setModalVisible(null);
    setPassword("");
    setConfirmPassword("");
  };

  const handleExportData = async () => {
    try {
      const data = { config, clients, sales, debts, products, auditLogs };
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (!permissions.granted) {
        Alert.alert("Permission denied", "Cannot save backup without storage access.");
        return;
      }

      const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        `bizmob_backup_${new Date().toISOString()}.json`,
        "application/json"
      );

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
        type: "application/json",
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const fileUri = result.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const data = JSON.parse(fileContent);
      if (!data.config || !data.clients || !data.sales || !data.debts || !data.products || !data.auditLogs) {
        Alert.alert("Error", "Invalid backup file. Missing required data.");
        return;
      }

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
            disabled={isSyncing}
          />
          <SettingItem
            icon="cloud-upload"
            title="Import Data"
            subtitle="Restore from backup file"
            onPress={handleImportData}
            color="#AF52DE"
            disabled={isSyncing}
          />
          <SettingItem
            icon="sync"
            title="Backup & Sync"
            subtitle="Synchronize data with server"
            onPress={handleOpenModal}
            color="#00C7BE"
            disabled={isSyncing}
          />
          {isSyncing && <ActivityIndicator size="large" color="#00C7BE" style={styles.loader} />}
          <SyncUrlModal
            visible={modalVisibleUrl}
            onClose={() => setModalVisibleUrl(false)}
            onConfirm={async (url, updateProgress) => {
              await handleSyncData(url, updateProgress);
            }}
          />
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          {/* <SettingItem
            icon="notifications"
            title="Notifications"
            subtitle="Manage your alerts"
            onPress={() => Alert.alert("Coming Soon", "Notification settings will be available soon!")}
            color="#FF9500"
          /> */}
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
            subtitle={`Version ${version}`}
            onPress={() =>
              Alert.alert(
                `About ${name}`,
                `${name} - Your Digital Business Notebook\n\nVersion ${version}\nBuilt with ❤️ for small businesses\n\n© 2025 BizMob. All rights reserved.`
              )
            }
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
  loader: {
    marginVertical: 12,
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
