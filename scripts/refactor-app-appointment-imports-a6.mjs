import fs from "node:fs";
import path from "node:path";

const appPath = path.resolve("src/App.tsx");

if (!fs.existsSync(appPath)) {
  console.error("src/App.tsx was not found. Run this script from the repository root.");
  process.exit(1);
}

const source = fs.readFileSync(appPath, "utf8");
let next = source;

const appointmentUtilityModules = [
  "appointmentModalToolkit",
  "appointmentDraftHelpers",
  "residentAppointmentMatching",
  "scheduleTime",
  "appointmentStatusHelpers",
  "appointmentFilterHelpers",
  "appointmentSortHelpers",
  "appointmentDisplayHelpers",
  "appointmentReportHelpers",
  "appointmentAnalyticsHelpers",
  "appointmentTableHelpers",
  "appointmentCalendarHelpers",
  "appointmentExportHelpers",
  "appointmentPrintHelpers",
  "appointmentPdfHelpers",
  "appointmentValidationHelpers",
  "appointmentDuplicateHelpers",
  "appointmentModalSafetyHelpers",
  "appointmentModalWorkflowHelpers",
  "appointmentModalFieldHelpers",
  "appointmentModalSaveHelpers",
];

const collected = new Set();
let removedCount = 0;

for (const moduleName of appointmentUtilityModules) {
  const pattern = new RegExp(
    String.raw`import\s+\{([\s\S]*?)\}\s+from\s+["']\.\/utils\/${moduleName}["'];\s*\n?`,
    "g",
  );

  next = next.replace(pattern, (_match, names) => {
    names
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
      .forEach((name) => collected.add(name));
    removedCount += 1;
    return "";
  });
}

const existingAppointmentBarrelPattern = /import\s+\{([\s\S]*?)\}\s+from\s+["']\.\/utils\/appointment["'];/;
if (existingAppointmentBarrelPattern.test(next)) {
  next = next.replace(existingAppointmentBarrelPattern, (_match, names) => {
    names
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
      .forEach((name) => collected.add(name));
    return "__APPOINTMENT_BARREL_PLACEHOLDER__";
  });
}

if (collected.size === 0) {
  console.log("No App.tsx appointment utility import cleanup was needed.");
  process.exit(0);
}

const sortedNames = Array.from(collected).sort((a, b) => a.localeCompare(b));
const replacementImport = `import { ${sortedNames.join(", ")} } from "./utils/appointment";`;

if (next.includes("__APPOINTMENT_BARREL_PLACEHOLDER__")) {
  next = next.replace("__APPOINTMENT_BARREL_PLACEHOLDER__", replacementImport);
} else {
  const lastLocalImportPattern = /(import[\s\S]*?from\s+["']\.\/[^"']+["'];\s*\n)(?![\s\S]*import[\s\S]*?from\s+["']\.\/[^"']+["'];)/;
  if (lastLocalImportPattern.test(next)) {
    next = next.replace(lastLocalImportPattern, `$1${replacementImport}\n`);
  } else {
    next = `${replacementImport}\n${next}`;
  }
}

fs.writeFileSync(appPath, next, "utf8");
console.log(`Updated App.tsx appointment utility imports. Removed ${removedCount} direct appointment utility import group(s).`);
console.log('Next step: run "npm run build".');
