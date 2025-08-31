import React, { useState } from "react";
import { View, Text, Image, StyleSheet, StatusBar, Platform } from "react-native";
import AppIntroSlider from "react-native-app-intro-slider";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useBusiness } from "../../context/BusinessContext";

type Slide = {
  key: string;
  title: string;
  text: string;
  image: any;
  backgroundColor: string;
};

const slides: Slide[] = [
  { key: "client", title: "Manage Clients 👥", text: "Easily keep track of all your clients.", image: require("../../assets/boarding/client.png"), backgroundColor: "#6C63FF" },
  { key: "debt", title: "Track Debts 💳", text: "Know who owes you and how much at any time.", image: require("../../assets/boarding/debt.png"), backgroundColor: "#FF6584" },
  { key: "inventory", title: "Inventory 📦", text: "Stay on top of your stock and supplies.", image: require("../../assets/boarding/inventory.png"), backgroundColor: "#00BFA6" },
  { key: "purchase", title: "Purchases 🛒", text: "Record all your purchases from suppliers.", image: require("../../assets/boarding/purchase.png"), backgroundColor: "#FFA500" },
  { key: "sales", title: "Sales 💰", text: "Easily track your sales and revenue.", image: require("../../assets/boarding/sales.png"), backgroundColor: "#4CAF50" },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { config } = useBusiness();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);

  const finishOnboarding = async () => {
    await AsyncStorage.setItem("hasSeenOnboarding", "true");
    router.replace(config ? "/" : "/signup");
  };

  const renderItem = ({ item }: { item: Slide }) => (
    <View style={[styles.slide, { paddingBottom: insets.bottom + 20 }]}>
      <Image source={item.image} style={styles.image} resizeMode="contain" />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.text}>{item.text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      {/* Faux background pour le status bar */}
      <View
        style={{
          height: Platform.OS === "ios" ? insets.top : StatusBar.currentHeight,
          backgroundColor: slides[activeIndex].backgroundColor,
        }}
      />
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <View style={{ flex: 1, backgroundColor: slides[activeIndex].backgroundColor }}>
        <AppIntroSlider
          renderItem={renderItem}
          data={slides}
          onDone={finishOnboarding}
          showSkipButton
          onSkip={finishOnboarding}
          onSlideChange={(index) => setActiveIndex(index)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  image: {
    width: 250,
    height: 250,
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
  },
});
