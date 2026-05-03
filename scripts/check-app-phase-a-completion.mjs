import { spawnSync } from "node:child_process";

function run(command, args, label) {
  console.log(`▶ ${label}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    console.error(`\n❌ Failed during: ${label}`);
    console.error(`Command: ${command} ${args.join(" ")}`);
    process.exit(result.status ?? 1);
  }

  console.log(`✅ Completed: ${label}\n`);
}

console.log("Checking App.tsx Phase A completion...\n");

run("npm", ["run", "verify:app-phase-a-imports"], "Phase A import verification");
run("npm", ["run", "build"], "Production build");
run("git", ["status", "--short"], "Git short status");
run("git", ["diff", "--", "src/App.tsx"], "Review App.tsx diff");

console.log("Phase A completion checks finished.");
console.log("\nIf the only expected pending change is src/App.tsx, commit it with:");
console.log('  git add src/App.tsx');
console.log('  git commit -m "Complete App Phase A import cleanup"');
console.log('  git push');
console.log("\nIf package/release files are also pending from this repo update, pull first and rerun the command.");
