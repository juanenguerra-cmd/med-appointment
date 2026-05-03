import { CheckCircle2, History, Layers, ShieldCheck } from "lucide-react";

const releaseItems = [
  "Added scripts/refactor-app-type-imports-a2.mjs to safely update App.tsx type imports locally.",
  "Added npm script refactor:app-types for the local type import cleanup step.",
  "The script replaces the direct ./types import with a type-only import from ./typeExports.",
  "Kept App.tsx unchanged in the repository so the local build can validate the exact file change first.",
  "Updated package metadata and visible release notes to identify v3.0.4 as the current App.tsx type import cleanup script baseline.",
];

const workflowItems = [
  "Pull the latest main branch before running the refactor script.",
  "Run npm run refactor:app-types locally from the repository root.",
  "Run npm run build immediately after the refactor script.",
  "Commit the resulting App.tsx change only after the build passes.",
  "No D1 migration is required for this import cleanup patch.",
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
            v3.0.4 — App.tsx Type Import Cleanup Script
          </h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
            This release adds a local-safe script to convert App.tsx type imports to the type export compatibility path.
          </p>
        </div>
        <div className="flex gap-2 text-sky-800">
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><Layers size={12} className="mr-1 inline" /> Type Script</span>
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><ShieldCheck size={12} className="mr-1 inline" /> Safe Patch</span>
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
