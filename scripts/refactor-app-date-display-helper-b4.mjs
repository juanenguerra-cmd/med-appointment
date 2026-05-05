import fs from "node:fs";
import path from "node:path";

const appPath = path.resolve("src/App.tsx");

if (!fs.existsSync(appPath)) {
  console.error("src/App.tsx was not found. Run this script from the repository root.");
  process.exit(1);
}

const source = fs.readFileSync(appPath, "utf8");
let next = source;

const helperImports = new Set();
let replacementCount = 0;

const replacements = [
  {
    helper: "formatDateForDisplay",
    patterns: [
      /new Date\(([^\n;]+?)\)\.toLocaleDateString\(\)/g,
      /new Date\(([^\n;]+?)\)\.toLocaleDateString\(([^\n;]*?)\)/g,
    ],
  },
  {
    helper: "formatDateTimeForDisplay",
    patterns: [
      /new Date\(([^\n;]+?)\)\.toLocaleString\(\)/g,
      /new Date\(([^\n;]+?)\)\.toLocaleString\(([^\n;]*?)\)/g,
    ],
  },
  {
    helper: "formatTimeForDisplay",
    patterns: [
      /new Date\(([^\n;]+?)\)\.toLocaleTimeString\(\)/g,
      /new Date\(([^\n;]+?)\)\.toLocaleTimeString\(([^\n;]*?)\)/g,
    ],
  },
];

for (const replacement of replacements) {
  for (const pattern of replacement.patterns) {
    next = next.replace(pattern, (match, valueExpression) => {
      const trimmed = valueExpression.trim();

      // Avoid rewriting already refactored helper calls or unusual expressions.
      if (!trimmed || trimmed.includes("formatDate") || trimmed.includes("formatTime")) {
        return match;
      }

      helperImports.add(replacement.helper);
      replacementCount += 1;
      return `${replacement.helper}(${trimmed})`;
    });
  }
}

if (replacementCount === 0) {
  console.log("No date/time display helper replacements were needed in App.tsx.");
  process.exit(0);
}

const helperImportPattern = /import\s+\{([\s\S]*?)\}\s+from\s+["']\.\/utils\/appHelpers["'];/;

if (helperImportPattern.test(next)) {
  next = next.replace(helperImportPattern, (_match, names) => {
    const existing = names
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);

    for (const helperName of helperImports) {
      if (!existing.includes(helperName)) {
        existing.push(helperName);
      }
    }

    const sorted = Array.from(new Set(existing)).sort((a, b) => a.localeCompare(b));
    return `import { ${sorted.join(", ")} } from "./utils/appHelpers";`;
  });
} else {
  const sorted = Array.from(helperImports).sort((a, b) => a.localeCompare(b));
  const helperImport = `import { ${sorted.join(", ")} } from "./utils/appHelpers";`;
  const lastLocalImportPattern = /(import[\s\S]*?from\s+["']\.\/[^"']+["'];\s*\n)(?![\s\S]*import[\s\S]*?from\s+["']\.\/[^"']+["'];)/;

  if (lastLocalImportPattern.test(next)) {
    next = next.replace(lastLocalImportPattern, `$1${helperImport}\n`);
  } else {
    next = `${helperImport}\n${next}`;
  }
}

fs.writeFileSync(appPath, next, "utf8");
console.log(`Updated App.tsx date/time display helper usage. Replaced ${replacementCount} occurrence(s).`);
console.log('Next step: run "npm run build".');
