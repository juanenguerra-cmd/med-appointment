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
  const anchor = 'import { PatientCensusUnitList } from "./components/PatientCensusUnitList";';
  if (!source.includes(anchor)) {
    console.error('Could not find import anchor. No changes made.');
    process.exit(1);
  }
  source = source.replace(anchor, `${anchor}\n${importLine}`);
}

function removeExistingStaffHelpNav(text) {
  return text.replace(/\n\s*\{currentUser\?\.role !== "admin" && \(\s*\n\s*<NavItem\s*\n\s*key="nav-help-staff-[^\"]+"[\s\S]*?label="Guide & Info"[\s\S]*?\/>\s*\n\s*\)\}/g, '');
}

function makeStaffHelpNav(indent, suffix) {
  return `${indent}{currentUser?.role !== "admin" && (\n${indent}  <NavItem\n${indent}    key="nav-help-staff-${suffix}"\n${indent}    active={activeTab === "help"}\n${indent}    onClick={() => goToTab("help")}\n${indent}    icon={<ShieldCheck size={20} />}\n${indent}    label="Guide & Info"\n${indent}  />\n${indent})}\n`;
}

function addStaffHelpNavBeforeAdminHelp(text) {
  let result = removeExistingStaffHelpNav(text);
  const wrapperRegex = /\{\s*currentUser\?\.role\s*===\s*["']admin["']\s*&&\s*\(\s*<NavItem[\s\S]*?label=["']Help & Info["'][\s\S]*?\/>\s*\)\s*\}/g;
  const matches = [...result.matchAll(wrapperRegex)];

  if (matches.length > 0) {
    for (let i = matches.length - 1; i >= 0; i--) {
      const match = matches[i];
      const insertAt = match.index ?? -1;
      if (insertAt < 0) continue;
      const before = result.slice(0, insertAt);
      const indentMatch = before.match(/\n(\s*)$/);
      const indent = indentMatch ? indentMatch[1] : '            ';
      result = result.slice(0, insertAt) + makeStaffHelpNav(indent, String(i)) + result.slice(insertAt);
    }
    return result;
  }

  const helpItemRegex = /<NavItem[\s\S]*?label="Help & Info"[\s\S]*?\/>/g;
  const helpMatches = [...result.matchAll(helpItemRegex)];
  for (let i = helpMatches.length - 1; i >= 0; i--) {
    const match = helpMatches[i];
    const insertAt = match.index ?? -1;
    if (insertAt < 0) continue;
    const before = result.slice(0, insertAt);
    const indentMatch = before.match(/\n(\s*)$/);
    const indent = indentMatch ? indentMatch[1] : '            ';
    result = result.slice(0, insertAt) + makeStaffHelpNav(indent, String(i)) + result.slice(insertAt);
  }
  return result;
}

source = addStaffHelpNavBeforeAdminHelp(source);

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

const removedFacility = removeCardByTitle(source, 'Facility Management');
source = removedFacility.text;

function findHelpBlock(text) {
  const markerRegex = /\{activeTab\s*===\s*["']help["']\s*&&\s*\(/;
  const match = text.match(markerRegex);
  if (!match || match.index === undefined) return null;
  const start = match.index;
  const endMarkers = [
    '{isAddModalOpen',
    '{isFacModalOpen',
    '{isUserModalOpen',
    '{selectedResident &&',
    '</AnimatePresence>',
  ].map((marker) => text.indexOf(marker, start + 1)).filter((index) => index > start);
  if (!endMarkers.length) return null;
  return { start, end: Math.min(...endMarkers) };
}

const facilityCard = `
                <Card
                  icon={<Home size={22} />}
                  title="Facility Management"
                  subtitle="Configure the active facility, facility details, and available facility records"
                  action={
                    <Button
                      variant="primary"
                      icon={<Plus size={16} />}
                      onClick={() => {
                        setEditingFac(null);
                        setIsFacModalOpen(true);
                      }}
                    >
                      New Facility
                    </Button>
                  }
                >
                  <div className="space-y-3">
                    {facilities.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm font-bold text-slate-400">
                        No facilities found. Add a facility to begin.
                      </div>
                    ) : (
                      facilities.map((facility) => (
                        <div
                          key={facility.id}
                          className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                              <Home size={18} />
                            </div>
                            <div>
                              <p className="font-black text-slate-800">{facility.name}</p>
                              <p className="text-xs font-semibold text-slate-500">
                                {[facility.address, facility.phone].filter(Boolean).join(" • ") || "No facility details listed"}
                              </p>
                              {facility.id === currentFacilityId && (
                                <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase text-emerald-700">
                                  Current Facility
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button variant="secondary" onClick={() => setCurrentFacilityId(facility.id)}>
                              Set Active
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => {
                                setEditingFac(facility);
                                setIsFacModalOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              icon={<Trash2 size={15} />}
                              onClick={() => {
                                const ok = window.confirm(
                                  `Delete facility ${facility.name}? This does not delete existing appointment records from the database.`
                                );
                                if (ok) deleteFacility(facility.id);
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
`;

const helpBlock = findHelpBlock(source);
if (!helpBlock) {
  console.error('Could not find Help/System Guide render block. No changes made.');
  process.exit(1);
}

const adminGuard = '{currentUser?.role === "admin" && (';
const helpText = source.slice(helpBlock.start, helpBlock.end);
const guardRelative = helpText.indexOf(adminGuard);
if (guardRelative < 0) {
  console.error('Could not find admin-only section inside Help page. No changes made.');
  process.exit(1);
}

const guardAbsolute = helpBlock.start + guardRelative + adminGuard.length;
source = source.slice(0, guardAbsolute) + facilityCard + source.slice(guardAbsolute);

if (source === original) {
  console.log('No changes were needed.');
} else {
  fs.writeFileSync(appPath, source);
  console.log(`Facility Management restored inside current admin-only Help section. Removed ${removedFacility.removed} misplaced Facility Management card(s). Staff Guide & Info nav ensured. Run npm run build next.`);
}
