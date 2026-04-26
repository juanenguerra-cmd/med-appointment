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

const hookCount = (source.match(new RegExp(hookLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
if (hookCount === 0) {
  console.error('Could not find printIframeRef hook. No changes made.');
  process.exit(1);
}

const hookIndex = source.indexOf(hookLine);
const guardIndex = source.indexOf(currentUserGuard);
if (guardIndex < 0) {
  console.error('Could not find currentUser guard. No changes made.');
  process.exit(1);
}

if (hookIndex < guardIndex) {
  console.log('printIframeRef hook is already before the currentUser guard. No changes needed.');
  process.exit(0);
}

// Remove the later hook line, then insert it before the currentUser early return.
source = source.replace(`${hookLine}\n\n`, '');
source = source.replace(currentUserGuard, `${hookLine}\n\n${currentUserGuard}`);

fs.writeFileSync(appPath, source);
console.log('Moved printIframeRef hook before currentUser early return. Run npm run build next.');
