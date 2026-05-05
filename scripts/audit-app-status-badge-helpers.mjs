import fs from "node:fs";
import path from "node:path";

const appPath = path.resolve("src/App.tsx");

if (!fs.existsSync(appPath)) {
  console.error("src/App.tsx was not found. Run this script from the repository root.");
  process.exit(1);
}

const source = fs.readFileSync(appPath, "utf8");
const lines = source.split(/\r?\n/);

const checks = [
  {
    label: "Appointment status badge logic",
    helper: "getAppointmentStatusMeta",
    patterns: ["status ===", "status !==", ".status ===", ".status !==", "appointment.status", "appt.status"],
  },
  {
    label: "Transport readiness badge logic",
    helper: "getTransportReadinessMeta",
    patterns: ["transportReady", "transport readiness", "Transport Ready", "Transport Not Ready", "transport not ready"],
  },
  {
    label: "Service location badge logic",
    helper: "getServiceLocationMeta",
    patterns: ["serviceInHouse", "service in house", "Service In House", "in-house", "In-House"],
  },
  {
    label: "Round trip badge logic",
    helper: "getRoundTripMeta",
    patterns: ["roundTrip", "round trip", "Round Trip", "one way", "One Way"],
  },
  {
    label: "Escort badge logic",
    helper: "getEscortMeta",
    patterns: ["escort", "Escort", "escortNeeded", "hasEscort"],
  },
  {
    label: "Inline badge class names",
    helper: "getStatusBadgeClassName",
    patterns: ["bg-emerald-50", "bg-amber-50", "bg-rose-50", "bg-sky-50", "bg-violet-50", "ring-emerald-100", "ring-amber-100", "ring-rose-100"],
  },
];

let totalMatches = 0;

console.log("App.tsx Status/Badge Helper Audit\n");
console.log("Suggested import when replacement begins:\n");
console.log('import {');
console.log('  getAppointmentStatusMeta,');
console.log('  getEscortMeta,');
console.log('  getRoundTripMeta,');
console.log('  getServiceLocationMeta,');
console.log('  getStatusBadgeClassName,');
console.log('  getTransportReadinessMeta,');
console.log('} from "./utils/appHelpers";');
console.log("\nMatches found:\n");

for (const check of checks) {
  const matches = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.includes("from \"./utils/appHelpers\"") || trimmed.includes("from './utils/appHelpers'")) {
      return;
    }

    if (check.patterns.some((pattern) => trimmed.toLowerCase().includes(pattern.toLowerCase()))) {
      matches.push({ lineNumber: index + 1, text: trimmed });
    }
  });

  if (matches.length === 0) {
    console.log(`✅ ${check.label}: no obvious matches found.`);
    continue;
  }

  totalMatches += matches.length;
  console.log(`\n⚠️  ${check.label} → consider ${check.helper}`);
  for (const match of matches.slice(0, 30)) {
    console.log(`  Line ${match.lineNumber}: ${match.text}`);
  }

  if (matches.length > 30) {
    console.log(`  ... ${matches.length - 30} more match(es) not shown.`);
  }
}

console.log("\nSummary:");
console.log(`Found ${totalMatches} possible status/badge helper replacement location(s).`);
console.log("\nSafe next step:");
console.log("1. Replace one small badge/status group only.");
console.log("2. Run npm run build.");
console.log("3. Commit only after build passes.");
