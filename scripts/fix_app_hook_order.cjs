const fs = require('fs');
const path = require('path');

const appPath = path.join(process.cwd(), 'src', 'App.tsx');
if (!fs.existsSync(appPath)) {
  console.error('src/App.tsx not found. Run this from the repo root.');
  process.exit(1);
}

let source = fs.readFileSync(appPath, 'utf8');
const hookLine = '  const printIframeRef = React.useRef<HTMLIFrameElement>(null);';

// Remove every existing printIframeRef declaration first. This makes the script safe to rerun.
const hookRegex = /\n?\s*const printIframeRef = React\.useRef<HTMLIFrameElement>\(null\);\s*\n?/g;
const removedCount = (source.match(hookRegex) || []).length;
source = source.replace(hookRegex, '\n');
source = source.replace(/\n{3,}/g, '\n\n');

// Insert exactly one hook before the first early return guard that depends on currentUser.
// This regex is intentionally flexible because prior scripts may have changed indentation.
const currentUserGuardRegex = /\n\s*if\s*\(\s*!currentUser\s*\)\s*\{/;
const guardMatch = source.match(currentUserGuardRegex);

if (!guardMatch || guardMatch.index === undefined) {
  console.error('Could not find currentUser guard. No changes made.');
  process.exit(1);
}

const guardStart = guardMatch.index;
const guardText = guardMatch[0];
const normalizedGuardText = guardText.startsWith('\n  ') ? guardText : guardText.replace(/^\n\s*/, '\n  ');

source =
  source.slice(0, guardStart) +
  `\n${hookLine}\n` +
  normalizedGuardText +
  source.slice(guardStart + guardText.length);

// Final safety checks.
const finalHookCount = (source.match(hookRegex) || []).length;
if (finalHookCount !== 1) {
  console.error(`Expected exactly 1 printIframeRef hook declaration, found ${finalHookCount}. No file written.`);
  process.exit(1);
}

const finalHookIndex = source.indexOf('const printIframeRef = React.useRef<HTMLIFrameElement>(null);');
const finalGuardIndex = source.search(/\n\s*if\s*\(\s*!currentUser\s*\)\s*\{/);
if (finalHookIndex < 0 || finalGuardIndex < 0 || finalHookIndex > finalGuardIndex) {
  console.error('printIframeRef hook was not placed before currentUser guard. No file written.');
  process.exit(1);
}

fs.writeFileSync(appPath, source);
console.log(`Fixed printIframeRef hook order. Removed ${removedCount} old declaration(s), inserted 1 declaration before currentUser guard. Run npm run build next.`);
