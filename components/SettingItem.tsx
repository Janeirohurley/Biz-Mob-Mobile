import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
interface SettingItemProps {
    icon: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress: () => void;
    color?: string;
    showChevron?: boolean;
}

export const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    color = "#8E8E93",
    showChevron = true,
}: SettingItemProps) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} activeOpacity={0.6}>
        <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: color }]}>
                <Ionicons name={icon} size={18} color="#FFFFFF" />
            </View>
            <View style={styles.settingText}>
                <Text style={styles.settingTitle}>{title}</Text>
                {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
            </View>
        </View>
        {showChevron && <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />}
    </TouchableOpacity>
);
const styles = StyleSheet.create({
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

})
