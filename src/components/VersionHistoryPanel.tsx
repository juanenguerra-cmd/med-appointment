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

const CURRENT_VERSION = "3.0.8";

const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "3.0.8",
    releaseDate: "2026-04-30",
    title: "App.tsx Appointment Utility Import Cleanup Script",
    summary: "Added a local-safe script to consolidate App.tsx appointment utility imports into the appointment utility barrel path.",
    capabilities: [
      "Added scripts/refactor-app-appointment-imports-a6.mjs.",
      "Added npm script refactor:app-appointments.",
      "The script consolidates direct appointment utility imports into ./utils/appointment.",
      "Kept App.tsx unchanged in the repository so local build can validate the exact file change first.",
      "No D1 migration is required.",
    ],
    processFlow: [
      "Pull the latest main branch.",
      "Run npm run refactor:app-appointments locally from the repository root.",
      "Run npm run build immediately after the refactor script.",
      "Commit the resulting App.tsx change only if the script changed App.tsx and the build passes.",
    ],
    userImpact: [
      "Keeps current workflows stable.",
      "Provides a safer local path for App.tsx appointment utility import cleanup.",
      "Avoids overwriting the large App.tsx file through a truncated connector view.",
    ],
  },
  {
    version: "3.0.7",
    releaseDate: "2026-04-30",
    title: "App.tsx Data Utility Import Cleanup Script",
    summary: "Added a local-safe script to consolidate App.tsx data utility imports into the data utility barrel path.",
    capabilities: ["Added scripts/refactor-app-data-imports-a5.mjs.", "Added npm script refactor:app-data."],
    processFlow: ["Run npm run refactor:app-data locally.", "Run npm run build immediately after."],
    userImpact: ["Keeps current workflows stable.", "Provides a safer local App.tsx cleanup path."],
  },
  {
    version: "3.0.6",
    releaseDate: "2026-04-30",
    title: "App.tsx Service Import Cleanup Script",
    summary: "Added a local-safe script to convert App.tsx service imports to the services barrel path.",
    capabilities: ["Added scripts/refactor-app-service-imports-a4.mjs.", "Added npm script refactor:app-services."],
    processFlow: ["Run npm run refactor:app-services locally.", "Run npm run build immediately after."],
    userImpact: ["Keeps current workflows stable.", "Provides a safer local App.tsx cleanup path."],
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
