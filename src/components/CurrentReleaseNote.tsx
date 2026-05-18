import { CheckCircle2, History, Layers, ShieldCheck } from "lucide-react";

const releaseItems = [
  "Added src/census/parser/pccResidentListingParser.ts for the real PCC Resident Listing Report column format.",
  "Added support for MRNs with letters inside parentheses, direct Age extraction, Birth Date as DOB, and Location splitting into floor, unit, room, and bed.",
  "Added support for wrapped allergy lines and correct separation of Allergies, Primary Physician, and Primary Diagnosis.",
  "Updated parseCensusText to route detected PCC Resident Listing reports to the dedicated column parser.",
  "Updated resident preview mapping and fixture tests so Age, Sex, Floor, Physician, and Diagnosis populate correctly.",
];

const workflowItems = [
  "Pull the latest main branch before testing the PCC parser hardening.",
  "Run npm run verify:census-parser to confirm PCC parser exports and barrel exports are present.",
  "Run npm run test:census-parser-fixtures to validate the real-format PCC fixture and wrapped allergy handling.",
  "Run npm run build after parser testing before using the census import workflow.",
  "Do not import production census data until the local fixture test and build both pass.",
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
            v3.1.23 — PCC Resident Listing Column Parser Hardening
          </h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
            This release adds a dedicated parser for the real PCC-style Resident Listing Report so census rows map MRN, age, DOB, location, physician, and diagnosis correctly.
          </p>
        </div>
        <div className="flex gap-2 text-sky-800">
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><Layers size={12} className="mr-1 inline" /> PCC Parser</span>
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><ShieldCheck size={12} className="mr-1 inline" /> Format Hardened</span>
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
