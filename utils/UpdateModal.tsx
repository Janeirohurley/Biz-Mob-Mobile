import React, { useState, useEffect } from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from "react-native";
import * as FileSystem from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import * as Progress from "react-native-progress";

interface UpdateModalProps {
    visible: boolean;
    apkUrl?: string;
    latestVersion?: string;
    onClose: () => void;
    forceUpdate?: boolean;
}

export default function UpdateModal({
    visible,
    apkUrl,
    latestVersion,
    onClose,
    forceUpdate = false,
}: UpdateModalProps) {
    const [progress, setProgress] = useState(0);
    const [downloading, setDownloading] = useState(false);

    const downloadApk = async () => {
        if (!apkUrl) return;
        setDownloading(true);

        try {
            const fileUri = `${FileSystem.cacheDirectory}app-latest.apk`;
            const downloadResumable = FileSystem.createDownloadResumable(
                apkUrl,
                fileUri,
                {},
                (dp) => setProgress(dp.totalBytesExpectedToWrite ? dp.totalBytesWritten / dp.totalBytesExpectedToWrite : 0)
            );

            const downloadResult = await downloadResumable.downloadAsync();
            setProgress(1);

            if (downloadResult && Platform.OS === "android") {
                IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
                    data: downloadResult.uri,
                    type: "application/vnd.android.package-archive",
                    flags: 1,
                });
            }
        } catch (e) {
            console.error(e);
            Alert.alert("Erreur", "Impossible de télécharger ou installer la mise à jour.");
        } finally {
            setDownloading(false);
        }
    };

    const handleClose = () => {
        if (forceUpdate) return; // ne permet pas de fermer si update obligatoire
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <Text style={styles.title}>Nouvelle version disponible</Text>
                    <Text style={styles.version}>{latestVersion}</Text>

                    <Progress.Bar progress={progress} width={200} color="#007AFF" style={{ marginVertical: 20 }} />

                    <TouchableOpacity style={styles.button} onPress={downloadApk} disabled={downloading}>
                        <Text style={styles.buttonText}>{downloading ? "Téléchargement..." : "Mettre à jour"}</Text>
                    </TouchableOpacity>

                    {!forceUpdate && (
                        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                            <Text style={{ color: "#007AFF" }}>Annuler</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
    modal: { width: 280, backgroundColor: "#fff", padding: 20, borderRadius: 16, alignItems: "center" },
    title: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
    version: { fontSize: 14, color: "#8E8E93" },
    button: { backgroundColor: "#007AFF", paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12 },
    buttonText: { color: "#fff", fontWeight: "600" },
    closeButton: { marginTop: 12 },
});
