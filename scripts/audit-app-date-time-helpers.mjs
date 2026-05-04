import fs from "node:fs";
import path from "node:path";

const appPath = path.resolve("src/App.tsx");

if (!fs.existsSync(appPath)) {
  console.error("src/App.tsx was not found. Run this script from the repository root.");
  process.exit(1);
}

const source = fs.readFileSync(appPath, "utf8");
const lines = source.split(/\r?\n/);

const checks = [
  {
    label: "Date display formatting",
    helper: "formatDateForDisplay",
    patterns: ["toLocaleDateString(", ".toLocaleDateString()"],
  },
  {
    label: "Date-time display formatting",
    helper: "formatDateTimeForDisplay",
    patterns: ["toLocaleString(", ".toLocaleString()"],
  },
  {
    label: "Time display formatting",
    helper: "formatTimeForDisplay",
    patterns: ["toLocaleTimeString(", ".toLocaleTimeString()"],
  },
  {
    label: "Date input conversion",
    helper: "toDateInputValue",
    patterns: ["toISOString().slice(0, 10)", "toISOString().substring(0, 10)"],
  },
  {
    label: "Date-time input conversion",
    helper: "toDateTimeInputValue",
    patterns: ["toISOString().slice(0, 16)", "toISOString().substring(0, 16)"],
  },
  {
    label: "Today date input value",
    helper: "getTodayDateInputValue",
    patterns: ["new Date().toISOString().slice(0, 10)", "new Date().toISOString().substring(0, 10)"],
  },
];

let totalMatches = 0;

console.log("App.tsx Date/Time Helper Audit\n");
console.log("Suggested import when replacement begins:\n");
console.log('import {');
console.log('  formatDateForDisplay,');
console.log('  formatDateTimeForDisplay,');
console.log('  formatTimeForDisplay,');
console.log('  getTodayDateInputValue,');
console.log('  toDateInputValue,');
console.log('  toDateTimeInputValue,');
console.log('} from "./utils/appHelpers";');
console.log("\nMatches found:\n");

for (const check of checks) {
  const matches = [];

  lines.forEach((line, index) => {
    if (check.patterns.some((pattern) => line.includes(pattern))) {
      matches.push({ lineNumber: index + 1, text: line.trim() });
    }
  });

  if (matches.length === 0) {
    console.log(`✅ ${check.label}: no obvious matches found.`);
    return;
  }

  totalMatches += matches.length;
  console.log(`\n⚠️  ${check.label} → consider ${check.helper}`);
  for (const match of matches) {
    console.log(`  Line ${match.lineNumber}: ${match.text}`);
  }
}

console.log("\nSummary:");
console.log(`Found ${totalMatches} possible date/time helper replacement location(s).`);
console.log("\nSafe next step:");
console.log("1. Replace one small group only.");
console.log("2. Run npm run build.");
console.log("3. Commit only after build passes.");

if (totalMatches > 0) {
  process.exitCode = 0;
}
