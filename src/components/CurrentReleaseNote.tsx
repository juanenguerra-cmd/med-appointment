import { CheckCircle2, History, Layers, ShieldCheck } from "lucide-react";

const releaseItems = [
  "Added scripts/audit-app-status-badge-helpers.mjs to scan App.tsx for status and badge helper replacement opportunities.",
  "Added npm script audit:app-status-badges for local status/badge helper audit review.",
  "The audit prints likely App.tsx line locations for appointment status, transport readiness, service location, round trip, escort, and badge class patterns.",
  "Kept App.tsx unchanged so replacements can be completed one small group at a time after audit review.",
  "Updated package metadata and visible release notes to identify v3.1.10 as the status/badge helper audit baseline.",
];

const workflowItems = [
  "Run npm run audit:app-status-badges locally to identify status/badge replacement candidates.",
  "Replace only one small status/badge group at a time inside App.tsx.",
  "Run npm run build after each replacement group.",
  "Do not combine status/badge helper extraction with UI redesign or D1 schema changes.",
  "No D1 migration is required for this audit release.",
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
            v3.1.10 — App.tsx Status/Badge Helper Audit Script
          </h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
            This release adds a local audit script to identify safe App.tsx status and badge helper replacement candidates before modifying the large file.
          </p>
        </div>
        <div className="flex gap-2 text-sky-800">
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><Layers size={12} className="mr-1 inline" /> Badge Audit</span>
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><ShieldCheck size={12} className="mr-1 inline" /> Safe Review</span>
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
