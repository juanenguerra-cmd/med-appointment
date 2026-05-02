import { CheckCircle2, History, Layers, ShieldCheck } from "lucide-react";

const releaseItems = [
  "Added docs/app-tsx-cleanup-readiness-gate.md to prepare the next direct App.tsx import cleanup phase.",
  "Documented the stable foundations already created for hooks, components, utilities, data utilities, services, and types.",
  "Defined the recommended import cleanup order and required build check after each import group.",
  "Kept App.tsx unchanged because the connector view was truncated and a partial rewrite would be risky.",
  "Updated package metadata and visible release notes to identify v3.0.0 as the current App.tsx cleanup readiness baseline.",
];

const workflowItems = [
  "Pull the latest main branch before the next build or deploy.",
  "Run npm run build to confirm the readiness guide update does not affect the app build.",
  "Run npx wrangler deploy only after the build passes.",
  "No D1 migration is required for this documentation and cleanup-planning patch.",
  "Start the next direct App.tsx cleanup with only the Button/Card component import group.",
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
            v3.0.0 — App.tsx Cleanup Readiness Gate
          </h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
            This release prepares the next direct App.tsx import cleanup phase with a documented safe order and build-check requirement.
          </p>
        </div>
        <div className="flex gap-2 text-sky-800">
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><Layers size={12} className="mr-1 inline" /> Readiness Gate</span>
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
