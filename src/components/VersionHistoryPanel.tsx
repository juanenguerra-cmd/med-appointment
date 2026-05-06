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

const CURRENT_VERSION = "3.1.14";

const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "3.1.14",
    releaseDate: "2026-04-30",
    title: "Census Parser Foundation Verifier",
    summary: "Added a local verification script to confirm the census parser foundation is complete before wiring it into the Census page.",
    capabilities: [
      "Added scripts/verify-census-parser-foundation.mjs.",
      "Added npm script verify:census-parser.",
      "The verifier checks required parser files, key exported types/functions, and parser barrel exports.",
      "Confirms the parser foundation is ready before Census page UI integration begins.",
      "No D1 migration is required.",
    ],
    processFlow: [
      "Pull the latest main branch before running the census parser verifier.",
      "Run npm run verify:census-parser locally from the repository root.",
      "Run npm run build after the verifier passes.",
      "Only start Census page wiring after the parser foundation and build both pass.",
    ],
    userImpact: [
      "Keeps census parser work stable and reviewable.",
      "Reduces risk before connecting raw census parsing to the live Census page.",
      "Supports safer future import workflow for resident listing cleanup.",
    ],
  },
  {
    version: "3.1.13",
    releaseDate: "2026-04-30",
    title: "Census Parser Foundation",
    summary: "Added the foundational census parser structure for extracting resident data from raw census text and preparing a clean reviewable listing.",
    capabilities: ["Added src/census/parser foundation files.", "Added parseCensusText and parseResidentBlock."],
    processFlow: ["Normalize raw text, split resident blocks, and extract resident fields.", "Review clean listing, warnings, duplicates, and possible discharges before saving."],
    userImpact: ["Prepares the app for cleaner census import and review workflows.", "Improves resident matching using MRN first and name/DOB fallback."],
  },
  {
    version: "3.1.12",
    releaseDate: "2026-04-30",
    title: "App.tsx Transport Readiness Badge Refactor Script",
    summary: "Added a local-safe Phase B script to prepare App.tsx transport readiness badge JSX for shared helper usage.",
    capabilities: ["Added scripts/refactor-app-transport-readiness-badge-b7.mjs.", "Added npm script refactor:app-transport-readiness-badge."],
    processFlow: ["Run npm run refactor:app-transport-readiness-badge locally.", "Run npm run build after manual replacement."],
    userImpact: ["Keeps current workflows stable.", "Prepares transport readiness badge cleanup without broad automatic JSX rewrites."],
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
