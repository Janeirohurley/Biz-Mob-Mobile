import Constants from "expo-constants";
import { useCallback, useState } from "react";
import { Alert, Platform } from "react-native";

const GITHUB_OWNER = "Janeirohurley";
const GITHUB_REPO = "Biz-Mob-Mobile";

interface GitHubRelease {
    tag_name: string;
    assets: Array<{
        name: string;
        browser_download_url: string;
    }>;
}

export function useAppUpdate() {
    const [modalVisible, setModalVisible] = useState(false);
    const [apkUrl, setApkUrl] = useState<string | undefined>();
    const [latestVersion, setLatestVersion] = useState<string | undefined>();
    const [forceUpdate, setForceUpdate] = useState(false);

    const checkUpdate = useCallback(async () => {
        const currentVersion = Constants.manifest?.version;
        if (!currentVersion) return;

        // OTA
        try {
            const Updates = await import("expo-updates");
            const update = await Updates.checkForUpdateAsync();
            if (update.isAvailable) {
                await Updates.fetchUpdateAsync();
                Alert.alert(
                    "Mise à jour OTA disponible",
                    "Voulez-vous redémarrer pour appliquer la mise à jour ?",
                    [
                        { text: "Annuler", style: "cancel" },
                        { text: "Redémarrer", onPress: () => Updates.reloadAsync() },
                    ]
                );
                return;
            }
        } catch (e) { console.error(e); }

        // APK GitHub (Android uniquement)
        if (Platform.OS === "android") {
            try {
                const response = await fetch(
                    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
                    { headers: { Accept: "application/vnd.github.v3+json" } }
                );
                const data: GitHubRelease = await response.json();
                const apkAsset = data.assets.find((a) => a.name.endsWith(".apk"));

                if (apkAsset && data.tag_name !== currentVersion) {
                    setApkUrl(apkAsset.browser_download_url);
                    setLatestVersion(data.tag_name);
                    setForceUpdate(false); // true si update forcée
                    setModalVisible(true);
                }
            } catch (error) {
                console.error(error);
            }
        }
    }, []);

    return {
        checkUpdate,
        modalVisible,
        apkUrl,
        latestVersion,
        forceUpdate,
        closeModal: () => setModalVisible(false),
    };
}
