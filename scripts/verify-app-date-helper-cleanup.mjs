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
    label: "Today date input patterns",
    recommendedHelper: "getTodayDateInputValue",
    patterns: [
      "new Date().toISOString().slice(0, 10)",
      "new Date().toISOString().substring(0, 10)",
    ],
  },
  {
    label: "Date input conversion patterns",
    recommendedHelper: "toDateInputValue",
    patterns: [
      ".toISOString().slice(0, 10)",
      ".toISOString().substring(0, 10)",
    ],
  },
  {
    label: "Date-time input conversion patterns",
    recommendedHelper: "toDateTimeInputValue",
    patterns: [
      ".toISOString().slice(0, 16)",
      ".toISOString().substring(0, 16)",
    ],
  },
  {
    label: "Date display formatting patterns",
    recommendedHelper: "formatDateForDisplay",
    patterns: [".toLocaleDateString("],
  },
  {
    label: "Date-time display formatting patterns",
    recommendedHelper: "formatDateTimeForDisplay",
    patterns: [".toLocaleString("],
  },
  {
    label: "Time display formatting patterns",
    recommendedHelper: "formatTimeForDisplay",
    patterns: [".toLocaleTimeString("],
  },
  {
    label: "Simple past date comparison patterns",
    recommendedHelper: "isPastDate",
    patterns: [") < new Date()", ".getTime() < new Date().getTime()"],
  },
  {
    label: "Simple future date comparison patterns",
    recommendedHelper: "isFutureDate",
    patterns: [") > new Date()", ".getTime() > new Date().getTime()"],
  },
];

let totalMatches = 0;

console.log("App.tsx Date Helper Cleanup Verification\n");

for (const check of checks) {
  const matches = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.includes("from \"./utils/appHelpers\"") || trimmed.includes("from './utils/appHelpers'")) {
      return;
    }

    if (check.patterns.some((pattern) => trimmed.includes(pattern))) {
      matches.push({ lineNumber: index + 1, text: trimmed });
    }
  });

  if (matches.length === 0) {
    console.log(`✅ ${check.label}: no obvious remaining patterns found.`);
    continue;
  }

  totalMatches += matches.length;
  console.log(`\n⚠️  ${check.label}: ${matches.length} possible remaining pattern(s).`);
  console.log(`   Recommended helper: ${check.recommendedHelper}`);
  for (const match of matches) {
    console.log(`   Line ${match.lineNumber}: ${match.text}`);
  }
}

console.log("\nSummary:");
console.log(`Found ${totalMatches} possible remaining date/time cleanup pattern(s).`);

if (totalMatches > 0) {
  console.log("\nPhase B date helper cleanup is not fully complete yet.");
  console.log("Run the targeted refactor scripts, review the diff, then run npm run build.");
  process.exit(1);
}

console.log("\nPhase B date helper cleanup verification passed.");
console.log('Next step: run "npm run build".');
