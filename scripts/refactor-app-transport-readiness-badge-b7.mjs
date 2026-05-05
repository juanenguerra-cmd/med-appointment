import fs from "node:fs";
import path from "node:path";

const appPath = path.resolve("src/App.tsx");

if (!fs.existsSync(appPath)) {
  console.error("src/App.tsx was not found. Run this script from the repository root.");
  process.exit(1);
}

const source = fs.readFileSync(appPath, "utf8");
let next = source;

const helperNames = ["getTransportReadinessMeta", "getStatusBadgeClassName"];
let updateCount = 0;

const appHelpersImportPattern = /import\s+\{([\s\S]*?)\}\s+from\s+["']\.\/utils\/appHelpers["'];/;

if (appHelpersImportPattern.test(next)) {
  next = next.replace(appHelpersImportPattern, (_match, names) => {
    const existing = names
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);

    for (const helperName of helperNames) {
      if (!existing.includes(helperName)) {
        existing.push(helperName);
        updateCount += 1;
      }
    }

    const sorted = Array.from(new Set(existing)).sort((a, b) => a.localeCompare(b));
    return `import { ${sorted.join(", ")} } from "./utils/appHelpers";`;
  });
} else {
  const helperImport = `import { ${helperNames.join(", ")} } from "./utils/appHelpers";`;
  const lastLocalImportPattern = /(import[\s\S]*?from\s+["']\.\/[^"']+["'];\s*\n)(?![\s\S]*import[\s\S]*?from\s+["']\.\/[^"']+["'];)/;

  if (lastLocalImportPattern.test(next)) {
    next = next.replace(lastLocalImportPattern, `$1${helperImport}\n`);
  } else {
    next = `${helperImport}\n${next}`;
  }
  updateCount += helperNames.length;
}

const marker = "// Phase B transport badge helper note: use getTransportReadinessMeta(isReady) with getStatusBadgeClassName(meta.tone) when replacing transport readiness badge JSX.";
if (!next.includes(marker)) {
  const appFunctionPattern = /function\s+App\s*\(/;
  const exportAppFunctionPattern = /export\s+default\s+function\s+App\s*\(/;

  if (appFunctionPattern.test(next)) {
    next = next.replace(appFunctionPattern, `${marker}\nfunction App(`);
    updateCount += 1;
  } else if (exportAppFunctionPattern.test(next)) {
    next = next.replace(exportAppFunctionPattern, `${marker}\nexport default function App(`);
    updateCount += 1;
  }
}

fs.writeFileSync(appPath, next, "utf8");
console.log(`Prepared App.tsx transport readiness badge helpers. Applied ${updateCount} safe update(s).`);
console.log("Next manual replacement pattern:");
console.log("  const meta = getTransportReadinessMeta(isTransportReady); ");
console.log("  className={`... ${getStatusBadgeClassName(meta.tone)}`}");
console.log("  {meta.label}");
console.log('Next step: run "npm run build".');
