import fs from "node:fs";
import path from "node:path";

const appPath = path.resolve("src/App.tsx");

if (!fs.existsSync(appPath)) {
  console.error("src/App.tsx was not found. Run this script from the repository root.");
  process.exit(1);
}

const source = fs.readFileSync(appPath, "utf8");
let next = source;

const helperNames = ["getAppointmentStatusMeta", "getStatusBadgeClassName"];
let replacementCount = 0;

// Low-risk replacement only: add helper import and insert utility comments near status badge patterns.
// This script intentionally avoids broad JSX rewrites because status badge rendering can vary.
// Use the audit output to replace one exact render block manually after this helper import is available.
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
        replacementCount += 1;
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
  replacementCount += helperNames.length;
}

const marker = "// Phase B status badge helper note: use getAppointmentStatusMeta(status) with getStatusBadgeClassName(meta.tone) when replacing appointment status badge JSX.";
if (!next.includes(marker)) {
  const firstFunctionPattern = /function\s+App\s*\(/;
  const exportFunctionPattern = /export\s+default\s+function\s+App\s*\(/;
  if (firstFunctionPattern.test(next)) {
    next = next.replace(firstFunctionPattern, `${marker}\nfunction App(`);
    replacementCount += 1;
  } else if (exportFunctionPattern.test(next)) {
    next = next.replace(exportFunctionPattern, `${marker}\nexport default function App(`);
    replacementCount += 1;
  }
}

fs.writeFileSync(appPath, next, "utf8");
console.log(`Prepared App.tsx appointment status badge helpers. Applied ${replacementCount} safe update(s).`);
console.log("Next manual replacement pattern:");
console.log("  const meta = getAppointmentStatusMeta(appointment.status);");
console.log("  className={`... ${getStatusBadgeClassName(meta.tone)}`}");
console.log("  {meta.label}");
console.log('Next step: run "npm run build".');
