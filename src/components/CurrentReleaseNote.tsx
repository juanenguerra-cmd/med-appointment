import { CheckCircle2, History, ShieldCheck, Users } from "lucide-react";

const releaseItems = [
  "Fixed the Help / Info admin management action buttons by using the correct Card actions prop.",
  "Restored the New Facility button in Facility Management for admin users.",
  "Restored the New User button in User Access Management for admin users.",
  "Kept Set, Edit, and Delete facility actions plus Edit user action available in the management lists.",
  "Updated package metadata and visible release notes to identify v2.5.4 as the current admin actions fix baseline.",
];

const workflowItems = [
  "Pull the latest main branch before the next build or deploy.",
  "Run npm run build to confirm the v2.5.4 UI remains stable.",
  "No D1 migration is required for this UI action-button fix.",
  "Deploy the app and open Help / Info as an admin user.",
  "Confirm New Facility appears in Facility Management.",
  "Confirm New User appears in User Access Management.",
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
            v2.5.4 — Admin Help Actions Fix
          </h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
            This release restores the visible admin management buttons on the Help / Info page for adding facilities and users.
          </p>
        </div>
        <div className="flex gap-2 text-sky-800">
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><Users size={12} className="mr-1 inline" /> Admin Actions</span>
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><ShieldCheck size={12} className="mr-1 inline" /> UI Fix</span>
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
