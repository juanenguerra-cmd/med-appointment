import { CheckCircle2, History, Layers, ShieldCheck } from "lucide-react";

const releaseItems = [
  "Marked App.tsx Phase A import cleanup as complete after the local App.tsx cleanup was committed and pushed.",
  "Documented that App.tsx imports were consolidated through the stable component, type, hook, service, data utility, and appointment utility barrel paths.",
  "Documented that Phase A verification and production build were completed before marking the phase complete.",
  "Kept the Phase A helper scripts available for future verification or repeat cleanup checks.",
  "Updated package metadata and visible release notes to identify v3.0.13 as the Phase A import cleanup completion baseline.",
];

const workflowItems = [
  "Continue using npm run check:app-phase-a when verifying import cleanup health.",
  "Use npm run build before deployment.",
  "Run npx wrangler deploy only after the build passes.",
  "No D1 migration is required for this Phase A completion release.",
  "Next cleanup phase should begin with helper/function extraction from App.tsx in small build-tested commits.",
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
            v3.0.13 — App.tsx Phase A Import Cleanup Complete
          </h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
            This release marks Phase A import cleanup complete after App.tsx imports were consolidated through stable barrel paths and build verification passed.
          </p>
        </div>
        <div className="flex gap-2 text-sky-800">
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><Layers size={12} className="mr-1 inline" /> Phase A Complete</span>
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><ShieldCheck size={12} className="mr-1 inline" /> Verified</span>
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
