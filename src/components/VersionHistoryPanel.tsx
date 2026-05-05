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

const CURRENT_VERSION = "3.1.11";

const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "3.1.11",
    releaseDate: "2026-04-30",
    title: "App.tsx Appointment Status Badge Refactor Script",
    summary: "Added a local-safe Phase B script to prepare App.tsx appointment status badge JSX for shared helper usage.",
    capabilities: [
      "Added scripts/refactor-app-appointment-status-badge-b6.mjs.",
      "Added npm script refactor:app-appointment-status-badge.",
      "The script adds getAppointmentStatusMeta and getStatusBadgeClassName to the ./utils/appHelpers import when needed.",
      "The script adds a Phase B status badge helper note near App.tsx for careful manual JSX replacement.",
      "No D1 migration is required.",
    ],
    processFlow: [
      "Pull the latest main branch before running the appointment status badge script.",
      "Run npm run refactor:app-appointment-status-badge locally from the repository root.",
      "Replace one appointment status badge JSX block manually using getAppointmentStatusMeta and getStatusBadgeClassName.",
      "Run npm run build immediately after the manual replacement.",
    ],
    userImpact: [
      "Keeps current workflows stable.",
      "Prepares appointment status badge cleanup without broad automatic JSX rewrites.",
      "Supports safer App.tsx cleanup through a small local build-tested change.",
    ],
  },
  {
    version: "3.1.10",
    releaseDate: "2026-04-30",
    title: "App.tsx Status/Badge Helper Audit Script",
    summary: "Added a local audit script to identify safe App.tsx status and badge helper replacement candidates before modifying the large file.",
    capabilities: ["Added scripts/audit-app-status-badge-helpers.mjs.", "Added npm script audit:app-status-badges."],
    processFlow: ["Run npm run audit:app-status-badges locally.", "Run npm run build after each replacement group."],
    userImpact: ["Keeps current workflows stable.", "Makes status and badge helper extraction easier to review."],
  },
  {
    version: "3.1.9",
    releaseDate: "2026-04-30",
    title: "App.tsx Status/Badge Helper Foundation",
    summary: "Started the status and badge helper group for Phase B by adding reusable metadata helpers for App.tsx badge logic.",
    capabilities: ["Added src/utils/appHelpers/statusBadgeHelpers.ts.", "Exported the status/badge helper module through src/utils/appHelpers/index.ts."],
    processFlow: ["Use imports from ./utils/appHelpers when replacing App.tsx status or badge logic.", "Run npm run build after each replacement group."],
    userImpact: ["Keeps current workflows stable.", "Starts the next Phase B cleanup group after date/time helper verification."],
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
