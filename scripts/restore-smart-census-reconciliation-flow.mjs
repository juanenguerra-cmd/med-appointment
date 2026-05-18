import fs from "node:fs";
import path from "node:path";

const appPath = path.resolve("src/App.tsx");

if (!fs.existsSync(appPath)) {
  console.error("src/App.tsx was not found. Run this script from the repository root.");
  process.exit(1);
}

let content = fs.readFileSync(appPath, "utf8");
const original = content;

const legacyAppendBranchPattern = /      if \(censusSkipDuplicates\) \{\n        \/\/ Only append truly new ones\n        const trulyNew = parsedResidentsPreview\.filter\([\s\S]*?\n        batchAddResidents\(trulyNew\);\n      \} else \{\n        \/\/ Systematic override of old census listing\n        replaceResidents\(parsedResidentsPreview\);\n      \}/;

const smartReconcileBranch = `      // Smart census reconciliation is the required save path.
      // This compares the new census against the existing resident registry and classifies:
      // created, updated, reactivated, discharged, and unchanged residents.
      // Do not use append-only here because append-only bypasses updates and discharge detection.
      replaceResidents(parsedResidentsPreview);`;

if (legacyAppendBranchPattern.test(content)) {
  content = content.replace(legacyAppendBranchPattern, smartReconcileBranch);
} else if (content.includes("replaceResidents(parsedResidentsPreview);") && !content.includes("batchAddResidents(trulyNew);")) {
  console.log("App.tsx already appears to use the restored smart reconciliation save flow.");
} else {
  console.warn("Legacy append-only save branch was not found. Review src/App.tsx manually before proceeding.");
}

content = content.replace(
  "getDefaultCensusSafeSaveMode(censusImportSummary),",
  '"update_existing_add_new",',
);

content = content.replace(/\n  getDefaultCensusSafeSaveMode,/, "");

if (content === original) {
  console.log("No changes applied. App.tsx may already be using the restored smart reconciliation flow.");
} else {
  fs.writeFileSync(appPath, content, "utf8");
  console.log("Restored smart census reconciliation flow in src/App.tsx.");
}

console.log("Next steps:");
console.log("  git diff src/App.tsx");
console.log("  npm run verify:census-parser");
console.log("  npm run test:census-parser-fixtures");
console.log("  npm run build");
