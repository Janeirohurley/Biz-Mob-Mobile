import React, { useState } from "react";
import {
    Modal,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type FilterFABProps<T> = {
    items: T[];
    selectedId?: string | null;
    onSelect: (id: string | null) => void;
    getId: (item: T) => string;       // pour récupérer l’ID unique
    getLabel: (item: T) => string;    // pour afficher le texte
    title?: string;                   // optionnel: titre du modal
};

const { width, height } = Dimensions.get("window");

export default function FilterFAB<T>({
    items,
    selectedId,
    onSelect,
    getId,
    getLabel,
    title = "Filter",
}: FilterFABProps<T>) {
    const [modalVisible, setModalVisible] = useState(false);

    const handleSelect = (id: string | null) => {
        onSelect(id);
        setModalVisible(false);
    };

    return (
        <>
            {/* Floating Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.7}
            >
                <Ionicons name="filter" size={20} color="#fff" />
            </TouchableOpacity>

            {/* Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
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

                        {/* Clear Filter */}
                        <TouchableOpacity
                            style={styles.clearButton}
                            onPress={() => handleSelect(null)}
                        >
                            <Text style={{ color: "#FF3B30", fontWeight: "600" }}>
                                Clear Filter
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    fab: {
        position: "absolute",
        bottom: 30,
        right: 20,
        backgroundColor: "#007AFF",
        width: 40,
        height: 40,
        borderRadius: 30,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
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
