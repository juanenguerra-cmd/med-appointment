import { motion } from "motion/react";
import { AlertTriangle, CheckCircle2, CheckSquare, ClipboardPaste, Save } from "lucide-react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { PatientCensusUnitList } from "../components/PatientCensusUnitList";
import type { Appointment, Resident } from "../types";
import type { CensusImportSummary } from "../census/parser";

type CensusPageProps = {
  residents: Resident[];
  appointments: Appointment[];
  censusPasteText: string;
  setCensusPasteText: (value: string) => void;
  parsedResidentsPreview: Omit<Resident, "id">[];
  setParsedResidentsPreview: (value: Omit<Resident, "id">[]) => void;
  censusImportSummary?: CensusImportSummary | null;
  setCensusImportSummary?: (value: CensusImportSummary | null) => void;
  isParsing: boolean;
  censusSkipDuplicates: boolean;
  setCensusSkipDuplicates: (value: boolean) => void;
  censusSearchQuery: string;
  setCensusSearchQuery: (value: string) => void;
  handleParseCensus: () => void;
  handleSaveCensus: () => void;
  deleteResident: (residentId: string) => void;
  // Legacy no-op props kept temporarily so App.tsx can be cleaned in a later focused split.
  setSelectedResident?: (resident: Resident) => void;
  setIsResidentDetailOpen?: (open: boolean) => void;
};

const summaryToneClassNames: Record<CensusImportSummary["summaryItems"][number]["tone"], string> = {
  slate: "bg-slate-50 text-slate-700 ring-slate-100",
  sky: "bg-sky-50 text-sky-700 ring-sky-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  rose: "bg-rose-50 text-rose-700 ring-rose-100",
};

function getSummaryBanner(summary: CensusImportSummary): { label: string; className: string } {
  if (summary.safeSaveRecommendation === "blocked") {
    return {
      label: "Blocked — review parser errors before saving.",
      className: "bg-rose-50 text-rose-800 ring-rose-100",
    };
  }

  if (summary.safeSaveRecommendation === "review_required") {
    return {
      label: "Review Required — warnings or duplicates were detected.",
      className: "bg-amber-50 text-amber-800 ring-amber-100",
    };
  }

  return {
    label: "Ready — no blocking parser issues detected.",
    className: "bg-emerald-50 text-emerald-800 ring-emerald-100",
  };
}

