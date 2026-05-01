import { CheckCircle2, Database, History, ShieldCheck } from "lucide-react";

const releaseItems = [
  "Added a backend census reconciliation route at /api/census/reconcile.",
  "The backend route calculates created, updated, reactivated, discharged, unchanged, and final active/discharged counts in one request.",
  "Added a v2.5 Worker entrypoint that registers the census reconciliation route while preserving the existing Worker API.",
  "Updated Wrangler to deploy the v2.5 Worker entrypoint and updated package metadata to v2.5.0.",
];

const workflowItems = [
  "Pull the latest main branch before the next build or deploy.",
  "Run npm run build to confirm the v2.5.0 UI and Worker build remain stable.",
  "Deploy the Worker so /api/census/reconcile is available.",
  "No D1 migration is required for this backend endpoint.",
  "Validate the endpoint with a small test census before switching the full Patient Census UI workflow to backend-only reconciliation.",
  "Use this baseline for the next patch that replaces the frontend multi-request census save with the new backend endpoint.",
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
            v2.5.0 — Backend Census Reconciliation Foundation
          </h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
            This release adds the backend foundation for one-request census reconciliation while keeping the existing frontend workflow available during validation.
          </p>
        </div>
        <div className="flex gap-2 text-sky-800">
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><Database size={12} className="mr-1 inline" /> Census API</span>
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><ShieldCheck size={12} className="mr-1 inline" /> Safer Save</span>
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
