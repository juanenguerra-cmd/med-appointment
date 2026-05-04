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

const CURRENT_VERSION = "3.1.4";

const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "3.1.4",
    releaseDate: "2026-04-30",
    title: "App.tsx Date Input Helper Refactor Script",
    summary: "Added a local-safe Phase B refactor script to replace App.tsx date-input conversion patterns with the shared helper.",
    capabilities: [
      "Added scripts/refactor-app-date-input-helper-b2.mjs.",
      "Added npm script refactor:app-date-input.",
      "The script replaces new Date(value).toISOString().slice/substring(0, 10) with toDateInputValue(value).",
      "The script also adds toDateInputValue to the ./utils/appHelpers import when needed.",
      "No D1 migration is required.",
    ],
    processFlow: [
      "Pull the latest main branch before running the date-input refactor script.",
      "Run npm run refactor:app-date-input locally from the repository root.",
      "Run npm run build immediately after the refactor script.",
      "Commit the resulting App.tsx change only if the build passes and the diff is expected.",
    ],
    userImpact: [
      "Keeps current workflows stable.",
      "Continues Phase B helper replacement with a small date-input cleanup step.",
      "Supports safer App.tsx cleanup through a local build-tested change.",
    ],
  },
  {
    version: "3.1.3",
    releaseDate: "2026-04-30",
    title: "App.tsx Today Date Helper Refactor Script",
    summary: "Added the first local-safe Phase B refactor script to replace low-risk App.tsx today-date input patterns.",
    capabilities: ["Added scripts/refactor-app-today-date-helper-b1.mjs.", "Added npm script refactor:app-today-date."],
    processFlow: ["Run npm run refactor:app-today-date locally.", "Run npm run build immediately after."],
    userImpact: ["Keeps current workflows stable.", "Begins actual Phase B helper replacement with a low-risk date helper."],
  },
  {
    version: "3.1.2",
    releaseDate: "2026-04-30",
    title: "App.tsx Date Time Helper Audit Script",
    summary: "Added a local audit script to identify safe App.tsx date/time helper replacement candidates before modifying the large file.",
    capabilities: ["Added scripts/audit-app-date-time-helpers.mjs.", "Added npm script audit:app-dates."],
    processFlow: ["Run npm run audit:app-dates locally.", "Run npm run build after each replacement group."],
    userImpact: ["Keeps current workflows stable.", "Makes date/time helper extraction easier to review."],
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
