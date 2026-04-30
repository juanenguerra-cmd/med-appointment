import { CheckCircle2, Database, Eye, History } from "lucide-react";

const releaseItems = [
  "Added a D1 schema alignment migration so the database includes the facility, user access, transportation directory, resident facility link, and newer appointment fields expected by the current app.",
  "Removed the duplicate parent resident-detail modal trigger from the Patient Census View workflow so Census → View opens one resident detail window only.",
  "Updated the user guide to remind admins to apply the D1 migration after deployment and to document the corrected resident View workflow.",
];

const workflowItems = [
  "Deploy the updated app build.",
  "Apply migration 0004_schema_alignment.sql to the D1 database after the existing migrations.",
  "Open Patient Census and select View on a resident row to confirm only one resident detail modal opens.",
  "Create or edit an appointment to confirm the newer appointment fields save without D1 column errors.",
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
            v2.2.1 — D1 Schema Alignment and Census View Modal Fix
          </h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
            This maintenance release stabilizes the database structure expected by the current Cloudflare Worker API and cleans up the Patient Census resident-detail workflow.
          </p>
        </div>
        <div className="flex gap-2 text-sky-800">
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><Database size={12} className="mr-1 inline" /> D1</span>
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><Eye size={12} className="mr-1 inline" /> View</span>
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
