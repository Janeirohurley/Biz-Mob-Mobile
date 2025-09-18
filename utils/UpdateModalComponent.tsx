import React from "react";
import UpdateModal from "./UpdateModal"; // ton modal réel

type Props = {
    visible: boolean;
    apkUrl?: string;
    latestVersion?: string;
    forceUpdate?: boolean;
    onClose: () => void;
};

export default function UpdateModalComponent({
    visible,
    apkUrl,
    latestVersion,
    forceUpdate,
    onClose,
}: Props) {
    return (
        <UpdateModal
            visible={visible}
            apkUrl={apkUrl}
            latestVersion={latestVersion}
            forceUpdate={forceUpdate}
            onClose={onClose}
        />
    );
}
