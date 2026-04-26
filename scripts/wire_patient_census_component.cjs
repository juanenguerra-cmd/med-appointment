const fs = require('fs');
const path = require('path');

const appPath = path.join(process.cwd(), 'src', 'App.tsx');
if (!fs.existsSync(appPath)) {
  console.error('src/App.tsx not found. Run this from the repo root.');
  process.exit(1);
}

let source = fs.readFileSync(appPath, 'utf8');
const original = source;

const componentImport = 'import { PatientCensusUnitList } from "./components/PatientCensusUnitList";';
if (!source.includes(componentImport)) {
  const anchor = 'import { AppointmentCalendar } from "./components/AppointmentCalendar";';
  if (!source.includes(anchor)) {
    console.error('Could not find AppointmentCalendar import anchor. No changes made.');
    process.exit(1);
  }
  source = source.replace(anchor, `${anchor}\n${componentImport}`);
}

const componentBlock = `<PatientCensusUnitList
                residents={residents}
                searchQuery={censusSearchQuery}
                onSearchChange={setCensusSearchQuery}
                onViewDetails={(resident) => {
                  setSelectedResident(resident);
                  setIsResidentDetailOpen(true);
                }}
                onDeleteResident={deleteResident}
              />`;

if (source.includes('<PatientCensusUnitList')) {
  if (source !== original) {
    fs.writeFileSync(appPath, source);
    console.log('PatientCensusUnitList import added. Component was already wired.');
  } else {
    console.log('PatientCensusUnitList already wired. No changes made.');
  }
  process.exit(0);
}

function findCensusTabBlock(text) {
  const start = text.indexOf('{activeTab === "census" && (');
  if (start < 0) return null;
  const nextHelp = text.indexOf('{activeTab === "help" && (', start + 1);
  const nextAnimateClose = text.indexOf('</AnimatePresence>', start + 1);
  const end = nextHelp > 0 ? nextHelp : nextAnimateClose;
  if (end < 0) return null;
  return { start, end };
}

function findCardAround(text, fromIndex) {
  const start = text.lastIndexOf('<Card', fromIndex);
  const end = text.indexOf('</Card>', fromIndex);
  if (start < 0 || end < 0) return null;
  return { start, end: end + '</Card>'.length };
}

const censusBlock = findCensusTabBlock(source);
if (!censusBlock) {
  console.error('Could not locate the Patient Census tab block. No changes made.');
  process.exit(1);
}

const censusText = source.slice(censusBlock.start, censusBlock.end);
const markers = [
  'Active Patient Census',
  'Resident Directory',
  'Resident Registry',
  'Current Residents',
  'residents.map',
  'deleteResident',
];

let selectedRange = null;
for (const marker of markers) {
  const relative = censusText.indexOf(marker);
  if (relative < 0) continue;
  const absolute = censusBlock.start + relative;
  const card = findCardAround(source, absolute);
  if (card && card.start >= censusBlock.start && card.end <= censusBlock.end) {
    selectedRange = card;
    break;
  }
}

if (!selectedRange) {
  console.error('Could not find the resident listing card inside the Patient Census tab.');
  console.error('No changes made. The component file exists, but App.tsx still needs manual wiring.');
  process.exit(1);
}

source = source.slice(0, selectedRange.start) + componentBlock + source.slice(selectedRange.end);

fs.writeFileSync(appPath, source);
console.log('PatientCensusUnitList wired into App.tsx. Run npm run build next.');
