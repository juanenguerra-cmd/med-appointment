import { CheckCircle2, History, Layers, ShieldCheck } from "lucide-react";

const releaseItems = [
  "Added CensusPage import summary UI support for parsed census review before saving.",
  "Added optional censusImportSummary and setCensusImportSummary props to CensusPage so App.tsx can wire the summary in a local build-tested step.",
  "Added summary banner states for ready, review-required, and blocked import recommendations.",
  "Added summary cards for parsed residents, warnings, duplicate groups, and critical parser errors.",
  "Added scripts/refactor-app-census-summary-wiring.mjs and npm script refactor:app-census-summary-wiring to safely connect summary state inside App.tsx locally.",
];

const workflowItems = [
  "Pull the latest main branch before wiring summary state into App.tsx.",
  "Run npm run refactor:app-census-summary-wiring locally from the repository root.",
  "Run npm run verify:census-parser, npm run test:census-parser-fixtures, and npm run build.",
  "Review git diff src/App.tsx and src/pages/CensusPage.tsx before committing local App.tsx changes.",
  "Keep handleSaveCensus unchanged until safe save mode is added.",
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
            v3.1.21 — Census Import Summary UI Wiring
          </h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
            This release adds the Census page summary review surface and a local App.tsx wiring script while keeping the save workflow unchanged.
          </p>
        </div>
        <div className="flex gap-2 text-sky-800">
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><Layers size={12} className="mr-1 inline" /> Summary UI</span>
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><ShieldCheck size={12} className="mr-1 inline" /> Safe Wiring</span>
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
