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

// Add a staff-only Guide & Info nav item instead of trying to remove the existing admin wrapper.
// This avoids leaving orphan JSX braces in the sidebar/mobile nav sections.
function addStaffHelpNavItems(text) {
  if (text.includes('key="nav-help-staff"')) return text;

  const helpLabelRegex = /<NavItem[\s\S]*?label="Help & Info"[\s\S]*?\/>/g;
  let result = text;
  let added = 0;
  const matches = [...text.matchAll(helpLabelRegex)];

  // There are usually two Help nav items: desktop sidebar and top/mobile tabs.
  // Insert one staff-only item before each existing Help nav item.
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    const insertAt = match.index ?? -1;
    if (insertAt < 0) continue;

    const indentMatch = result.slice(0, insertAt).match(/\n(\s*)$/);
    const indent = indentMatch ? indentMatch[1] : '            ';
    const staffBlock = `${indent}{currentUser?.role !== "admin" && (\n${indent}  <NavItem\n${indent}    key="nav-help-staff-${added}"\n${indent}    active={activeTab === "help"}\n${indent}    onClick={() => goToTab("help")}\n${indent}    icon={<ShieldCheck size={20} />}\n${indent}    label="Guide & Info"\n${indent}  />\n${indent})}\n`;

    result = result.slice(0, insertAt) + staffBlock + result.slice(insertAt);
    added += 1;
  }

  return result;
}

source = addStaffHelpNavItems(source);

function findTopLevelHelpBlock(text) {
  const pattern = /\{activeTab\s*===\s*["']help["']\s*&&[\s\S]*?\(\s*\n\s*<motion\.div/;
  const match = text.match(pattern);
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
  return { start, end: Math.min(...endMarkers) };
}

const helpBlock = findTopLevelHelpBlock(source);
if (!helpBlock) {
  console.error('Could not find the Help/System Guide render block. No changes made.');
  process.exit(1);
}

const replacement = `          {activeTab === "help" && (
            <motion.div
              key="help"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
              className="space-y-6"
            >
              <VersionHistoryPanel currentUserRole={currentUser?.role} />

              {currentUser?.role === "admin" && (
                <Card
                  icon={<User size={22} />}
                  title="User Access Logic"
                  subtitle="Manage facility visibility for staff members"
                  action={
                    <Button
                      variant="primary"
                      icon={<Plus size={16} />}
                      onClick={() => {
                        setEditingUser(null);
                        setIsUserModalOpen(true);
                      }}
                    >
                      New User
                    </Button>
                  }
                >
                  <div className="space-y-3">
                    {users.map((u: any) => (
                      <div key={u.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                            <User size={18} />
                          </div>
                          <div>
                            <p className="font-black text-slate-800">{u.name || u.email}</p>
                            <p className="text-xs font-semibold text-slate-500">{u.email}</p>
                          </div>
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-500">
                            {u.role}
                          </span>
                        </div>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setEditingUser(u);
                            setIsUserModalOpen(true);
                          }}
                        >
                          Access Logic
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </motion.div>
          )}

`;

source = source.slice(0, helpBlock.start) + replacement + source.slice(helpBlock.end);

if (source === original) {
  console.log('No changes were needed.');
} else {
  fs.writeFileSync(appPath, source);
  console.log('Help page replaced safely: VersionHistoryPanel renders for staff/admin, legacy hard-coded guide/history cards removed, admin user access card remains admin-only. Run npm run build next.');
}
