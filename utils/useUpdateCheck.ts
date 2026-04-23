/**
 * useUpdateCheck.ts
 * Hook React pour détecter automatiquement les mises à jour au lancement de l'app.
 */

import { useEffect, useRef, useState } from "react";
import { Alert, Linking, Platform } from "react-native";
import { checkForUpdate, UpdateInfo } from "./updateService";

interface UseUpdateCheckOptions {
  /** Si true, vérifie automatiquement au montage du composant. Défaut: true */
  checkOnMount?: boolean;
  /** Délai en ms avant la vérification au lancement (pour ne pas bloquer le rendu). Défaut: 3000 */
  delayMs?: number;
  /** Si true, affiche une Alert même si l'app est à jour. Défaut: false */
  notifyIfUpToDate?: boolean;
}

interface UseUpdateCheckResult {
  isChecking: boolean;
  updateInfo: UpdateInfo | null;
  error: string | null;
  /** Déclenche manuellement une vérification */
  checkNow: () => Promise<void>;
}

export function useUpdateCheck(
  options: UseUpdateCheckOptions = {}
): UseUpdateCheckResult {
  const {
    checkOnMount = true,
    delayMs = 3000,
    notifyIfUpToDate = false,
  } = options;

  const [isChecking, setIsChecking] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasCheckedOnMount = useRef(false);

  const showUpdateAlert = (info: UpdateInfo) => {
    Alert.alert(
      "🚀 Mise à jour disponible",
      `Une nouvelle version de BizMob est disponible !\n\nVersion actuelle : ${info.currentVersion}\nNouvelle version : ${info.latestVersion}\n\n📋 Notes :\n${info.releaseNotes.slice(0, 200)}${info.releaseNotes.length > 200 ? "..." : ""}`,
      [
        { text: "Plus tard", style: "cancel" },
        {
          text: "Télécharger",
          style: "default",
          onPress: () => {
            if (info.apkUrl) {
              Linking.openURL(info.apkUrl).catch(() =>
                Alert.alert(
                  "Erreur",
                  "Impossible d'ouvrir le lien de téléchargement."
                )
              );
            } else {
              Alert.alert(
                "Lien indisponible",
                "Le fichier APK n'est pas disponible dans cette release."
              );
            }
          },
        },
      ]
    );
  };

  const checkNow = async (silent = false) => {
    if (isChecking) return;
    setIsChecking(true);
    setError(null);

    try {
      const info = await checkForUpdate();
      setUpdateInfo(info);

      if (info.hasUpdate) {
        showUpdateAlert(info);
      } else if (!silent && notifyIfUpToDate) {
        Alert.alert(
          "✅ App à jour",
          `Vous utilisez déjà la dernière version (${info.currentVersion}).`
        );
      } else if (!silent && !notifyIfUpToDate) {
        Alert.alert(
          "✅ BizMob est à jour",
          `Vous utilisez la version ${info.currentVersion}, c'est la plus récente !`
        );
      }
    } catch (err: any) {
      const message =
        err?.message ?? "Impossible de vérifier les mises à jour.";
      setError(message);
      if (!silent) {
        Alert.alert(
          "Erreur de vérification",
          "Impossible de contacter le serveur pour vérifier les mises à jour.\nVérifiez votre connexion Internet."
        );
      }
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (!checkOnMount || hasCheckedOnMount.current) return;
    if (Platform.OS === "web") return; // pas de mise à jour APK sur web

    hasCheckedOnMount.current = true;

    const timer = setTimeout(() => {
      checkNow(true); // silencieux au lancement (pas d'alert si à jour)
    }, delayMs);

    return () => clearTimeout(timer);
  }, []);

  return {
    isChecking,
    updateInfo,
    error,
    checkNow: () => checkNow(false),
  };
}
