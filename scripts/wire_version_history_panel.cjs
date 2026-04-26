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

if (source.includes('<VersionHistoryPanel')) {
  if (source !== original) {
    fs.writeFileSync(appPath, source);
    console.log('VersionHistoryPanel import added. Panel was already wired.');
  } else {
    console.log('VersionHistoryPanel already wired. No changes made.');
  }
  process.exit(0);
}

const helpMarker = '{activeTab === "help" && (';
const helpStart = source.indexOf(helpMarker);
if (helpStart < 0) {
  console.error('Could not find Help/System Guide tab block. No changes made.');
  process.exit(1);
}

const possibleEnds = [
  source.indexOf('{isAddModalOpen', helpStart + helpMarker.length),
  source.indexOf('{isFacModalOpen', helpStart + helpMarker.length),
  source.indexOf('{isUserModalOpen', helpStart + helpMarker.length),
  source.indexOf('</AnimatePresence>', helpStart + helpMarker.length),
].filter((index) => index > helpStart);

const helpEnd = possibleEnds.length ? Math.min(...possibleEnds) : source.length;
const firstCard = source.indexOf('<Card', helpStart);
const insertAtCard = firstCard > helpStart && firstCard < helpEnd;

const panelBlock = `
              <VersionHistoryPanel currentUserRole={currentUser?.role} />
`;

if (insertAtCard) {
  source = source.slice(0, firstCard) + panelBlock + source.slice(firstCard);
} else {
  // Fallback: place the panel immediately after the Help condition opens.
  const fallbackInsertAt = helpStart + helpMarker.length;
  source = source.slice(0, fallbackInsertAt) + `\n${panelBlock}` + source.slice(fallbackInsertAt);
}

fs.writeFileSync(appPath, source);
console.log('VersionHistoryPanel wired into Help/System Guide page. Run npm run build next.');
