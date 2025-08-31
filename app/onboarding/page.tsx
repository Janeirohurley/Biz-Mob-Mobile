import React from "react";
import { View, Text, Image, StyleSheet, SafeAreaView } from "react-native";
import AppIntroSlider from "react-native-app-intro-slider";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useBusiness } from "../../context/BusinessContext";

type Slide = {
  key: string;
  title: string;
  text: string;
  image: any;
  backgroundColor: string;
};

const slides: Slide[] = [
  {
    key: "client",
    title: "Manage Clients 👥",
    text: "Easily keep track of all your clients.",
    image: require("../../assets/boarding/client.png"),
    backgroundColor: "#6C63FF",
  },
  {
    key: "debt",
    title: "Track Debts 💳",
    text: "Know who owes you and how much at any time.",
    image: require("../../assets/boarding/debt.png"),
    backgroundColor: "#FF6584",
  },
  {
    key: "inventory",
    title: "Inventory 📦",
    text: "Stay on top of your stock and supplies.",
    image: require("../../assets/boarding/inventory.png"),
    backgroundColor: "#00BFA6",
  },
  {
    key: "purchase",
    title: "Purchases 🛒",
    text: "Record all your purchases from suppliers.",
    image: require("../../assets/boarding/purchase.png"),
    backgroundColor: "#FFA500",
  },
  {
    key: "sales",
    title: "Sales 💰",
    text: "Easily track your sales and revenue.",
    image: require("../../assets/boarding/sales.png"),
    backgroundColor: "#4CAF50",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { someData, userId } = useLocalSearchParams();
  const { config } = useBusiness();

  const finishOnboarding = async () => {
    await AsyncStorage.setItem("hasSeenOnboarding", "true");
    if (config) {
      router.replace("/");
    } else {
      router.replace("/signup"); // Redirect to setup
    }
  };

  const renderItem = ({ item }: { item: Slide }) => (
    <SafeAreaView style={[styles.slide, { backgroundColor: item.backgroundColor }]}>
      <Image source={item.image} style={styles.image} resizeMode="contain" />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.text}>{item.text}</Text>
    </SafeAreaView>
  );

  return (
    <AppIntroSlider
      renderItem={renderItem}
      data={slides}
      onDone={finishOnboarding}
      showSkipButton
      onSkip={finishOnboarding}
    />
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
