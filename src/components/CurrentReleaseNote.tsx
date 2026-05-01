import { CheckCircle2, Database, Eye, History } from "lucide-react";

const releaseItems = [
  "Cleaned up the schema alignment migration so it no longer re-adds columns already owned by the resident identity, user password, and transport-detail migrations.",
  "Kept the D1 alignment coverage for facilities, user-facility access, transportation directory, resident facility link, and remaining appointment fields expected by the current app.",
  "Preserved the Census View modal fix so Census → View opens one resident detail window only.",
  "Updated version history and the visible release note so v2.2.2 is the current maintenance baseline.",
];

const workflowItems = [
  "Pull the latest main branch before the next build or deploy.",
  "Run npm run build to confirm the UI and TypeScript build remain stable.",
  "For a fresh D1 database, run migrations in order; the schema alignment file now avoids overlap with existing migration files.",
  "For the already-deployed D1 database, no duplicate-column rerun is expected if the previous migration name was already recorded as applied.",
  "Open Patient Census and select View on a resident row to confirm only one resident detail modal opens.",
  "Create or edit an appointment to confirm transport, escort, consult, and resident identity fields save without D1 column errors.",
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
            v2.2.2 — D1 Migration Cleanup and Current Baseline
          </h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
            This maintenance release cleans up overlapping D1 migration ownership while preserving the deployed schema alignment and Census View modal fix.
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
