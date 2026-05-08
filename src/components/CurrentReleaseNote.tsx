import { CheckCircle2, History, Layers, ShieldCheck } from "lucide-react";

const releaseItems = [
  "Added src/census/parser/censusImportSummary.ts to generate reusable import summary data from ParsedCensusResult.",
  "Added CensusImportSummary and CensusImportSummaryItem types for future UI summary cards and safe-save review messaging.",
  "Added createCensusImportSummary to calculate parsed totals, warning counts, duplicate groups, missing field counts, readiness flags, and safe-save recommendation.",
  "Added getCensusImportSummaryMessage for user-friendly import status messaging.",
  "Updated parser barrel exports and verifier coverage to include the census import summary mapper.",
];

const workflowItems = [
  "Run npm run verify:census-parser locally to confirm summary mapper exports are present.",
  "Run npm run test:census-parser-fixtures to confirm parser output remains stable.",
  "Use createCensusImportSummary after parseCensusText before showing or saving census preview data.",
  "Keep handleSaveCensus unchanged until safe save mode and import summary UI are added.",
  "No D1 migration is required for this summary mapper release.",
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
            v3.1.20 — Census Import Summary Types and Mapper
          </h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
            This release adds a reusable census import summary mapper so parsed census results can be reviewed for warnings, duplicates, readiness, and safe-save status before saving.
          </p>
        </div>
        <div className="flex gap-2 text-sky-800">
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><Layers size={12} className="mr-1 inline" /> Import Summary</span>
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"><ShieldCheck size={12} className="mr-1 inline" /> Safe Save Prep</span>
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
