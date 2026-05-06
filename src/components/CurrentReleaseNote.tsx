import { CheckCircle2, History, Layers, ShieldCheck } from "lucide-react";

const releaseItems = [
  "Added scripts/audit-census-page-parser-wiring.mjs to inspect the current Census page and App.tsx parser wiring points before UI integration.",
  "Added npm script audit:census-page-wiring for local review of CensusPage props, App.tsx parse handler, preview state, and Resident type mapping.",
  "Confirmed the current Census page already has paste, preview, parse, save, and registry display workflow surfaces.",
  "The audit recommends a safe wiring order: keep CensusPage UI unchanged, add a parser-to-Resident adapter, then replace only App.tsx handleParseCensus internals.",
  "Updated package metadata and visible release notes to identify v3.1.15 as the Census Page Parser Wiring Audit baseline.",
];

const workflowItems = [
  "Run npm run audit:census-page-wiring locally to review current Census page integration points.",
  "Keep the CensusPage UI unchanged during the first parser wiring pass.",
  "Add an adapter that maps ParsedResident to the existing Resident preview shape.",
  "Replace only App.tsx handleParseCensus internals with parseCensusText after the adapter is ready.",
  "Run npm run verify:census-parser and npm run build before committing parser wiring changes.",
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
            v3.1.15 — Census Page Parser Wiring Audit
          </h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
            This release adds a local audit script to identify the safest integration points before wiring the new census parser into the existing Census page workflow.
          </p>
        </div>
        <div className="flex gap-2 text-sky-800">
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><Layers size={12} className="mr-1 inline" /> Census Wiring</span>
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><ShieldCheck size={12} className="mr-1 inline" /> Safe Audit</span>
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
