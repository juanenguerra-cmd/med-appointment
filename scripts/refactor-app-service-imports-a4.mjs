import fs from "node:fs";
import path from "node:path";

const appPath = path.resolve("src/App.tsx");

if (!fs.existsSync(appPath)) {
  console.error("src/App.tsx was not found. Run this script from the repository root.");
  process.exit(1);
}

const source = fs.readFileSync(appPath, "utf8");
let next = source;

const directServiceImport = /import\s+\{\s*reconcileCensusOnBackend\s*\}\s+from\s+["']\.\/services\/censusReconcileService["'];/;
const replacementImport = 'import { reconcileCensusOnBackend } from "./services";';

if (directServiceImport.test(next)) {
  next = next.replace(directServiceImport, replacementImport);
} else if (next.includes(replacementImport)) {
  console.log("App.tsx already uses the services barrel import.");
  process.exit(0);
} else {
  console.log("No App.tsx service import cleanup was needed.");
  process.exit(0);
}

fs.writeFileSync(appPath, next, "utf8");
console.log("Updated App.tsx service imports to use ./services.");
console.log('Next step: run "npm run build".');
