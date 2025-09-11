import React from "react";
import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from "react-native";

// Props génériques
type Props<T extends string> = {
    options: T[];
    selected: T;
    onSelect: (filter: T) => void;
};

function FilterTabs<T extends string>({
    options,
    selected,
    onSelect,
}: Props<T>) {
    return (
        <View style={styles.filterSection}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContainer}
            >
                {options.map((filter) => (
                    <TouchableOpacity
                        key={filter}
                        style={[
                            styles.filterTab,
                            selected === filter && styles.filterTabActive,
                        ]}
                        onPress={() => onSelect(filter)}
                        activeOpacity={0.6}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                selected === filter && styles.filterTextActive,
                            ]}
                        >
                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

export default FilterTabs;

// Styles
const styles = StyleSheet.create({
    scrollContainer: {
        paddingHorizontal: 10,
        gap: 10,
    },
    filterSection: {
        flexDirection: "row",
        paddingHorizontal: 20,
        marginBottom: 20,
        gap: 8,
    },
    filterTab: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
    },
    filterTabActive: {
        backgroundColor: "#007AFF",
    },
    filterText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#000000",
    },
    filterTextActive: {
        color: "#FFFFFF",
    },
});
