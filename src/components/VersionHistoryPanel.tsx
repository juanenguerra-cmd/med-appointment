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

const CURRENT_VERSION = "3.1.21";

const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "3.1.21",
    releaseDate: "2026-04-30",
    title: "Census Import Summary UI Wiring",
    summary: "Added the Census page summary review surface and a local App.tsx wiring script while keeping the save workflow unchanged.",
    capabilities: [
      "Added CensusPage import summary UI support for parsed census review before saving.",
      "Added optional censusImportSummary and setCensusImportSummary props to CensusPage.",
      "Added summary banner states for ready, review-required, and blocked import recommendations.",
      "Added summary cards for parsed residents, warnings, duplicate groups, and critical parser errors.",
      "Added scripts/refactor-app-census-summary-wiring.mjs and npm script refactor:app-census-summary-wiring.",
    ],
    processFlow: [
      "Pull the latest main branch before wiring summary state into App.tsx.",
      "Run npm run refactor:app-census-summary-wiring locally from the repository root.",
      "Run npm run verify:census-parser, npm run test:census-parser-fixtures, and npm run build.",
      "Review git diff src/App.tsx and src/pages/CensusPage.tsx before committing local App.tsx changes.",
      "Keep handleSaveCensus unchanged until safe save mode is added.",
    ],
    userImpact: [
      "Adds visible census import summary review before save.",
      "Improves safety by clearly showing ready, review-required, or blocked import status.",
      "Prepares the next phase: safe save mode and duplicate/warning review controls.",
    ],
  },
  {
    version: "3.1.20",
    releaseDate: "2026-04-30",
    title: "Census Import Summary Types and Mapper",
    summary: "Added a reusable census import summary mapper so parsed census results can be reviewed for warnings, duplicates, readiness, and safe-save status before saving.",
    capabilities: ["Added src/census/parser/censusImportSummary.ts.", "Added createCensusImportSummary and getCensusImportSummaryMessage."],
    processFlow: ["Run npm run verify:census-parser locally.", "Use createCensusImportSummary after parseCensusText before showing or saving census preview data."],
    userImpact: ["Prepares the Census page for visible import summary cards.", "Supports safer save decisions by separating ready, review-required, and blocked import states."],
  },
  {
    version: "3.1.19",
    releaseDate: "2026-04-30",
    title: "Census Parser Fixture Test Script",
    summary: "Added local fixture-based parser checks so census parsing behavior can be tested before future import summary and save workflow changes.",
    capabilities: ["Added census parser fixture files.", "Added scripts/test-census-parser-fixtures.mjs.", "Added npm script test:census-parser-fixtures."],
    processFlow: ["Run npm run test:census-parser-fixtures locally.", "Run npm run verify:census-parser and npm run build after fixture checks."],
    userImpact: ["Improves confidence before additional census import/save workflow changes.", "Creates repeatable parser regression testing for common census formats."],
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
