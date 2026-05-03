import fs from "node:fs";
import path from "node:path";

const appPath = path.resolve("src/App.tsx");

if (!fs.existsSync(appPath)) {
  console.error("src/App.tsx was not found. Run this script from the repository root.");
  process.exit(1);
}

const source = fs.readFileSync(appPath, "utf8");
let next = source;

const directNamedHookImport = /import\s+\{\s*useHealthData\s*\}\s+from\s+["']\.\/hooks\/useHealthData["'];/;
const directDefaultHookImport = /import\s+useHealthData\s+from\s+["']\.\/hooks\/useHealthData["'];/;
const replacementImport = 'import { useHealthData } from "./hooks";';

if (directNamedHookImport.test(next)) {
  next = next.replace(directNamedHookImport, replacementImport);
} else if (directDefaultHookImport.test(next)) {
  next = next.replace(directDefaultHookImport, replacementImport);
} else if (next.includes(replacementImport)) {
  console.log("App.tsx already uses the hook barrel import.");
  process.exit(0);
} else {
  console.error("Expected App.tsx useHealthData import was not found. No changes were made.");
  console.error('Expected: import { useHealthData } from "./hooks/useHealthData";');
  console.error('Or:       import useHealthData from "./hooks/useHealthData";');
  process.exit(1);
}

fs.writeFileSync(appPath, next, "utf8");
console.log("Updated App.tsx hook import to use ./hooks.");
console.log('Next step: run "npm run build".');
