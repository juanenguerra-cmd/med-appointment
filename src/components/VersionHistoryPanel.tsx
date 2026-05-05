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

const CURRENT_VERSION = "3.1.9";

const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "3.1.9",
    releaseDate: "2026-04-30",
    title: "App.tsx Status/Badge Helper Foundation",
    summary: "Started the status and badge helper group for Phase B by adding reusable metadata helpers for App.tsx badge logic.",
    capabilities: [
      "Added src/utils/appHelpers/statusBadgeHelpers.ts.",
      "Added helpers for appointment status, transport readiness, service location, round trip, escort, and badge tone class names.",
      "Exported the status/badge helper module through src/utils/appHelpers/index.ts.",
      "No App.tsx replacement was performed in this foundation commit.",
      "No D1 migration is required.",
    ],
    processFlow: [
      "Use imports from ./utils/appHelpers when replacing App.tsx status or badge logic.",
      "Replace only one status/badge group at a time.",
      "Run npm run build after each replacement group.",
      "Do not combine status/badge helper extraction with UI redesign or D1 schema changes.",
    ],
    userImpact: [
      "Keeps current workflows stable.",
      "Starts the next Phase B cleanup group after date/time helper verification.",
      "Prepares App.tsx for smaller status and badge cleanup commits without changing behavior yet.",
    ],
  },
  {
    version: "3.1.8",
    releaseDate: "2026-04-30",
    title: "Phase B Date Helper Completion Verifier",
    summary: "Added a local verifier to confirm whether App.tsx date/time helper cleanup is complete before moving to the next helper group.",
    capabilities: ["Added scripts/verify-app-date-helper-cleanup.mjs.", "Added npm script verify:app-date-helpers."],
    processFlow: ["Run npm run verify:app-date-helpers locally.", "Run npm run build after the verifier passes."],
    userImpact: ["Keeps current workflows stable.", "Confirms whether date/time helper cleanup is complete before the next helper group."],
  },
  {
    version: "3.1.7",
    releaseDate: "2026-04-30",
    title: "App.tsx Date Comparison Helper Refactor Script",
    summary: "Added a local-safe Phase B refactor script to replace simple App.tsx date comparison patterns with shared helper functions.",
    capabilities: ["Added scripts/refactor-app-date-comparison-helper-b5.mjs.", "Added npm script refactor:app-date-comparison."],
    processFlow: ["Run npm run refactor:app-date-comparison locally.", "Run npm run build immediately after."],
    userImpact: ["Keeps current workflows stable.", "Continues Phase B helper replacement with date comparison cleanup."],
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
