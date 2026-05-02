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

const CURRENT_VERSION = "2.9.7";

const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "2.9.7",
    releaseDate: "2026-04-30",
    title: "Type Export Compatibility Foundation",
    summary: "Added a stable type export compatibility file for future type import cleanup while preserving current App.tsx behavior.",
    capabilities: [
      "Added src/typeExports.ts as a stable type-only export point.",
      "Re-exported Appointment, Doctor, Facility, MedicalRecord, and Resident.",
      "Avoided changing src/types.ts for safety.",
      "Kept App.tsx unchanged.",
      "No D1 migration is required.",
    ],
    processFlow: [
      "Pull the latest main branch.",
      "Run npm run build before deployment.",
      "Deploy only after the build passes.",
      "Use src/typeExports.ts in future type import cleanup patches.",
    ],
    userImpact: [
      "Keeps current workflows stable.",
      "Creates one stable type import point for future cleanup.",
      "Keeps current app behavior unchanged.",
    ],
  },
  {
    version: "2.9.6",
    releaseDate: "2026-04-30",
    title: "Services Barrel Foundation",
    summary: "Added a stable services barrel for future import cleanup while preserving current App.tsx behavior.",
    capabilities: ["Added src/services/index.ts.", "Kept App.tsx unchanged for safety."],
    processFlow: ["Run npm run build before deployment.", "Use the services barrel in future cleanup patches."],
    userImpact: ["Keeps current workflows stable.", "Keeps current app behavior unchanged."],
  },
  {
    version: "2.9.5",
    releaseDate: "2026-04-30",
    title: "Component Barrel Foundation",
    summary: "Added a stable component barrel for future import cleanup while preserving current App.tsx behavior.",
    capabilities: ["Added src/components/index.ts.", "Kept App.tsx unchanged for safety."],
    processFlow: ["Run npm run build before deployment.", "Use the component barrel in future cleanup patches."],
    userImpact: ["Keeps current workflows stable.", "Keeps current app behavior unchanged."],
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
