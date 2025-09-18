import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { BusinessProvider, useBusiness } from "../context/BusinessContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "./add-product";

const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

const RootNavigation = () => {
  const { isAuthenticated, config } = useBusiness();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const checkNavigation = async () => {
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem("hasSeenOnboarding");
        const inOnboarding = segments[0] === "onboarding";
        const inLogin = segments[0] === "login";
        const inSignup = segments[0] === "signup";
        const inDashboard = segments[0] === "dashboard";

        // Si pas vu l'onboarding, rediriger vers onboarding
        if (!hasSeenOnboarding && !inOnboarding) {
          router.replace("/onboarding/page");
          return;
        }

        // Si onboarding vu mais pas de config, rediriger vers signup
        if (hasSeenOnboarding && !config && !inSignup && !inLogin) {
          router.replace("/signup");
          return;
        }

        // Si config existe mais pas authentifié, rediriger vers login
        if (config && !isAuthenticated && !inLogin && !inSignup) {
          router.replace("/login");
          return;
        }

        // Si authentifié mais sur la page d'accueil, rediriger vers dashboard
        if (config && isAuthenticated && (!segments.length)) {
          router.replace("/dashboard/" as any);
          return;
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de la navigation:", error);
        router.replace("/onboarding/page");
      }
    };

    checkNavigation();
  }, [config, segments, router, isAuthenticated]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding/page" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="login" />
        <Stack.Screen name="dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="add-product" />
        <Stack.Screen name="client-details" />
        <Stack.Screen name="product-details" />
        <Stack.Screen name="audit-logs" />
        <Stack.Screen name="reports" />
        <Stack.Screen name="history" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="sale-detail" />
        <Stack.Screen name="add-sale" /> 
        <Stack.Screen name="debts" />

      </Stack>
    </SafeAreaView>
  );
};

export default function RootLayout() {
  return (
    <BusinessProvider>
      <RootNavigation />
    </BusinessProvider>
  );
}