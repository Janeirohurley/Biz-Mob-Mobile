import UpdateModalComponent from "@/utils/UpdateModalComponent";
import { useAppUpdate } from "@/utils/useAppUpdate";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { checkUpdate, modalVisible, apkUrl, latestVersion, forceUpdate, closeModal } = useAppUpdate();
  useEffect(() => {
    checkUpdate();
  }, []);
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="small" color="#6C63FF" />
      <UpdateModalComponent
        visible={modalVisible}
        apkUrl={apkUrl}
        latestVersion={latestVersion}
        forceUpdate={forceUpdate}
        onClose={closeModal}
      />
    </View>
  );
}