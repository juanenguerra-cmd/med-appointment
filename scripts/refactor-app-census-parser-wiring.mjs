import fs from "node:fs";
import path from "node:path";

const appPath = path.resolve("src/App.tsx");

if (!fs.existsSync(appPath)) {
  console.error("src/App.tsx was not found. Run this script from the repository root.");
  process.exit(1);
}

let source = fs.readFileSync(appPath, "utf8");
let next = source;
let updates = 0;

const parserImport = 'import { parseCensusText, parsedResidentsToResidentPreview } from "./census/parser";';

if (!next.includes(parserImport)) {
  const importAnchor = 'import { AppointmentsPage } from "./pages/AppointmentsPage";';
  if (!next.includes(importAnchor)) {
    console.error("Could not find AppointmentsPage import anchor. No changes made.");
    process.exit(1);
  }
  next = next.replace(importAnchor, `${importAnchor}\n${parserImport}`);
  updates += 1;
}

const handlerStart = "  const handleParseCensus = () => {";
const handlerEnd = "  const handleSaveCensus = () => {";
const startIndex = next.indexOf(handlerStart);
const endIndex = next.indexOf(handlerEnd);

if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
  console.error("Could not locate handleParseCensus block boundaries. No handler replacement made.");
  fs.writeFileSync(appPath, next, "utf8");
  process.exit(1);
}

const replacementHandler = `  const handleParseCensus = () => {
    if (!censusPasteText.trim()) return;
    setIsParsing(true);

    try {
      const importedAt = new Date().toISOString();
      const parsed = parseCensusText({
        importId: \`census_\${Date.now()}\`,
        sourceType: "paste",
        rawText: censusPasteText,
        importedAt,
        importedBy: currentUser?.id || currentUser?.email || "current-user",
        facilityId: currentFacilityId,
      });

      const previewRows = parsedResidentsToResidentPreview(
        parsed.residents,
        currentFacilityId || "default",
        importedAt,
      );

      const filteredRows = censusSkipDuplicates
        ? previewRows.filter(
            (newRes) =>
              !residents.some(
                (resident) =>
                  (newRes.mrn && resident.mrn === newRes.mrn) ||
                  \`\${resident.name}|\${resident.roomNumber}\`.toLowerCase() ===
                    \`\${newRes.name}|\${newRes.roomNumber}\`.toLowerCase(),
              ),
          )
        : previewRows;

      setParsedResidentsPreview(filteredRows);
    } catch (error) {
      console.error("Failed to parse census", error);
      alert("Unable to parse census. Please review the pasted text and try again.");
    } finally {
      setIsParsing(false);
    }
  };

`;

next = `${next.slice(0, startIndex)}${replacementHandler}${next.slice(endIndex)}`;
updates += 1;

fs.writeFileSync(appPath, next, "utf8");
console.log(`Updated App.tsx census parser wiring. Applied ${updates} update(s).`);
console.log("Next steps:");
console.log("  npm run verify:census-parser");
console.log("  npm run audit:census-page-wiring");
console.log("  npm run build");
console.log("Then review: git diff src/App.tsx");
