import { CheckCircle2, History, Layers, ShieldCheck } from "lucide-react";

const releaseItems = [
  "Started the next Phase B helper group for App.tsx status and badge logic.",
  "Added src/utils/appHelpers/statusBadgeHelpers.ts with reusable status metadata helpers.",
  "Added helpers for appointment status, transport readiness, service location, round trip, escort, and badge tone class names.",
  "Exported the status/badge helper module through src/utils/appHelpers/index.ts.",
  "Updated package metadata and visible release notes to identify v3.1.9 as the status/badge helper foundation baseline.",
];

const workflowItems = [
  "Use imports from ./utils/appHelpers when replacing App.tsx status or badge logic.",
  "Replace only one status/badge group at a time.",
  "Run npm run build after each replacement group.",
  "Do not combine status/badge helper extraction with UI redesign or D1 schema changes.",
  "No D1 migration is required for this helper foundation release.",
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
            v3.1.9 — App.tsx Status/Badge Helper Foundation
          </h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
            This release starts the status and badge helper group for Phase B by adding reusable metadata helpers for App.tsx badge logic.
          </p>
        </div>
        <div className="flex gap-2 text-sky-800">
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><Layers size={12} className="mr-1 inline" /> Badge Helpers</span>
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
