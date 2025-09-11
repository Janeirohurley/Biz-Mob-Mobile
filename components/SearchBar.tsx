import React from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
    value: string;
    onChange: (text: string) => void;
    placeholder?: string;
};

const SearchBar: React.FC<Props> = ({ value, onChange, placeholder = "Search..." }) => {
    return (
        <View style={styles.searchSection}>
            <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#8E8E93" />
                <TextInput
                    style={styles.searchInput}
                    placeholder={placeholder}
                    value={value}
                    onChangeText={onChange}
                    placeholderTextColor="#8E8E93"
                />
                {value.length > 0 && (
                    <TouchableOpacity onPress={() => onChange('')}>
                        <Ionicons name="close-circle" size={20} color="#8E8E93" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

export default SearchBar;

const styles = StyleSheet.create({
    searchSection: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1E293B",
        marginTop: 16,
        marginBottom: 8,
        marginLeft: 4,
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: "#000000",
    },
});
