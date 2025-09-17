import React, { useState } from "react";
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Animated,
} from "react-native";

interface SyncUrlModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (url: string, updateProgress: (p: number) => void) => void;
}

const SyncUrlModal: React.FC<SyncUrlModalProps> = ({
    visible,
    onClose,
    onConfirm,
}) => {
    const [url, setUrl] = useState("http://localhost:3000");
    const [progress, setProgress] = useState(0);

    return (
        <Modal transparent visible={visible} animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>Synchronisation</Text>
                    <Text style={styles.subtitle}>
                        Entrez l’URL du serveur de synchronisation
                    </Text>

                    <TextInput
                        value={url}
                        onChangeText={setUrl}
                        placeholder="http://example.com"
                        style={styles.input}
                        autoCapitalize="none"
                    />

                    {/* Progression */}
                    {progress > 0 && (
                        <View style={styles.progressWrapper}>
                            <View style={styles.progressBar}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        { width: `${progress}%` },
                                    ]}
                                />
                            </View>
                            <Text style={styles.progressText}>{progress}%</Text>
                        </View>
                    )}

                    <View style={styles.buttons}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelText}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.confirmButton}
                            onPress={() => onConfirm(url, setProgress)}
                        >
                            <Text style={styles.confirmText}>Synchroniser</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.35)",
        justifyContent: "center",
        alignItems: "center",
    },
    container: {
        width: "90%",
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
        elevation: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: "600",
        color: "#111",
        textAlign: "center",
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        marginBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: "#333",
        marginBottom: 20,
    },
    progressWrapper: {
        marginBottom: 20,
        alignItems: "center",
    },
    progressBar: {
        width: "100%",
        height: 10,
        backgroundColor: "#eee",
        borderRadius: 5,
        overflow: "hidden",
        marginBottom: 6,
    },
    progressFill: {
        height: "100%",
        backgroundColor: "#007AFF", // iOS blue
        borderRadius: 5,
    },
    progressText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#333",
    },
    buttons: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 10,
    },
    cancelButton: {
        marginRight: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    cancelText: {
        fontSize: 16,
        color: "#666",
    },
    confirmButton: {
        backgroundColor: "#007AFF",
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    confirmText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
});

export default SyncUrlModal;
