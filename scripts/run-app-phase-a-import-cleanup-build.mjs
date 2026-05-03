import { spawnSync } from "node:child_process";

const steps = [
  ["refactor:app-phase-a", "Phase A import cleanup and verification"],
  ["build", "Production build"],
];

console.log("Running App.tsx Phase A import cleanup with build verification...\n");

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

console.log("Phase A import cleanup and build verification completed.");
console.log("Next step: review git diff src/App.tsx, then commit App.tsx if the change is expected.");
