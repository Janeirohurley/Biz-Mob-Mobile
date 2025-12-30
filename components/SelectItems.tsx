import { useState } from "react";
import { Alert, Dimensions, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type SelectItemsProps<T> = {
    items: T[];
    selectedId?: string | null;
    onSelect: (id: string | null) => void;
    getId: (item: T) => string;       // récupérer l’ID unique
    getLabel: (item: T) => string;    // récupérer le texte à afficher
    title?: string;                   // titre du modal
    error?: string;
};

const { width, height } = Dimensions.get("window");

export default function SelectItems<T>({
    title = "Select Item",
    error = "",
    getLabel,
    getId,
    items,
    selectedId = null,
    onSelect
}: SelectItemsProps<T>) {

    const [modalVisible, setModalVisible] = useState(false);

    const handleSelect = (id: string | null) => {
        onSelect(id);
        setModalVisible(false);
    };

    return (
        <>
            <Text style={styles.label}>{title}</Text>
            <TouchableOpacity
                style={[styles.input, error && styles.inputError]}
                onPress={() => setModalVisible(true)}
            >
                <Text style={{ color: selectedId ? "#000" : "#999" }}>
                    {selectedId ? getLabel(items.find(item => getId(item) === selectedId)!) : "Choose..."}
                </Text>
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPressOut={() => setModalVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{title}</Text>

                        <FlatList
                            data={items}
                            keyExtractor={(item) => getId(item)}
                            renderItem={({ item }) => {
                                const id = getId(item);
                                return (
                                    <TouchableOpacity
                                        style={[
                                            styles.item,
                                            selectedId === id && styles.itemSelected,
                                        ]}
                                        onPress={() => handleSelect(id)}
                                    >
                                        <Text
                                            style={[
                                                styles.itemText,
                                                selectedId === id && { color: "#007AFF" },
                                            ]}
                                        >
                                            {getLabel(item)}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            }}
                            ItemSeparatorComponent={() => (
                                <View style={{ height: 1, backgroundColor: "#E5E5EA" }} />
                            )}
                        />

                        {/* Clear Selection */}
                        <TouchableOpacity
                            style={styles.clearButton}
                            onPress={() => handleSelect(null)}
                        >
                            <Text style={{ color: "#FF3B30", fontWeight: "600" }}>
                                Clear Selection
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </>
    )
}

const styles = StyleSheet.create({
    label: { fontSize: 14, marginBottom: 6, color: "#1C1C1E" },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 12,
        borderRadius: 10,
        backgroundColor: "#fff",
        marginBottom: 10,
    },
    inputError: { borderColor: "#FF3B30" },
    errorText: { color: "#FF3B30", fontSize: 12, marginBottom: 10 },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.3)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#F9F9F9",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 20,
        maxHeight: height * 0.5,
        width: width,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "600",
        textAlign: "center",
        paddingVertical: 12,
        color: "#1C1C1E",
    },
    item: {
        paddingVertical: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
    },
    itemSelected: {
        backgroundColor: "#E5F0FF",
    },
    itemText: {
        fontSize: 16,
        color: "#1C1C1E",
    },
    clearButton: {
        marginTop: 12,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        backgroundColor: "#fff",
        marginHorizontal: 10,
        borderRadius: 12,
    },
});
