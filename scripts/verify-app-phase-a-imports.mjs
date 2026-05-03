import fs from "node:fs";
import path from "node:path";

const appPath = path.resolve("src/App.tsx");

if (!fs.existsSync(appPath)) {
  console.error("src/App.tsx was not found. Run this script from the repository root.");
  process.exit(1);
}

const source = fs.readFileSync(appPath, "utf8");

const checks = [
  {
    group: "Components",
    expected: 'from "./components"',
    forbidden: [
      'from "./components/Button"',
      'from "./components/Card"',
      'from "./components/LockScreen"',
      'from "./components/appointments/AppointmentModal"',
    ],
  },
  {
    group: "Types",
    expected: 'from "./typeExports"',
    forbidden: ['from "./types"'],
  },
  {
    group: "Hooks",
    expected: 'from "./hooks"',
    forbidden: ['from "./hooks/useHealthData"'],
  },
  {
    group: "Services",
    expected: 'from "./services"',
    forbidden: ['from "./services/censusReconcileService"'],
  },
  {
    group: "Data utilities",
    expected: 'from "./utils/data"',
    forbidden: [
      'from "./utils/dataValidation"',
      'from "./utils/auditLog"',
      'from "./utils/censusReconciliation"',
    ],
  },
  {
    group: "Appointment utilities",
    expected: 'from "./utils/appointment"',
    forbidden: [
      'from "./utils/appointmentModalToolkit"',
      'from "./utils/appointmentDraftHelpers"',
      'from "./utils/residentAppointmentMatching"',
      'from "./utils/scheduleTime"',
      'from "./utils/appointmentStatusHelpers"',
      'from "./utils/appointmentFilterHelpers"',
      'from "./utils/appointmentSortHelpers"',
      'from "./utils/appointmentDisplayHelpers"',
      'from "./utils/appointmentReportHelpers"',
      'from "./utils/appointmentAnalyticsHelpers"',
      'from "./utils/appointmentTableHelpers"',
      'from "./utils/appointmentCalendarHelpers"',
      'from "./utils/appointmentExportHelpers"',
      'from "./utils/appointmentPrintHelpers"',
      'from "./utils/appointmentPdfHelpers"',
      'from "./utils/appointmentValidationHelpers"',
      'from "./utils/appointmentDuplicateHelpers"',
      'from "./utils/appointmentModalSafetyHelpers"',
      'from "./utils/appointmentModalWorkflowHelpers"',
      'from "./utils/appointmentModalFieldHelpers"',
      'from "./utils/appointmentModalSaveHelpers"',
    ],
  },
];

let hasFailure = false;

console.log("App.tsx Phase A import cleanup verification\n");

for (const check of checks) {
  const remainingForbidden = check.forbidden.filter((needle) => source.includes(needle));
  const hasExpected = source.includes(check.expected);

  if (remainingForbidden.length === 0) {
    console.log(`✅ ${check.group}: no direct Phase A imports remain.`);
  } else {
    hasFailure = true;
    console.log(`❌ ${check.group}: direct imports still found:`);
    remainingForbidden.forEach((needle) => console.log(`   - ${needle}`));
  }

  if (!hasExpected) {
    console.log(`ℹ️  ${check.group}: expected barrel import was not found: ${check.expected}`);
    console.log("   This may be okay if App.tsx does not use this group.");
  }
}

console.log("\nNext step: run npm run build after all intended refactors.");

if (hasFailure) {
  console.log("\nPhase A import cleanup is not complete yet.");
  process.exit(1);
}

console.log("\nPhase A import cleanup verification passed.");
