import fs from "node:fs";
import path from "node:path";

const requiredFiles = [
  "src/census/parser/censusTypes.ts",
  "src/census/parser/normalizeRawCensusText.ts",
  "src/census/parser/fieldExtractors.ts",
  "src/census/parser/duplicateDetection.ts",
  "src/census/parser/cleanCensusRows.ts",
  "src/census/parser/censusReconciliation.ts",
  "src/census/parser/pccResidentListingParser.ts",
  "src/census/parser/parseCensusText.ts",
  "src/census/parser/residentAdapter.ts",
  "src/census/parser/censusImportSummary.ts",
  "src/census/parser/censusSafeSaveMode.ts",
  "src/census/parser/index.ts",
];

const requiredExports = [
  { file: "src/census/parser/censusTypes.ts", names: ["RawCensusImportInput", "ParsedResident", "ParsedCensusResult", "CleanCensusRow", "CensusReconciliationResult"] },
  { file: "src/census/parser/normalizeRawCensusText.ts", names: ["normalizeRawCensusText", "normalizeDate", "createResidentKey"] },
  { file: "src/census/parser/fieldExtractors.ts", names: ["detectReportDate", "splitResidentBlocks", "extractResidentName", "extractRoomBed", "extractMrn", "extractDob", "detectResidentStatus"] },
  { file: "src/census/parser/duplicateDetection.ts", names: ["detectDuplicates"] },
  { file: "src/census/parser/cleanCensusRows.ts", names: ["toCleanCensusRows"] },
  { file: "src/census/parser/censusReconciliation.ts", names: ["reconcileCensusImport"] },
  { file: "src/census/parser/pccResidentListingParser.ts", names: ["isPccResidentListingFormat", "normalizePccResidentRows", "parsePccResidentListingRow", "parsePccResidentListingText"] },
  { file: "src/census/parser/parseCensusText.ts", names: ["parseResidentBlock", "parseCensusText"] },
  { file: "src/census/parser/residentAdapter.ts", names: ["parsedResidentToResidentPreview", "parsedResidentsToResidentPreview"] },
  { file: "src/census/parser/censusImportSummary.ts", names: ["CensusImportSummary", "CensusImportSummaryItem", "createCensusImportSummary", "getCensusImportSummaryMessage"] },
  { file: "src/census/parser/censusSafeSaveMode.ts", names: ["CensusSafeSaveMode", "CensusSafeSaveModeOption", "CensusSafeSaveDecision", "CENSUS_SAFE_SAVE_MODE_OPTIONS", "getCensusSafeSaveModeOption", "getDefaultCensusSafeSaveMode", "getCensusSafeSaveDecision", "getCensusSafeSaveModeMessage"] },
];

const barrelRequiredLines = [
  'export * from "./censusTypes";',
  'export * from "./normalizeRawCensusText";',
  'export * from "./fieldExtractors";',
  'export * from "./duplicateDetection";',
  'export * from "./cleanCensusRows";',
  'export * from "./censusReconciliation";',
  'export * from "./pccResidentListingParser";',
  'export * from "./parseCensusText";',
  'export * from "./residentAdapter";',
  'export * from "./censusImportSummary";',
  'export * from "./censusSafeSaveMode";',
];

let errors = 0;

console.log("Census Parser Foundation Verification\n");

for (const relativePath of requiredFiles) {
  const fullPath = path.resolve(relativePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ Missing file: ${relativePath}`);
    errors += 1;
  } else {
    console.log(`✅ Found file: ${relativePath}`);
  }
}

console.log("\nChecking key exports...\n");

for (const check of requiredExports) {
  const fullPath = path.resolve(check.file);
  if (!fs.existsSync(fullPath)) continue;

  const content = fs.readFileSync(fullPath, "utf8");
  for (const name of check.names) {
    const exportPattern = new RegExp(`export\\s+(interface|type|function|const)\\s+${name}\\b`);
    if (!exportPattern.test(content)) {
      console.log(`❌ Missing export ${name} in ${check.file}`);
      errors += 1;
    } else {
      console.log(`✅ Export present: ${name}`);
    }
  }
}

console.log("\nChecking parser barrel exports...\n");

const barrelPath = path.resolve("src/census/parser/index.ts");
if (fs.existsSync(barrelPath)) {
  const barrel = fs.readFileSync(barrelPath, "utf8");
  for (const line of barrelRequiredLines) {
    if (!barrel.includes(line)) {
      console.log(`❌ Missing barrel export: ${line}`);
      errors += 1;
    } else {
      console.log(`✅ Barrel export present: ${line}`);
    }
  }
}

console.log("\nSummary:");
if (errors > 0) {
  console.log(`Census parser foundation verification failed with ${errors} issue(s).`);
  process.exit(1);
}

console.log("Census parser foundation verification passed.");
console.log('Next step: run "npm run build".');
