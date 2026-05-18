import { CheckCircle2, History, Layers, ShieldCheck } from "lucide-react";

const releaseItems = [
  "Fixed PCC Resident Listing parser row detection so mixed-case resident names are recognized as valid resident rows.",
  "Updated the resident row start pattern from uppercase-only matching to mixed-case compatible matching.",
  "Resolved the issue where the uploaded census showed 126 residents but the app parsed only 113 residents.",
  "Added extra filtering for page/header lines so report headers do not get appended into resident allergy or diagnosis text.",
  "Kept the existing PCC column parser mapping for MRN, Age, Birth Date, Location, Gender, Admission Date, Allergies, Primary Physician, and Primary Diagnosis.",
];

const workflowItems = [
  "Pull the latest main branch before retesting the same raw census text.",
  "Run npm run verify:census-parser to confirm parser exports remain intact.",
  "Run npm run test:census-parser-fixtures to validate parser fixture coverage.",
  "Run npm run build before using the updated census import workflow.",
  "Paste the same raw census again and confirm Parsed Residents shows 126 instead of 113.",
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
            v3.1.24 — PCC Mixed-Case Resident Row Detection Fix
          </h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
            This release fixes the PCC census parser so mixed-case resident names are counted, resolving the 113 parsed vs 126 expected resident count issue.
          </p>
        </div>
        <div className="flex gap-2 text-sky-800">
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><Layers size={12} className="mr-1 inline" /> Census Count Fix</span>
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><ShieldCheck size={12} className="mr-1 inline" /> PCC Hardened</span>
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
