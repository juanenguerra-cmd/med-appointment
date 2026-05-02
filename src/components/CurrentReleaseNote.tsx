import { CheckCircle2, History, Layers, ShieldCheck } from "lucide-react";

const releaseItems = [
  "Added an appointment modal toolkit bridge module for future App.tsx modal cleanup.",
  "Grouped appointment draft helpers, resident appointment matching helpers, and appointment sort-time helper behind one import target.",
  "Kept App.tsx behavior unchanged in this patch to avoid a risky broad rewrite.",
  "Prepared the next narrow App.tsx replacement step by reducing future import clutter.",
  "Updated package metadata and visible release notes to identify v2.7.3 as the current modal toolkit baseline.",
];

const workflowItems = [
  "Pull the latest main branch before the next build or deploy.",
  "Run npm run build to confirm the v2.7.3 toolkit module compiles cleanly.",
  "No D1 migration is required for this modular cleanup patch.",
  "Use appointmentModalToolkit in the next narrow App.tsx import-replacement patch.",
  "Continue replacing duplicated App.tsx modal logic in small build-tested steps.",
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
            v2.7.3 — Modal Helper Integration Prep
          </h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
            This release adds a single appointment modal toolkit import target for the next safe App.tsx cleanup step.
          </p>
        </div>
        <div className="flex gap-2 text-sky-800">
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><Layers size={12} className="mr-1 inline" /> Toolkit</span>
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><ShieldCheck size={12} className="mr-1 inline" /> Safe Split</span>
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
