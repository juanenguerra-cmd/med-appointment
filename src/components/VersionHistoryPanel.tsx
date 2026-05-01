import { History, CheckCircle2 } from "lucide-react";

interface VersionEntry {
  version: string;
  releaseDate: string;
  title: string;
  summary: string;
  capabilities: string[];
  processFlow: string[];
  userImpact: string[];
}

const CURRENT_VERSION = "2.4.0";

const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "2.4.0",
    releaseDate: "2026-04-30",
    title: "Security Hardening: Password Hashing",
    summary:
      "This release hardens password storage while preserving login continuity through automatic legacy password upgrade after successful login.",
    capabilities: [
      "New passwords are stored as PBKDF2-SHA256 hashes in the existing users.password field.",
      "Existing plain-text passwords still work once and are automatically upgraded to hashed storage after successful login.",
      "Password setup, new user creation, and password update flows now store hashes instead of plain text.",
      "No D1 migration is required because the existing password column stores the new hash string.",
    ],
    processFlow: [
      "Pull the latest main branch.",
      "Run npm run build before deployment.",
      "Deploy the Worker so password hashing is active.",
      "Have existing users log in once so legacy passwords upgrade automatically.",
    ],
    userImpact: [
      "Improves security by removing new plain-text password storage.",
      "Preserves existing user access during the transition.",
      "Creates a safer baseline for future session and authorization middleware.",
    ],
  },
  {
    version: "2.3.0",
    releaseDate: "2026-04-30",
    title: "Next-Phase Architecture Cleanup Baseline",
    summary:
      "Aligned package metadata, kept Census View modal ownership clean, and prepared the app for security and modularization work.",
    capabilities: [
      "Package metadata identifies the app as med-appointment v2.3.0.",
      "Patient Census keeps resident detail display owned by PatientCensusUnitList.",
      "Legacy parent modal props are retained as temporary no-ops for build-safe App.tsx cleanup.",
    ],
    processFlow: [
      "Pull latest main branch.",
      "Run npm run build.",
      "Open Patient Census and select View to confirm one resident-detail modal opens.",
    ],
    userImpact: [
      "Version identity is clearer.",
      "Census View remains stable.",
      "Creates a clean baseline for future cleanup work.",
    ],
  },
  {
    version: "2.2.2",
    releaseDate: "2026-04-30",
    title: "D1 Migration Cleanup and Current Baseline",
    summary:
      "Cleaned overlapping migration ownership while preserving schema alignment and Census View modal behavior.",
    capabilities: [
      "Reduced duplicate-column risk in future fresh database setup.",
      "Kept D1 schema ownership clearer for future small migrations.",
      "Preserved the corrected Census View behavior.",
    ],
    processFlow: [
      "Run migrations in order for fresh environments.",
      "Avoid re-running previously applied migration names on deployed databases.",
      "Use small, specific migrations for future database changes.",
    ],
    userImpact: [
      "Fewer migration conflicts.",
      "Cleaner database maintenance baseline.",
      "Stable Census View workflow.",
    ],
  },
  {
    version: "2.2.1",
    releaseDate: "2026-04-30",
    title: "D1 Schema Alignment and Census View Modal Fix",
    summary:
      "Aligned D1 with the current Worker/API contract and fixed the Patient Census View workflow so resident details open from one owner.",
    capabilities: [
      "Added D1 coverage for current facility, transportation, resident, and appointment fields.",
      "Corrected Census View modal ownership.",
      "Updated help and release notes for post-deployment validation.",
    ],
    processFlow: [
      "Apply D1 migrations.",
      "Open Census View for a resident.",
      "Create or edit appointments to verify column alignment.",
    ],
    userImpact: [
      "Reduced save errors from missing D1 columns.",
      "Prevented duplicate resident-detail modals.",
      "Created a clearer deployed baseline.",
    ],
  },
];

export function VersionHistoryPanel() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-black text-slate-800">
          <History size={18} className="text-sky-700" /> Version History
        </div>
        <span className="inline-flex w-fit items-center rounded-full bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-sky-800 ring-1 ring-sky-100">
          Current v{CURRENT_VERSION}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {VERSION_HISTORY.map((entry) => (
          <details key={entry.version} className="rounded-2xl border border-slate-100 bg-slate-50 p-4" open={entry.version === CURRENT_VERSION}>
            <summary className="cursor-pointer text-sm font-black text-slate-800">
              v{entry.version} — {entry.title}
              {entry.version === CURRENT_VERSION && (
                <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-100">
                  Current
                </span>
              )}
            </summary>
            <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-600">{entry.summary}</p>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <VersionSection title="Capabilities" items={entry.capabilities} />
              <VersionSection title="Workflow" items={entry.processFlow} />
              <VersionSection title="User Impact" items={entry.userImpact} />
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

const VersionSection = ({ title, items }: { title: string; items: string[] }) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-3">
    <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-500">{title}</p>
    <ul className="space-y-2 text-xs font-semibold leading-relaxed text-slate-600">
      {items.map((item, index) => (
        <li key={`${title}-${index}`} className="flex gap-2">
          <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-600" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);
