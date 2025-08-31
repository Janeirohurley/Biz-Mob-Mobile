// check-unused-packages.js
const fs = require("fs");
const path = require("path");
const glob = require("glob");

// Chemin du package.json
const packageJsonPath = path.resolve(process.cwd(), "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

// Récupère toutes les dépendances
const allDeps = [
  ...Object.keys(packageJson.dependencies || {}),
  ...Object.keys(packageJson.devDependencies || {})
];

// Recherche tous les fichiers JS/TS/TSX du projet
const files = glob.sync("**/*.{js,ts,tsx}", {
  ignore: ["node_modules/**", "**/dist/**", "**/build/**"]
});

// Fonction pour vérifier si un package est utilisé
function isUsed(pkg) {
  const regex = new RegExp(`(from\\s+['"]${pkg}['"])|(require\\(['"]${pkg}['"]\\))`);
  return files.some(file => {
    const content = fs.readFileSync(file, "utf8");
    return regex.test(content);
  });
}

// Vérifie chaque package
const unused = allDeps.filter(pkg => !isUsed(pkg));

if (unused.length === 0) {
  console.log("✅ Tous les packages sont utilisés !");
} else {
  console.log("🚨 Packages installés mais non utilisés :");
  unused.forEach(pkg => console.log(" -", pkg));
}
