import fs from "node:fs";
import path from "node:path";

const appPath = path.resolve("src/App.tsx");

if (!fs.existsSync(appPath)) {
  console.error("src/App.tsx was not found. Run this script from the repository root.");
  process.exit(1);
}

const source = fs.readFileSync(appPath, "utf8");
let next = source;

const currentImportPattern = /import\s+\{\s*Appointment\s*,\s*Resident\s*,\s*Facility\s*,\s*TransportationCompany\s*\}\s+from\s+["']\.\/types["'];/;
const replacementImport = 'import type { Appointment, Facility, Resident, TransportationCompany } from "./typeExports";';

if (currentImportPattern.test(next)) {
  next = next.replace(currentImportPattern, replacementImport);
} else if (next.includes(replacementImport)) {
  console.log("App.tsx already uses the type export compatibility import.");
  process.exit(0);
} else {
  console.error("Expected App.tsx type import was not found. No changes were made.");
  console.error('Expected: import { Appointment, Resident, Facility, TransportationCompany } from "./types";');
  process.exit(1);
}

fs.writeFileSync(appPath, next, "utf8");
console.log("Updated App.tsx type imports to use ./typeExports.");
console.log('Next step: run "npm run build".');
