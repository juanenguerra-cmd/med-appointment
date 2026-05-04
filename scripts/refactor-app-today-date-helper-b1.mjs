import fs from "node:fs";
import path from "node:path";

const appPath = path.resolve("src/App.tsx");

if (!fs.existsSync(appPath)) {
  console.error("src/App.tsx was not found. Run this script from the repository root.");
  process.exit(1);
}

const source = fs.readFileSync(appPath, "utf8");
let next = source;

const replacements = [
  /new Date\(\)\.toISOString\(\)\.slice\(0,\s*10\)/g,
  /new Date\(\)\.toISOString\(\)\.substring\(0,\s*10\)/g,
];

let replacementCount = 0;
for (const pattern of replacements) {
  next = next.replace(pattern, () => {
    replacementCount += 1;
    return "getTodayDateInputValue()";
  });
}

if (replacementCount === 0) {
  console.log("No today date helper replacements were needed in App.tsx.");
  process.exit(0);
}

const helperImport = 'import { getTodayDateInputValue } from "./utils/appHelpers";';
const helperImportPattern = /import\s+\{([\s\S]*?)\}\s+from\s+["']\.\/utils\/appHelpers["'];/;

if (helperImportPattern.test(next)) {
  next = next.replace(helperImportPattern, (match, names) => {
    const existing = names
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);

    if (!existing.includes("getTodayDateInputValue")) {
      existing.push("getTodayDateInputValue");
    }

    const sorted = Array.from(new Set(existing)).sort((a, b) => a.localeCompare(b));
    return `import { ${sorted.join(", ")} } from "./utils/appHelpers";`;
  });
} else {
  const lastLocalImportPattern = /(import[\s\S]*?from\s+["']\.\/[^"']+["'];\s*\n)(?![\s\S]*import[\s\S]*?from\s+["']\.\/[^"']+["'];)/;
  if (lastLocalImportPattern.test(next)) {
    next = next.replace(lastLocalImportPattern, `$1${helperImport}\n`);
  } else {
    next = `${helperImport}\n${next}`;
  }
}

fs.writeFileSync(appPath, next, "utf8");
console.log(`Updated App.tsx today date helper usage. Replaced ${replacementCount} occurrence(s).`);
console.log('Next step: run "npm run build".');
