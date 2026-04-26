const fs = require('fs');
const path = require('path');

const appPath = path.join(process.cwd(), 'src', 'App.tsx');
if (!fs.existsSync(appPath)) {
  console.error('src/App.tsx not found. Run this from the repo root.');
  process.exit(1);
}

let source = fs.readFileSync(appPath, 'utf8');
const original = source;

const importLine = 'import { VersionHistoryPanel } from "./components/VersionHistoryPanel";';
if (!source.includes(importLine)) {
  const anchors = [
    'import { PatientCensusUnitList } from "./components/PatientCensusUnitList";',
    'import { AppointmentCalendar } from "./components/AppointmentCalendar";',
  ];
  const anchor = anchors.find((candidate) => source.includes(candidate));
  if (!anchor) {
    console.error('Could not find a safe import anchor. No changes made.');
    process.exit(1);
  }
  source = source.replace(anchor, `${anchor}\n${importLine}`);
}

function makeStaffHelpNav(indent = '            ', suffix = '0') {
  return `${indent}{currentUser?.role !== "admin" && (\n${indent}  <NavItem\n${indent}    key="nav-help-staff-${suffix}"\n${indent}    active={activeTab === "help"}\n${indent}    onClick={() => goToTab("help")}\n${indent}    icon={<ShieldCheck size={20} />}\n${indent}    label="Guide & Info"\n${indent}  />\n${indent})}\n`;
}

function addStaffHelpNavBeforeAdminWrappers(text) {
  if (text.includes('key="nav-help-staff-')) return text;

  const wrapperRegex = /\{\s*currentUser\?\.role\s*===\s*["']admin["']\s*&&\s*\(\s*<NavItem[\s\S]*?label=["']Help & Info["'][\s\S]*?\/>\s*\)\s*\}/g;
  let count = 0;
  return text.replace(wrapperRegex, (match, ...args) => {
    const offset = args[args.length - 2];
    const before = text.slice(0, offset);
    const indentMatch = before.match(/\n(\s*)$/);
    const indent = indentMatch ? indentMatch[1] : '            ';
    const staff = makeStaffHelpNav(indent, String(count));
    count += 1;
    return `${staff}${match}`;
  });
}

source = addStaffHelpNavBeforeAdminWrappers(source);

function findMatchingCardEnd(text, cardStart) {
  let depth = 0;
  let i = cardStart;
  while (i < text.length) {
    const nextOpen = text.indexOf('<Card', i);
    const nextClose = text.indexOf('</Card>', i);
    if (nextClose === -1) return -1;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      i = nextOpen + 5;
      continue;
    }
    depth -= 1;
    i = nextClose + '</Card>'.length;
    if (depth === 0) return i;
  }
  return -1;
}

function removeCardByTitle(text, title) {
  let result = text;
  let removed = 0;
  while (true) {
    const titleIndex = result.indexOf(`title="${title}"`);
    if (titleIndex < 0) break;
    const cardStart = result.lastIndexOf('<Card', titleIndex);
    if (cardStart < 0) break;
    const cardEnd = findMatchingCardEnd(result, cardStart);
    if (cardEnd < 0) break;
    result = result.slice(0, cardStart) + result.slice(cardEnd);
    removed += 1;
  }
  return { text: result, removed };
}

let removal = removeCardByTitle(source, 'User Guide');
source = removal.text;
const removedGuideCards = removal.removed;
removal = removeCardByTitle(source, 'Version History');
source = removal.text;
const removedHistoryCards = removal.removed;

function findAdminHelpBlock(text) {
  const markerRegex = /\{activeTab\s*===\s*["']help["']\s*&&\s*currentUser\?\.role\s*===\s*["']admin["']\s*&&\s*\(/;
  const match = text.match(markerRegex);
  if (!match || match.index === undefined) return null;
  const start = match.index;
  const endMarkers = [
    '{isAddModalOpen',
    '{isFacModalOpen',
    '{isUserModalOpen',
    '{selectedResident &&',
    '</AnimatePresence>',
  ]
    .map((marker) => text.indexOf(marker, start + 1))
    .filter((index) => index > start);
  if (!endMarkers.length) return null;
  return { start, end: Math.min(...endMarkers), markerLength: match[0].length };
}

const adminHelp = findAdminHelpBlock(source);
if (!adminHelp) {
  console.error('Could not find admin Help/System Guide render block. No changes made.');
  process.exit(1);
}

if (!source.includes('key="help-staff"')) {
  const staffHelpBlock = `          {activeTab === "help" && currentUser?.role !== "admin" && (\n            <motion.div\n              key="help-staff"\n              initial={{ opacity: 0, y: 12 }}\n              animate={{ opacity: 1, y: 0 }}\n              exit={{ opacity: 0, y: -12 }}\n              transition={{ duration: 0.22 }}\n              className="space-y-6"\n            >\n              <VersionHistoryPanel currentUserRole={currentUser?.role} />\n            </motion.div>\n          )}\n\n`;
  source = source.slice(0, adminHelp.start) + staffHelpBlock + source.slice(adminHelp.start);
}

const adminHelpAfterStaff = findAdminHelpBlock(source);
if (!adminHelpAfterStaff) {
  console.error('Could not relocate admin Help/System Guide render block after staff insert.');
  process.exit(1);
}

const adminBlockText = source.slice(adminHelpAfterStaff.start, adminHelpAfterStaff.end);
if (!adminBlockText.includes('<VersionHistoryPanel currentUserRole={currentUser?.role} />')) {
  const firstCard = source.indexOf('<Card', adminHelpAfterStaff.start);
  if (firstCard < 0 || firstCard > adminHelpAfterStaff.end) {
    console.error('Could not find first admin Card to insert VersionHistoryPanel before.');
    process.exit(1);
  }
  const panelBlock = `\n              <VersionHistoryPanel currentUserRole={currentUser?.role} />\n`;
  source = source.slice(0, firstCard) + panelBlock + source.slice(firstCard);
}

if (source === original) {
  console.log('No changes were needed.');
} else {
  fs.writeFileSync(appPath, source);
  console.log(`Help page repaired safely. Added staff Guide & Info nav, added VersionHistoryPanel, removed ${removedGuideCards} old User Guide card(s) and ${removedHistoryCards} old Version History card(s), preserved existing admin tools such as Facility/User Management. Run npm run build next.`);
}
