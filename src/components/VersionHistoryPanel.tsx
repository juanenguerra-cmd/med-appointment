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

const CURRENT_VERSION = "3.1.16";

const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "3.1.16",
    releaseDate: "2026-04-30",
    title: "Census Parser Resident Adapter",
    summary: "Added the adapter needed to map parsed census residents into the existing Census page preview format without changing the UI.",
    capabilities: [
      "Added src/census/parser/residentAdapter.ts.",
      "Exported the adapter through src/census/parser/index.ts.",
      "Updated the census parser verifier to check the adapter file and adapter exports.",
      "Maps ParsedResident records into the existing Omit<Resident, id> preview shape.",
      "No D1 migration is required.",
    ],
    processFlow: [
      "Run npm run verify:census-parser locally.",
      "Run npm run audit:census-page-wiring to review the App.tsx parse handler integration point.",
      "Use parsedResidentsToResidentPreview when replacing App.tsx handleParseCensus internals.",
      "Keep handleSaveCensus unchanged during the first parser wiring pass.",
      "Run npm run build before committing parser wiring changes.",
    ],
    userImpact: [
      "Keeps the existing Census page UI stable.",
      "Bridges the new parser output to the current preview table format.",
      "Prepares the next safe step: wiring parseCensusText into App.tsx handleParseCensus.",
    ],
  },
  {
    version: "3.1.15",
    releaseDate: "2026-04-30",
    title: "Census Page Parser Wiring Audit",
    summary: "Added a local audit script to identify the safest integration points before wiring the new census parser into the existing Census page workflow.",
    capabilities: ["Added scripts/audit-census-page-parser-wiring.mjs.", "Added npm script audit:census-page-wiring."],
    processFlow: ["Run npm run audit:census-page-wiring locally.", "Keep the CensusPage UI unchanged during the first parser wiring pass."],
    userImpact: ["Keeps the existing Census page workflow stable.", "Prepares safe parser wiring without changing live UI behavior yet."],
  },
  {
    version: "3.1.14",
    releaseDate: "2026-04-30",
    title: "Census Parser Foundation Verifier",
    summary: "Added a local verification script to confirm the census parser foundation is complete before wiring it into the Census page.",
    capabilities: ["Added scripts/verify-census-parser-foundation.mjs.", "Added npm script verify:census-parser."],
    processFlow: ["Run npm run verify:census-parser locally.", "Run npm run build after the verifier passes."],
    userImpact: ["Keeps census parser work stable and reviewable.", "Reduces risk before connecting raw census parsing to the live Census page."],
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
