import { CheckCircle2, History, Layers, ShieldCheck } from "lucide-react";

const releaseItems = [
  "Added the Census Parser Foundation under src/census/parser for raw census text extraction and clean resident listing support.",
  "Added census parser schemas for raw import input, parsed residents, clean census rows, duplicates, reconciliation results, and import batch history.",
  "Added raw text normalization, report date detection, resident block splitting, field extraction helpers, duplicate detection, clean row mapping, and reconciliation helpers.",
  "Added parseCensusText and parseResidentBlock to convert raw census text into a structured parsed census result.",
  "Updated package metadata and visible release notes to identify v3.1.13 as the Census Parser Foundation baseline.",
];

const workflowItems = [
  "Paste or upload raw census text into the future census import workflow.",
  "Normalize the raw text, split into resident blocks, and extract resident fields.",
  "Review clean resident listing, warnings, duplicates, new admissions, room transfers, and possible discharges before saving.",
  "Do not automatically discharge residents based on one missing census import; route them to possible discharge review first.",
  "No D1 migration is required for this parser foundation release.",
];

export function CurrentReleaseNote() {
  return (
    <section className="rounded-3xl border border-sky-100 bg-sky-50/70 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-black text-sky-900">
            <History size={18} /> Current Release Note
          </div>
          <h2 className="mt-2 text-lg font-black text-slate-900">
            v3.1.13 — Census Parser Foundation
          </h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
            This release adds the foundational census parser structure for extracting resident data from raw census text and preparing a clean reviewable listing.
          </p>
        </div>
        <div className="flex gap-2 text-sky-800">
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><Layers size={12} className="mr-1 inline" /> Census Parser</span>
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><ShieldCheck size={12} className="mr-1 inline" /> Safe Foundation</span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-sky-100 bg-white p-4">
          <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-slate-500">What changed</p>
          <ul className="space-y-2 text-xs font-semibold leading-relaxed text-slate-600">
            {releaseItems.map((item, index) => (
              <li key={`release-${index}`} className="flex gap-2">
                <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-sky-100 bg-white p-4">
          <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Admin workflow</p>
          <ul className="space-y-2 text-xs font-semibold leading-relaxed text-slate-600">
            {workflowItems.map((item, index) => (
              <li key={`workflow-${index}`} className="flex gap-2">
                <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-sky-700" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
