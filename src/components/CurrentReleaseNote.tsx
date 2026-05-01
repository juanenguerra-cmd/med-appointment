import { CheckCircle2, Database, History, ShieldCheck } from "lucide-react";

const releaseItems = [
  "Expanded backend census reconciliation summary fields for easier validation after import.",
  "Added raw incoming row count, skipped invalid row count, duplicate incoming count, queued statement count, and backend mode to the reconciliation response.",
  "Updated the frontend census reconciliation service types to match the expanded backend summary.",
  "Updated package metadata and visible release notes to identify v2.5.3 as the current census observability baseline.",
];

const workflowItems = [
  "Pull the latest main branch before the next build or deploy.",
  "Run npm run build to confirm the v2.5.3 UI and Worker build remain stable.",
  "No D1 migration is required for this observability patch.",
  "Deploy the Worker so the expanded /api/census/reconcile summary is available.",
  "Paste a small test census and confirm Patient Census saves through backend reconciliation.",
  "Review the browser console for rawIncoming, skippedInvalid, duplicateIncoming, statementsQueued, and backend mode after import validation.",
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
            v2.5.3 — Census Reconciliation Observability
          </h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
            This release improves census import validation by expanding backend reconciliation summary counts and updating frontend service types.
          </p>
        </div>
        <div className="flex gap-2 text-sky-800">
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><Database size={12} className="mr-1 inline" /> Summary</span>
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><ShieldCheck size={12} className="mr-1 inline" /> Validation</span>
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
