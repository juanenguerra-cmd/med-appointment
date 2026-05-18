import { CheckCircle2, History, Layers, ShieldCheck } from "lucide-react";

const releaseItems = [
  "Improved PCC Primary Physician detection so the parser can separate Allergies, Primary Physician, and Primary Diagnosis more reliably.",
  "Added known physician matching and a broader physician fallback for PCC Resident Listing rows.",
  "Updated safe-save default behavior so review-required census imports default to Append New Only instead of Review Only when there are no parser-blocking errors.",
  "Resolved the blocking popup that said Review Only mode does not save changes to the resident registry for review-required but usable census imports.",
  "Kept parser-blocked imports protected when critical parser errors are present.",
];

const workflowItems = [
  "Pull the latest main branch before retesting the same raw census text.",
  "Run npm run verify:census-parser to confirm parser exports remain intact.",
  "Run npm run test:census-parser-fixtures to validate parser fixture coverage.",
  "Run npm run build before using the updated census import workflow.",
  "Paste the same raw census again and confirm physician values populate and the save alert no longer appears for usable imports.",
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
            v3.1.25 — Census Save Alert + Physician Detection Fix
          </h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
            This release improves PCC physician detection and prevents usable review-required census imports from being blocked by Review Only mode.
          </p>
        </div>
        <div className="flex gap-2 text-sky-800">
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><Layers size={12} className="mr-1 inline" /> Physician Fix</span>
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><ShieldCheck size={12} className="mr-1 inline" /> Save Alert Fix</span>
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
