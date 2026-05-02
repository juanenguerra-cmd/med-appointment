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

const CURRENT_VERSION = "3.0.2";

const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "3.0.2",
    releaseDate: "2026-04-30",
    title: "Component Barrel Expansion Phase 2",
    summary: "Expanded the component barrel so the next App.tsx component import cleanup can include LockScreen and AppointmentModal safely.",
    capabilities: [
      "Expanded src/components/index.ts to include LockScreen and AppointmentModal exports.",
      "Prepared the component barrel for the next App.tsx component import cleanup step.",
      "Kept App.tsx unchanged for safety.",
      "No D1 migration is required.",
    ],
    processFlow: [
      "Pull the latest main branch.",
      "Run npm run build before deployment.",
      "Deploy only after the build passes.",
      "After build validation, App.tsx component imports can be consolidated through ./components.",
    ],
    userImpact: [
      "Keeps current workflows stable.",
      "Prepares a safer component import cleanup step.",
      "Keeps current app behavior unchanged.",
    ],
  },
  {
    version: "3.0.1",
    releaseDate: "2026-04-30",
    title: "App.tsx Component Import Cleanup Patch Guide",
    summary: "Documented the exact first App.tsx component import cleanup patch for Button and Card.",
    capabilities: ["Added docs/app-tsx-component-import-cleanup-phase1.md.", "Kept App.tsx unchanged."],
    processFlow: ["Run npm run build before deployment.", "Replace only the Card/Button imports when editing locally."],
    userImpact: ["Keeps current workflows stable.", "Gives an exact first App.tsx import cleanup patch."],
  },
  {
    version: "3.0.0",
    releaseDate: "2026-04-30",
    title: "App.tsx Cleanup Readiness Gate",
    summary: "Prepared the next direct App.tsx import cleanup phase with a documented safe order and build-check requirement.",
    capabilities: ["Added docs/app-tsx-cleanup-readiness-gate.md.", "Kept App.tsx unchanged."],
    processFlow: ["Run npm run build before deployment.", "Start with only the Button/Card component import group."],
    userImpact: ["Keeps current workflows stable.", "Prepares the next App.tsx cleanup phase."],
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
