import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
    iconName?: string;
    iconSize?: number;
    iconColor?: string;
    title?: string;
    subtitle?: string;
    containerStyle?: ViewStyle;
    titleStyle?: TextStyle;
    subtitleStyle?: TextStyle;
};

const EmptyState: React.FC<Props> = ({
    iconName = "time-outline",
    iconSize = 64,
    iconColor = "#CBD5E1",
    title = "No items found",
    subtitle,
    containerStyle,
    titleStyle,
    subtitleStyle,
}) => {
    return (
        <View style={[styles.emptyState, containerStyle]}>
            <Ionicons name={iconName as any} size={iconSize} color={iconColor} />
            <Text style={[styles.emptyTitle, titleStyle]}>{title}</Text>
            {subtitle && <Text style={[styles.emptyText, subtitleStyle]}>{subtitle}</Text>}
        </View>
    );
};

export default EmptyState;

const styles = StyleSheet.create({

    emptyState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "600",
        color: "#1E293B",
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: "#64748B",
        textAlign: "center",
    },
});