export function CensusPage({
  residents,
  appointments,
  censusPasteText,
  setCensusPasteText,
  parsedResidentsPreview,
  setParsedResidentsPreview,
  censusImportSummary,
  setCensusImportSummary,
  isParsing,
  censusSkipDuplicates,
  setCensusSkipDuplicates,
  censusSearchQuery,
  setCensusSearchQuery,
  handleParseCensus,
  handleSaveCensus,
  deleteResident,
}: CensusPageProps) {
  const summaryBanner = censusImportSummary ? getSummaryBanner(censusImportSummary) : null;

  return (
    <motion.section
      key="census"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.18 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-5 space-y-6">
          <Card
            title="Bulk Import / Paste"
            subtitle="Copy from Excel or text and paste here for easy upload."
          >
            <div className="space-y-4">
              <div className="bg-[#fcfdfe] border border-[#d6deeb] rounded-2xl p-4">
                <label className="block text-[10px] font-black uppercase text-brand tracking-widest mb-3 italic">
                  Preferred Format: Resident Listing Report
                </label>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  Select and copy the resident rows from your report and paste them here.
                  <br />
                  The parser automatically extracts{" "}
                  <span className="font-bold text-slate-700">
                    Names, MRNs, Age, Locations, Physicians,
                  </span>{" "}
                  and{" "}
                  <span className="font-bold text-slate-700">Diagnosis</span>.
                </p>
                <textarea
                  className="w-full h-48 px-4 py-3 bg-white rounded-xl border border-[#d6deeb] shadow-inner focus:ring-2 focus:ring-brand-2/20 outline-none text-sm font-medium resize-none"
                  placeholder="Paste Resident Listing Report data here..."
                  value={censusPasteText}
                  onChange={(e) => setCensusPasteText(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3 px-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      censusSkipDuplicates
                        ? "bg-brand border-brand"
                        : "bg-white border-slate-300 group-hover:border-brand"
                    }`}
                  >
                    {censusSkipDuplicates && (
                      <CheckSquare size={14} className="text-white" />
                    )}
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={censusSkipDuplicates}
                      onChange={() =>
                        setCensusSkipDuplicates(!censusSkipDuplicates)
                      }
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-600">
                    Skip Existing Residents
                  </span>
                </label>
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1 gap-2"
                  onClick={handleParseCensus}
                  disabled={isParsing}
                >
                  {isParsing ? (
                    <div className="loading-spinner w-4 h-4 border-2 border-white/30 border-t-white" />
                  ) : (
                    <ClipboardPaste size={18} />
                  )}
                  Parse & Preview
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => {
                    setCensusPasteText("");
                    setParsedResidentsPreview([]);
                    setCensusImportSummary?.(null);
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          </Card>

          {parsedResidentsPreview.length > 0 && (
            <Card
              title="Preview Upload"
              subtitle="Review parsed data before final submission."
              className="border-brand-2 ring-2 ring-brand-2/10"
            >
              {censusImportSummary && summaryBanner && (
                <div className="mb-4 space-y-3">
                  <div className={`flex items-start gap-2 rounded-2xl px-4 py-3 text-xs font-bold ring-1 ${summaryBanner.className}`}>
                    {censusImportSummary.safeSaveRecommendation === "ready" ? (
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                    ) : (
                      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    )}
                    <div>
                      <p className="font-black">{summaryBanner.label}</p>
                      <p className="mt-1 font-semibold opacity-80">
                        Review the summary below before confirming import.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {censusImportSummary.summaryItems.map((item) => (
                      <div
                        key={item.label}
                        className={`rounded-2xl p-3 ring-1 ${summaryToneClassNames[item.tone]}`}
                      >
                        <p className="text-[10px] font-black uppercase tracking-wider opacity-70">
                          {item.label}
                        </p>
                        <p className="mt-1 text-xl font-black">{item.value}</p>
                        <p className="mt-1 text-[10px] font-semibold leading-snug opacity-75">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="max-h-[400px] overflow-y-auto page-scrollbar rounded-xl border border-[#d6deeb] mb-4 shadow-inner">
                <table className="w-full text-left">
                  <thead className="bg-[#f8fbff] text-[10px] font-black uppercase text-[#0b2a6f] sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 border-b border-[#d6deeb]">
                        Resident Name
                      </th>
                      <th className="px-4 py-3 border-b border-[#d6deeb]">
                        MRN
                      </th>
                      <th className="px-4 py-3 border-b border-[#d6deeb]">
                        Age
                      </th>
                      <th className="px-4 py-3 border-b border-[#d6deeb]">
                        Unit / Room
                      </th>
                      <th className="px-4 py-3 border-b border-[#d6deeb]">
                        Physician
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d6deeb] text-xs">
                    {parsedResidentsPreview.map((r, i) => (
                      <tr
                        key={i}
                        className="bg-white hover:bg-brand-light/20 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-extrabold text-slate-900">
                            {r.name}
                          </p>
                          <p className="text-[10px] opacity-60 uppercase">
                            {r.sex}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono">
                          {r.mrn}
                        </td>
                        <td className="px-4 py-3 font-bold">{r.age}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-600">
                            {r.floor !== "—" ? `${r.floor} • ` : ""}
                            {r.unit}
                          </p>
                          <p className="text-[10px] font-black bg-slate-100 inline-block px-1 rounded">
                            {r.roomNumber}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-slate-500 italic">
                          {r.doctor}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between p-2 bg-brand-light/30 rounded-xl mb-4 text-xs font-bold text-brand">
                <span>{parsedResidentsPreview.length} records ready for import</span>
                <CheckSquare size={16} />
              </div>

              <Button className="w-full gap-2" onClick={handleSaveCensus}>
                <Save size={18} /> Confirm & Save to Registry
              </Button>
            </Card>
          )}
        </div>

        <div className="xl:col-span-7">
          <PatientCensusUnitList
            residents={residents}
            appointments={appointments}
            searchQuery={censusSearchQuery}
            onSearchChange={setCensusSearchQuery}
            onViewDetails={() => {
              // Resident detail display is owned by PatientCensusUnitList.
            }}
            onDeleteResident={deleteResident}
          />
        </div>
      </div>
    </motion.section>
  );
}
