import { CheckCircle2, History, Layers, ShieldCheck } from "lucide-react";

const releaseItems = [
  "Marked the App.tsx census parser wiring as the completed v3.1.18 baseline after local application of the parser wiring workflow.",
  "Confirmed the intended workflow: parseCensusText powers the parse step and parsedResidentsToResidentPreview maps parser output into the existing Census preview shape.",
  "Kept CensusPage.tsx and handleSaveCensus unchanged so the first live parser integration remains limited to the parse handler path.",
  "Preserved the verification path using verify:census-parser, audit:census-page-wiring, and npm run build before future census save workflow changes.",
  "Updated package metadata and visible release notes to identify v3.1.18 as the Census Parser App Wiring Completion baseline.",
];

const workflowItems = [
  "Pull the latest main branch before continuing census import work.",
  "Run npm run verify:census-parser and npm run audit:census-page-wiring before new census changes.",
  "Run npm run build after any census parser or App.tsx wiring change.",
  "Keep handleSaveCensus unchanged until import summary and safe save mode are added.",
  "No D1 migration is required for this completion marker release.",
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
            v3.1.18 — Census Parser App Wiring Completion
          </h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
            This release marks the census parser App.tsx wiring path as completed and preserves the safe verification workflow for the next census import hardening phase.
          </p>
        </div>
        <div className="flex gap-2 text-sky-800">
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><Layers size={12} className="mr-1 inline" /> Parser Wired</span>
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><ShieldCheck size={12} className="mr-1 inline" /> Completion Marker</span>
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
