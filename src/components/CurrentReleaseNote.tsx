import { CheckCircle2, History, Layers, ShieldCheck } from "lucide-react";

const releaseItems = [
  "Added reusable appointment validation helper utilities for future appointment modal, table, and App.tsx cleanup.",
  "Added validation helpers for required appointment fields, schedule fields, and transportation fields.",
  "Added helpers to detect blocking validation errors and summarize validation results.",
  "Exported the appointment validation helpers through the appointment modal toolkit.",
  "Kept App.tsx behavior unchanged in this patch to avoid a risky broad rewrite.",
  "Updated package metadata and visible release notes to identify v2.8.5 as the current appointment validation helper baseline.",
];

const workflowItems = [
  "Pull the latest main branch before the next build or deploy.",
  "Run npm run build to confirm the v2.8.5 helper modules compile cleanly.",
  "No D1 migration is required for this modular cleanup patch.",
  "Use appointment validation helpers in the next narrow appointment modal, table, or App.tsx replacement patch.",
  "Continue replacing duplicated appointment validation logic in small build-tested steps.",
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
            v2.8.5 — Appointment Validation Helper Foundation
          </h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
            This release adds reusable appointment validation helpers for future appointment modal, table, and App.tsx cleanup.
          </p>
        </div>
        <div className="flex gap-2 text-sky-800">
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><Layers size={12} className="mr-1 inline" /> Validation Helpers</span>
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><ShieldCheck size={12} className="mr-1 inline" /> Safe Split</span>
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
