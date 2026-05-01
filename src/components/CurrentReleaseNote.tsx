import { CheckCircle2, Database, Eye, History, ShieldCheck } from "lucide-react";

const releaseItems = [
  "Updated package metadata from the generic react-example baseline to med-appointment v2.3.0.",
  "Cleaned the Patient Census page prop contract so resident detail display remains owned by PatientCensusUnitList while legacy parent modal props are treated as temporary no-ops.",
  "Preserved the v2.2.2 D1 migration cleanup baseline and documented that future database changes should be small, specific migrations.",
  "Established the next-phase cleanup baseline before deeper security hardening, auth middleware, and App.tsx modularization.",
];

const workflowItems = [
  "Pull the latest main branch before the next build or deploy.",
  "Run npm run build to confirm the v2.3.0 UI and TypeScript build remain stable.",
  "No new D1 migration is required for this v2.3.0 metadata and Census prop cleanup patch.",
  "Open Help and confirm Current Release Note and Version History show v2.3.0 as the current baseline.",
  "Open Patient Census and select View on a resident row to confirm the resident detail modal still opens only once.",
  "Use this baseline as the starting point for the next security-hardening pass: password hashing, session handling, and server-side facility authorization.",
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
            v2.3.0 — Next-Phase Architecture Cleanup Baseline
          </h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
            This release formalizes the next cleanup baseline by aligning package metadata, keeping the Census View modal ownership clean, and preparing the app for the next security and modularization phase.
          </p>
        </div>
        <div className="flex gap-2 text-sky-800">
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><Database size={12} className="mr-1 inline" /> Baseline</span>
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><Eye size={12} className="mr-1 inline" /> View</span>
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><ShieldCheck size={12} className="mr-1 inline" /> Next Security</span>
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
