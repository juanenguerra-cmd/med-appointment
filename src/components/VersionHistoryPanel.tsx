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

const CURRENT_VERSION = "3.1.19";

const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "3.1.19",
    releaseDate: "2026-04-30",
    title: "Census Parser Fixture Test Script",
    summary: "Added local fixture-based parser checks so census parsing behavior can be tested before future import summary and save workflow changes.",
    capabilities: [
      "Added census parser fixture files for basic, wrapped-line, missing-field, and duplicate resident listing scenarios.",
      "Added scripts/test-census-parser-fixtures.mjs.",
      "Added npm script test:census-parser-fixtures.",
      "The fixture test validates parsed resident counts, expected MRNs, duplicate groups, and warning detection.",
      "No D1 migration is required.",
    ],
    processFlow: [
      "Pull the latest main branch before running fixture tests.",
      "Run npm run test:census-parser-fixtures locally from the repository root.",
      "Run npm run verify:census-parser and npm run build after fixture checks.",
      "Add a new fixture whenever a new census format or parsing edge case is discovered.",
    ],
    userImpact: [
      "Improves confidence before additional census import/save workflow changes.",
      "Creates repeatable parser regression testing for common census formats.",
      "Prepares the next hardening phase: import summaries and safe save modes.",
    ],
  },
  {
    version: "3.1.18",
    releaseDate: "2026-04-30",
    title: "Census Parser App Wiring Completion",
    summary: "Marked the census parser App.tsx wiring path as completed and preserved the safe verification workflow for the next census import hardening phase.",
    capabilities: ["Marked App.tsx census parser wiring workflow as completed.", "Preserved verify:census-parser, audit:census-page-wiring, and build as required checks."],
    processFlow: ["Run npm run verify:census-parser and npm run audit:census-page-wiring before new census changes.", "Keep handleSaveCensus unchanged until import summary and safe save mode are added."],
    userImpact: ["Keeps the existing Census page UI stable.", "Completes the first parser wiring phase while preserving the existing save workflow."],
  },
  {
    version: "3.1.17",
    releaseDate: "2026-04-30",
    title: "Census Parser App Wiring Script",
    summary: "Added a local-safe script to wire the new census parser into App.tsx while keeping the existing Census page UI and save workflow unchanged.",
    capabilities: ["Added scripts/refactor-app-census-parser-wiring.mjs.", "Added npm script refactor:app-census-parser-wiring."],
    processFlow: ["Run npm run refactor:app-census-parser-wiring locally.", "Run npm run verify:census-parser, audit:census-page-wiring, and build."],
    userImpact: ["Keeps the existing Census page UI stable.", "Introduces the new parser through a local build-tested App.tsx change."],
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
