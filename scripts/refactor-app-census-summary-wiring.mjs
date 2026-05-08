import fs from "node:fs";
import path from "node:path";

const appPath = path.resolve("src/App.tsx");

if (!fs.existsSync(appPath)) {
  console.error("src/App.tsx was not found. Run this script from the repository root.");
  process.exit(1);
}

let next = fs.readFileSync(appPath, "utf8");
let updates = 0;

const parserImportPattern = /import\s+\{([\s\S]*?)\}\s+from\s+["']\.\/census\/parser["'];/;
if (parserImportPattern.test(next)) {
  next = next.replace(parserImportPattern, (_match, names) => {
    const existing = names
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
    for (const name of ["createCensusImportSummary", "type CensusImportSummary"]) {
      if (!existing.includes(name)) {
        existing.push(name);
        updates += 1;
      }
    }
    return `import { ${Array.from(new Set(existing)).sort().join(", ")} } from "./census/parser";`;
  });
} else {
  const importAnchor = 'import { AppointmentsPage } from "./pages/AppointmentsPage";';
  const newImport = 'import { createCensusImportSummary, type CensusImportSummary } from "./census/parser";';
  if (next.includes(importAnchor) && !next.includes(newImport)) {
    next = next.replace(importAnchor, `${importAnchor}\n${newImport}`);
    updates += 1;
  }
}

if (!next.includes("const [censusImportSummary, setCensusImportSummary]")) {
  const previewStatePattern = /const \[parsedResidentsPreview, setParsedResidentsPreview\] = useState<([^>]+)>\(\[\]\);/;
  if (previewStatePattern.test(next)) {
    next = next.replace(
      previewStatePattern,
      (match) => `${match}\n  const [censusImportSummary, setCensusImportSummary] = useState<CensusImportSummary | null>(null);`,
    );
    updates += 1;
  } else {
    console.warn("Could not locate parsedResidentsPreview state. Add censusImportSummary state manually near the census preview state.");
  }
}

if (next.includes("const parsed = parseCensusText(") && !next.includes("const summary = createCensusImportSummary(parsed);")) {
  next = next.replace(
    "      const previewRows = parsedResidentsToResidentPreview(",
    "      const summary = createCensusImportSummary(parsed);\n      const previewRows = parsedResidentsToResidentPreview(",
  );
  updates += 1;
}

if (next.includes("setParsedResidentsPreview(filteredRows);") && !next.includes("setCensusImportSummary(summary);")) {
  next = next.replace(
    "      setParsedResidentsPreview(filteredRows);",
    "      setParsedResidentsPreview(filteredRows);\n      setCensusImportSummary(summary);",
  );
  updates += 1;
}

if (next.includes("setParsedResidentsPreview([]);") && !next.includes("setCensusImportSummary(null);")) {
  next = next.replace(
    "setParsedResidentsPreview([]);",
    "setParsedResidentsPreview([]);\n    setCensusImportSummary(null);",
  );
  updates += 1;
}

if (next.includes("<CensusPage") && !next.includes("censusImportSummary={censusImportSummary}")) {
  const censusPageStart = next.indexOf("<CensusPage");
  const censusPageEnd = next.indexOf("/>", censusPageStart);
  if (censusPageStart !== -1 && censusPageEnd !== -1) {
    const before = next.slice(0, censusPageEnd);
    const after = next.slice(censusPageEnd);
    next = `${before}\n                censusImportSummary={censusImportSummary}\n                setCensusImportSummary={setCensusImportSummary}${after}`;
    updates += 1;
  } else {
    console.warn("Could not locate CensusPage JSX close. Add censusImportSummary props manually.");
  }
}

fs.writeFileSync(appPath, next, "utf8");
console.log(`Prepared App.tsx census import summary wiring. Applied ${updates} update(s).`);
console.log("Next steps:");
console.log("  npm run verify:census-parser");
console.log("  npm run test:census-parser-fixtures");
console.log("  npm run build");
console.log("Then review: git diff src/App.tsx");
