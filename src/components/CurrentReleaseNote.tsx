import { CheckCircle2, History, Layers, ShieldCheck } from "lucide-react";

const releaseItems = [
  "Added scripts/refactor-app-appointment-status-badge-b6.mjs to safely prepare App.tsx for appointment status badge helper usage.",
  "Added npm script refactor:app-appointment-status-badge for the first status/badge helper replacement step.",
  "The script adds getAppointmentStatusMeta and getStatusBadgeClassName to the ./utils/appHelpers import when needed.",
  "The script adds a Phase B status badge helper note near App.tsx so manual JSX replacement can be done carefully in a small build-tested diff.",
  "Updated package metadata and visible release notes to identify v3.1.11 as the appointment status badge refactor script baseline.",
];

const workflowItems = [
  "Pull the latest main branch before running the appointment status badge script.",
  "Run npm run refactor:app-appointment-status-badge locally from the repository root.",
  "Replace one appointment status badge JSX block manually using getAppointmentStatusMeta and getStatusBadgeClassName.",
  "Run npm run build immediately after the manual replacement.",
  "No D1 migration is required for this helper refactor release.",
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
            v3.1.11 — App.tsx Appointment Status Badge Refactor Script
          </h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
            This release adds a local-safe Phase B script to prepare App.tsx appointment status badge JSX for shared helper usage.
          </p>
        </div>
        <div className="flex gap-2 text-sky-800">
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><Layers size={12} className="mr-1 inline" /> Status Badge</span>
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><ShieldCheck size={12} className="mr-1 inline" /> Safe Script</span>
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
