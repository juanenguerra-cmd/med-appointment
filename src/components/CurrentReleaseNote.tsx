import { CheckCircle2, History, Search, Users } from "lucide-react";

const releaseItems = [
  "Added Reset controls to Facility Management and User Access Management list filters.",
  "Facility Reset clears facility search and restores the default Current first sort.",
  "User Reset clears user search and restores the default Admins first sort.",
  "Reset buttons automatically disable when list controls are already at their default settings.",
  "Updated package metadata and visible release notes to identify v2.6.1 as the current admin list reset baseline.",
];

const workflowItems = [
  "Pull the latest main branch before the next build or deploy.",
  "Run npm run build to confirm the v2.6.1 UI remains stable.",
  "No D1 migration is required for this admin reset-control patch.",
  "Deploy the app and open Help / Info as an admin user.",
  "Change facility search or sort, then use Reset to return to the default list view.",
  "Change user search or sort, then use Reset to return to the default list view.",
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
            v2.6.1 — Admin List Reset Controls
          </h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
            This release adds one-click reset controls for admin facility and user list filters.
          </p>
        </div>
        <div className="flex gap-2 text-sky-800">
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><Search size={12} className="mr-1 inline" /> Reset Lists</span>
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><Users size={12} className="mr-1 inline" /> Admin Lists</span>
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
