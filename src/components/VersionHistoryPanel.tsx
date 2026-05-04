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

const CURRENT_VERSION = "3.1.2";

const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "3.1.2",
    releaseDate: "2026-04-30",
    title: "App.tsx Date Time Helper Audit Script",
    summary: "Added a local audit script to identify safe App.tsx date/time helper replacement candidates before modifying the large file.",
    capabilities: [
      "Added scripts/audit-app-date-time-helpers.mjs.",
      "Added npm script audit:app-dates.",
      "The audit prints likely App.tsx line locations for display formatting, input formatting, and today-date patterns.",
      "Kept App.tsx unchanged so replacements can be completed one small group at a time after audit review.",
      "No D1 migration is required.",
    ],
    processFlow: [
      "Run npm run audit:app-dates locally to identify date/time replacement candidates.",
      "Replace only one small date/time group at a time inside App.tsx.",
      "Run npm run build after each replacement group.",
      "Do not combine date/time helper extraction with UI or D1 schema changes.",
    ],
    userImpact: [
      "Keeps current workflows stable.",
      "Makes date/time helper extraction easier to review before touching App.tsx.",
      "Supports safer helper replacement in small build-tested commits.",
    ],
  },
  {
    version: "3.1.1",
    releaseDate: "2026-04-30",
    title: "Extract App Date Time Helpers Foundation",
    summary: "Added the first Phase B helper module for reusable App.tsx date/time formatting and date comparison helpers.",
    capabilities: ["Added src/utils/appHelpers/dateTimeHelpers.ts.", "Exported the date/time helper module through src/utils/appHelpers/index.ts."],
    processFlow: ["Use imports from ./utils/appHelpers when replacing App.tsx date/time logic.", "Run npm run build after each replacement group."],
    userImpact: ["Keeps current workflows stable.", "Starts Phase B helper extraction with low-risk date/time helpers."],
  },
  {
    version: "3.1.0",
    releaseDate: "2026-04-30",
    title: "App.tsx Helper Extraction Phase B Foundation",
    summary: "Started Phase B by adding the guide and helper barrel foundation for safe App.tsx helper/function extraction.",
    capabilities: ["Added docs/app-tsx-helper-extraction-phase-b.md.", "Added src/utils/appHelpers/index.ts."],
    processFlow: ["Use src/utils/appHelpers for extracted App.tsx helper groups.", "Run npm run build after every helper extraction."],
    userImpact: ["Keeps current workflows stable.", "Starts Phase B without changing user-facing behavior."],
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
