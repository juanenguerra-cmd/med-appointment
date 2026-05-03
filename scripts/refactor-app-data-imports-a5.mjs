import fs from "node:fs";
import path from "node:path";

const appPath = path.resolve("src/App.tsx");

if (!fs.existsSync(appPath)) {
  console.error("src/App.tsx was not found. Run this script from the repository root.");
  process.exit(1);
}

const source = fs.readFileSync(appPath, "utf8");
let next = source;

const directImports = [
  /import\s+\{([\s\S]*?)\}\s+from\s+["']\.\/utils\/dataValidation["'];\s*\n?/g,
  /import\s+\{([\s\S]*?)\}\s+from\s+["']\.\/utils\/auditLog["'];\s*\n?/g,
  /import\s+\{([\s\S]*?)\}\s+from\s+["']\.\/utils\/censusReconciliation["'];\s*\n?/g,
];

const collected = new Set();
let removedCount = 0;

for (const pattern of directImports) {
  next = next.replace(pattern, (_match, names) => {
    names
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
      .forEach((name) => collected.add(name));
    removedCount += 1;
    return "";
  });
}

const existingDataBarrelPattern = /import\s+\{([\s\S]*?)\}\s+from\s+["']\.\/utils\/data["'];/;
if (existingDataBarrelPattern.test(next)) {
  next = next.replace(existingDataBarrelPattern, (_match, names) => {
    names
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
      .forEach((name) => collected.add(name));
    return "__DATA_BARREL_PLACEHOLDER__";
  });
}

if (collected.size === 0) {
  console.log("No App.tsx data utility import cleanup was needed.");
  process.exit(0);
}

const sortedNames = Array.from(collected).sort((a, b) => a.localeCompare(b));
const replacementImport = `import { ${sortedNames.join(", ")} } from "./utils/data";`;

if (next.includes("__DATA_BARREL_PLACEHOLDER__")) {
  next = next.replace("__DATA_BARREL_PLACEHOLDER__", replacementImport);
} else {
  const lastLocalImportPattern = /(import[\s\S]*?from\s+["']\.\/[^"']+["'];\s*\n)(?![\s\S]*import[\s\S]*?from\s+["']\.\/[^"']+["'];)/;
  if (lastLocalImportPattern.test(next)) {
    next = next.replace(lastLocalImportPattern, `$1${replacementImport}\n`);
  } else {
    next = `${replacementImport}\n${next}`;
  }
}

fs.writeFileSync(appPath, next, "utf8");
console.log(`Updated App.tsx data utility imports. Removed ${removedCount} direct data utility import group(s).`);
console.log('Next step: run "npm run build".');
