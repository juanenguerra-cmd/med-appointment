import fs from "node:fs";
import path from "node:path";

const filesToInspect = [
  "src/pages/CensusPage.tsx",
  "src/App.tsx",
  "src/types.ts",
];

const checks = [
  {
    file: "src/pages/CensusPage.tsx",
    label: "Census page paste state prop",
    patterns: ["censusPasteText", "setCensusPasteText"],
  },
  {
    file: "src/pages/CensusPage.tsx",
    label: "Census page preview state prop",
    patterns: ["parsedResidentsPreview", "setParsedResidentsPreview"],
  },
  {
    file: "src/pages/CensusPage.tsx",
    label: "Census page parse/save handlers",
    patterns: ["handleParseCensus", "handleSaveCensus"],
  },
  {
    file: "src/App.tsx",
    label: "App census parse handler implementation",
    patterns: ["handleParseCensus", "parseCensus", "parsedResidentsPreview", "censusPasteText"],
  },
  {
    file: "src/types.ts",
    label: "Resident shape for parsed preview mapping",
    patterns: ["export interface Resident", "type Resident", "roomNumber", "mrn", "doctor"],
  },
];

let issues = 0;

console.log("Census Page Parser Wiring Audit\n");

for (const relativePath of filesToInspect) {
  const fullPath = path.resolve(relativePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ Missing file: ${relativePath}`);
    issues += 1;
  } else {
    console.log(`✅ Found file: ${relativePath}`);
  }
}

console.log("\nWiring points:\n");

for (const check of checks) {
  const fullPath = path.resolve(check.file);
  if (!fs.existsSync(fullPath)) continue;

  const content = fs.readFileSync(fullPath, "utf8");
  const lines = content.split(/\r?\n/);
  const matches = [];

  lines.forEach((line, index) => {
    if (check.patterns.some((pattern) => line.includes(pattern))) {
      matches.push({ lineNumber: index + 1, text: line.trim() });
    }
  });

  if (matches.length === 0) {
    console.log(`⚠️  ${check.label}: no obvious matches found in ${check.file}`);
    continue;
  }

  console.log(`\n✅ ${check.label} (${check.file})`);
  for (const match of matches.slice(0, 40)) {
    console.log(`  Line ${match.lineNumber}: ${match.text}`);
  }
  if (matches.length > 40) console.log(`  ... ${matches.length - 40} more match(es) not shown.`);
}

console.log("\nRecommended safe wiring order:");
console.log("1. Keep CensusPage UI unchanged.");
console.log("2. Add an adapter that maps ParsedResident to the existing Resident preview shape.");
console.log("3. Replace only App.tsx handleParseCensus internals to call parseCensusText.");
console.log("4. Keep handleSaveCensus unchanged for the first wiring pass.");
console.log("5. Run npm run verify:census-parser and npm run build.");

if (issues > 0) process.exit(1);
