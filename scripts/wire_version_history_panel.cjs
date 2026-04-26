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

if (source.includes('<VersionHistoryPanel') && source.includes('key="help-staff"')) {
  if (source !== original) {
    fs.writeFileSync(appPath, source);
    console.log('VersionHistoryPanel import added. Staff/admin help panel was already wired.');
  } else {
    console.log('VersionHistoryPanel already wired for staff/admin Help page. No changes made.');
  }
  process.exit(0);
}

const adminHelpMarker = '{activeTab === "help" && currentUser?.role === "admin" && (';
const adminHelpStart = source.indexOf(adminHelpMarker);
if (adminHelpStart < 0) {
  console.error('Could not find admin-gated Help/System Guide tab block. No changes made.');
  process.exit(1);
}

const staffHelpBlock = `
          {activeTab === "help" && currentUser?.role !== "admin" && (
            <motion.div
              key="help-staff"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
              className="space-y-6"
            >
              <VersionHistoryPanel currentUserRole={currentUser?.role} />
            </motion.div>
          )}

`;

if (!source.includes('key="help-staff"')) {
  source = source.slice(0, adminHelpStart) + staffHelpBlock + source.slice(adminHelpStart);
}

// Insert the panel at the top of the existing admin Help block, before the first Card.
if (!source.includes('<VersionHistoryPanel currentUserRole={currentUser?.role} />\n              <Card')) {
  const updatedAdminHelpStart = source.indexOf(adminHelpMarker);
  const nextBlockStart = source.indexOf('{activeTab ===', updatedAdminHelpStart + adminHelpMarker.length);
  const searchEnd = nextBlockStart > updatedAdminHelpStart ? nextBlockStart : source.length;
  const firstCard = source.indexOf('<Card', updatedAdminHelpStart);

  if (firstCard < 0 || firstCard > searchEnd) {
    console.error('Could not find first Card in admin Help block. Staff block/import may have been added; no admin panel inserted.');
    fs.writeFileSync(appPath, source);
    process.exit(1);
  }

  const panelBlock = `
              <VersionHistoryPanel currentUserRole={currentUser?.role} />
`;
  source = source.slice(0, firstCard) + panelBlock + source.slice(firstCard);
}

fs.writeFileSync(appPath, source);
console.log('VersionHistoryPanel wired into Help/System Guide page for staff and admin. Run npm run build next.');
