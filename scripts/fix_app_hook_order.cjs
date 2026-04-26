const fs = require('fs');
const path = require('path');

const appPath = path.join(process.cwd(), 'src', 'App.tsx');
if (!fs.existsSync(appPath)) {
  console.error('src/App.tsx not found. Run this from the repo root.');
  process.exit(1);
}

let source = fs.readFileSync(appPath, 'utf8');
const hookLine = '  const printIframeRef = React.useRef<HTMLIFrameElement>(null);';
const currentUserGuard = '  if (!currentUser) {';

if (!source.includes(currentUserGuard)) {
  console.error('Could not find currentUser guard. No changes made.');
  process.exit(1);
}

// Remove every existing printIframeRef declaration first. This makes the script safe to rerun.
const hookRegex = /\n?\s*const printIframeRef = React\.useRef<HTMLIFrameElement>\(null\);\s*\n?/g;
const removedCount = (source.match(hookRegex) || []).length;
source = source.replace(hookRegex, '\n');

// Collapse excessive blank lines created by removal.
source = source.replace(/\n{3,}/g, '\n\n');

// Insert exactly one hook before the currentUser early return.
source = source.replace(currentUserGuard, `${hookLine}\n\n${currentUserGuard}`);

fs.writeFileSync(appPath, source);
console.log(`Fixed printIframeRef hook order. Removed ${removedCount} old declaration(s), inserted 1 declaration before currentUser guard. Run npm run build next.`);
