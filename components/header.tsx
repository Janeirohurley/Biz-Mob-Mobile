import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  subtitle?: string;
  right?: React.ReactNode; // <-- accepte n'importe quel composant React
}

const Header: React.FC<HeaderProps> = ({ title = "Titre", showBack = true, onBackPress, subtitle, right }) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.header, { marginLeft: showBack ? 10 : 0 }]}>
      <View>
        <View style={styles.titles}>
          {showBack ? (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#007AFF" />
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
          <View>
            {showBack ?
              <Text style={styles.title} onPress={handleBack}>{title}</Text> :
              <Text style={styles.title}>{title}</Text>}
          </View>

        </View>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {/* Right action si fourni */}
      {right ? <View style={styles.right}>
        {right}
      </View> : <View style={styles.placeholder} />}
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingBottom: 16,

  },
  backButton: {
    padding: 4,

  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  titles: {
    flexDirection: "row",
    alignItems: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#8E8E93",
    marginLeft: 32
  },
  placeholder: {
    width: 24, // équilibre avec la flèche retour
  },
  right:{
    marginRight:22
  }
});
