import { spawnSync } from "node:child_process";

const steps = [
  ["refactor:app-components", "Component imports"],
  ["refactor:app-types", "Type imports"],
  ["refactor:app-hooks", "Hook imports"],
  ["refactor:app-services", "Service imports"],
  ["refactor:app-data", "Data utility imports"],
  ["refactor:app-appointments", "Appointment utility imports"],
  ["verify:app-phase-a-imports", "Phase A import verification"],
];

console.log("Running App.tsx Phase A import cleanup...\n");

for (const [script, label] of steps) {
  console.log(`▶ ${label}`);
  const result = spawnSync("npm", ["run", script], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    console.error(`\n❌ Failed during: ${label}`);
    console.error(`Command: npm run ${script}`);
    process.exit(result.status ?? 1);
  }

  console.log(`✅ Completed: ${label}\n`);
}

console.log("Phase A import cleanup runner completed.");
console.log('Next step: run "npm run build".');
console.log("If build passes, review git diff, then commit App.tsx changes.");
