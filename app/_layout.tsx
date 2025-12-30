import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { BusinessProvider, useBusiness } from "../context/BusinessContext";
import { styles } from "./add-product";

const RootNavigation = () => {
  const { isAuthenticated, config } = useBusiness();
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    // Petit délai pour s'assurer que le BusinessContext a chargé les données
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady) return; // Attendre que le contexte soit prêt

    const checkNavigation = async () => {
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem("hasSeenOnboarding");
        const inOnboarding = segments[0] === "onboarding";
        const inLogin = segments[0] === "login";
        const inSignup = segments[0] === "signup";
        const inLockScreen = segments[0] === "lock-screen";

        // Si pas vu l'onboarding → rediriger vers onboarding
        if (!hasSeenOnboarding && !inOnboarding) {
          router.replace("/onboarding/page");
          return;
        }

        // Si onboarding vu mais pas de config → rediriger vers signup
        if (hasSeenOnboarding && !config && !inSignup && !inLogin) {
          router.replace("/signup");
          return;
        }

        // Si config existe mais pas authentifié → login
        if (config && !isAuthenticated && !inLogin && !inSignup && !inLockScreen) {
          router.replace("/login");
          return;
        }

        // Si authentifié → permettre l'accès au dashboard et autres pages
        // Pas besoin de logique supplémentaire, l'utilisateur est déjà vérifié

      } catch (error) {
        console.error("Erreur navigation:", error);
        router.replace("/onboarding/page");
      }
    };

    checkNavigation();
  }, [config, segments, router, isAuthenticated, isReady]);

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
        {/* 🔑 LockScreen sait maintenant quel rôle jouer via params */}
        <Stack.Screen name="lock-screen" />
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
};
