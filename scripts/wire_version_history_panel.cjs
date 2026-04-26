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

// Staff must be able to navigate to Guide & Info. Remove admin-only wrappers around that NavItem only.
source = source.replace(
  /\{\s*currentUser\?\.role\s*===\s*["']admin["']\s*&&\s*\(\s*(<NavItem[\s\S]*?label=["']Guide & Info["'][\s\S]*?\/>\s*)\)\s*\}/g,
  '$1',
);

function findTopLevelHelpBlock(text) {
  const start = text.search(/\{activeTab\s*===\s*["']help["']\s*&&/);
  if (start < 0) return null;

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
  console.log('Help page replaced: VersionHistoryPanel renders for staff/admin, legacy User Guide/Version History cards removed, admin user access card remains admin-only. Run npm run build next.');
}
