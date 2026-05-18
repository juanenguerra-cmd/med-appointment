import { CheckCircle2, History, Layers, ShieldCheck } from "lucide-react";

const releaseItems = [
  "Added scripts/restore-smart-census-reconciliation-flow.mjs to restore the intended census save path locally against App.tsx.",
  "Added npm script refactor:app-smart-census-flow for a build-tested local App.tsx reconciliation patch.",
  "Reinstates the required smart reconciliation workflow: created, updated, reactivated, discharged, and unchanged residents.",
  "Prevents append-only census saving from bypassing update detection and discharge detection.",
  "Preserves the existing backend reconciliation and frontend fallback flow already present in useHealthData.ts.",
];

const workflowItems = [
  "Pull the latest main branch before applying the App.tsx smart census flow patch.",
  "Run npm run refactor:app-smart-census-flow locally from the repository root.",
  "Review git diff src/App.tsx to confirm the save path uses replaceResidents(parsedResidentsPreview).",
  "Run npm run verify:census-parser, npm run test:census-parser-fixtures, and npm run build.",
  "Retest census import and confirm existing residents update, new residents are created, reappearing residents reactivate, and missing residents are marked discharged without hard deletion.",
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
            v3.1.26 — Restore Smart Census Reconciliation Flow
          </h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
            This release restores the required census import save workflow so new census data is compared against the existing registry before saving changes.
          </p>
        </div>
        <div className="flex gap-2 text-sky-800">
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><Layers size={12} className="mr-1 inline" /> Smart Reconcile</span>
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><ShieldCheck size={12} className="mr-1 inline" /> No Hard Delete</span>
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
