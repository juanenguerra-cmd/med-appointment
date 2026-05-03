import fs from "node:fs";
import path from "node:path";

const appPath = path.resolve("src/App.tsx");

if (!fs.existsSync(appPath)) {
  console.error("src/App.tsx was not found. Run this script from the repository root.");
  process.exit(1);
}

const source = fs.readFileSync(appPath, "utf8");
let next = source;

const directComponentImports = [
  /import\s+\{\s*Button\s*\}\s+from\s+["']\.\/components\/Button["'];\s*\n?/g,
  /import\s+\{\s*Card\s*\}\s+from\s+["']\.\/components\/Card["'];\s*\n?/g,
  /import\s+\{\s*LockScreen\s*\}\s+from\s+["']\.\/components\/LockScreen["'];\s*\n?/g,
  /import\s+\{\s*AppointmentModal\s*\}\s+from\s+["']\.\/components\/appointments\/AppointmentModal["'];\s*\n?/g,
];

let removedCount = 0;
for (const pattern of directComponentImports) {
  next = next.replace(pattern, (match) => {
    removedCount += 1;
    return "";
  });
}

const barrelImport = 'import { AppointmentModal, Button, Card, LockScreen } from "./components";\n';

if (!next.includes('from "./components"') && !next.includes("from './components'")) {
  const lastLucideImportPattern = /(import\s+\{[\s\S]*?\}\s+from\s+["']lucide-react["'];\s*\n)/;
  if (lastLucideImportPattern.test(next)) {
    next = next.replace(lastLucideImportPattern, `$1${barrelImport}`);
  } else {
    next = `${barrelImport}${next}`;
  }
}

if (next === source) {
  console.log("No App.tsx component import changes were needed.");
  process.exit(0);
}

fs.writeFileSync(appPath, next, "utf8");
console.log(`Updated App.tsx component imports. Removed ${removedCount} direct component import(s).`);
console.log('Next step: run "npm run build".');
