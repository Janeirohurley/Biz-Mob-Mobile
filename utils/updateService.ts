/**
 * updateService.ts
 * Vérifie si une nouvelle version de l'app est disponible via GitHub Releases API.
 */

import { version as localVersion } from "../package.json";

// ⚙️ CONFIGURATION — Modifie ces valeurs si ton repo GitHub a un nom différent
const GITHUB_OWNER = "janeirohurley";       // Ton username GitHub
const GITHUB_REPO = "Biz-Mob-Mobile"; // Nom exact du repo GitHub

const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

export interface UpdateInfo {
  hasUpdate: boolean;
  latestVersion: string;
  currentVersion: string;
  apkUrl: string | null;
  releaseNotes: string;
  releaseDate: string;
}

/**
 * Compare deux versions sémantiques (ex: "1.2.0" vs "1.3.0")
 * Retourne true si remoteVersion est plus récente que localVersion
 */
function isNewerVersion(remote: string, local: string): boolean {
  const parse = (v: string) =>
    v
      .replace(/^v/, "")
      .split(".")
      .map((n) => parseInt(n, 10));

  const r = parse(remote);
  const l = parse(local);

  for (let i = 0; i < Math.max(r.length, l.length); i++) {
    const rv = r[i] ?? 0;
    const lv = l[i] ?? 0;
    if (rv > lv) return true;
    if (rv < lv) return false;
  }
  return false;
}

/**
 * Récupère les infos de la dernière release GitHub et les compare avec la version locale.
 */
export async function checkForUpdate(): Promise<UpdateInfo> {
  const response = await fetch(GITHUB_API_URL, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText}`
    );
  }

  const release = await response.json();

  const latestVersion: string = (release.tag_name as string).replace(/^v/, "");

  // Chercher l'APK universel en priorité, sinon le premier APK disponible
  const assets: Array<{ name: string; browser_download_url: string }> =
    release.assets ?? [];

  const universalApk = assets.find((a) =>
    a.name.toLowerCase().includes("universal")
  );
  const anyApk = assets.find((a) => a.name.endsWith(".apk"));
  const apkUrl = universalApk?.browser_download_url ?? anyApk?.browser_download_url ?? null;

  return {
    hasUpdate: isNewerVersion(latestVersion, localVersion),
    latestVersion,
    currentVersion: localVersion,
    apkUrl,
    releaseNotes: release.body ?? "Pas de notes de version disponibles.",
    releaseDate: release.published_at ?? "",
  };
}
