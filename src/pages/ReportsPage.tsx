import { motion } from "motion/react";
import { Calendar, CheckSquare, Database, FileDown, FileSpreadsheet, FileText, Printer } from "lucide-react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import type { Appointment, Facility, Resident } from "../types";

type ReportFilters = {
  startDate: string;
  endDate: string;
  specialties: string[];
  exportType: string;
  columns: string[];
};

type ReportsPageProps = {
  appointments: Appointment[];
  residents: Resident[];
  currentFacility: Facility | undefined;
  reportFilters: ReportFilters;
  setReportFilters: React.Dispatch<React.SetStateAction<ReportFilters>>;
  setReportPreset: (type: "today" | "week" | "month") => void;
  handleOpenEdit: (appointment: Appointment) => void;
  handleSaveAllAppointments: (updates: Record<string, Partial<Appointment>>) => void;
  handleDuplicateAppt: (appointment: Appointment) => void;
  handleGenerateForm: (appointment: Appointment, formType: string) => void;
  generateFullReport: (
    appointments: Appointment[],
    columns: string[],
    title?: string,
    facility?: Facility,
  ) => void;
  generateTransportSchedulePDF: (
    appointments: Appointment[],
    startDate: string,
    endDate: string,
    facility?: Facility,
  ) => void;
  FormField: (props: {
    label: string;
    info?: string;
    children: React.ReactNode;
  }) => JSX.Element;
  WideAppointmentTable: (props: {
    appointments: Appointment[];
    residents: Resident[];
    currentFacility?: Facility;
    selectedColumns?: string[];
    onEdit: (appointment: Appointment) => void;
    onSaveAll: (updates: Record<string, Partial<Appointment>>) => void;
    onDuplicate: (appointment: Appointment) => void;
    onGenerateForm: (appointment: Appointment, formType: string) => void;
  }) => JSX.Element;
};

export function ReportsPage({
  appointments,
  residents,
  currentFacility,
  reportFilters,
  setReportFilters,
  setReportPreset,
  handleOpenEdit,
  handleSaveAllAppointments,
  handleDuplicateAppt,
  handleGenerateForm,
  generateFullReport,
  generateTransportSchedulePDF,
  FormField,
  WideAppointmentTable,
}: ReportsPageProps) {
  const filteredAppointments = appointments.filter((apt) => {
    const date = String(apt.date || "");
    const start = reportFilters.startDate || null;
    const end = reportFilters.endDate || null;
    if (start && date < start) return false;
    if (end && date > end) return false;
    return true;
  });

  return (
    <motion.section
      key="reports"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.18 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-4 space-y-6">
          <Card
            title="Report Configuration"
            subtitle="Define boundaries for data extraction."
          >
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="block text-xs font-black uppercase text-slate-500">
                  Quick Presets
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setReportPreset("today")}
                    className="px-3 py-1.5 rounded-lg border border-[#d6deeb] text-xs font-bold hover:bg-brand-light transition-colors"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setReportPreset("week")}
                    className="px-3 py-1.5 rounded-lg border border-[#d6deeb] text-xs font-bold hover:bg-brand-light transition-colors"
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => setReportPreset("month")}
                    className="px-3 py-1.5 rounded-lg border border-[#d6deeb] text-xs font-bold hover:bg-brand-light transition-colors"
                  >
                    Last Month
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="From Date">
                  <input
                    type="date"
                    value={reportFilters.startDate}
                    onChange={(e) =>
                      setReportFilters({
                        ...reportFilters,
                        startDate: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 outline-none bg-white text-sm"
                  />
                </FormField>

                <FormField label="To Date">
                  <input
                    type="date"
                    value={reportFilters.endDate}
                    onChange={(e) =>
                      setReportFilters({
                        ...reportFilters,
                        endDate: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 outline-none bg-white text-sm"
                  />
                </FormField>
              </div>

              <FormField label="Export Format">
                <div className="grid grid-cols-1 gap-2">
                  {[
                    "PDF Document (.pdf)",
                    "Excel Worksheet (.xlsx)",
                    "CSV Data (.csv)",
                  ].map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() =>
                        setReportFilters({
                          ...reportFilters,
                          exportType: fmt,
                        })
                      }
                      className={`flex items-center justify-between p-3 rounded-xl border text-sm font-bold transition-all ${
                        reportFilters.exportType === fmt
                          ? "border-brand bg-brand-light text-brand shadow-sm"
                          : "border-[#d6deeb] bg-white text-slate-600 hover:border-brand/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {fmt.includes(".pdf") ? (
                          <FileText size={16} />
                        ) : fmt.includes(".xlsx") ? (
                          <FileSpreadsheet size={16} />
                        ) : (
                          <Database size={16} />
                        )}
                        {fmt}
                      </div>
                      {reportFilters.exportType === fmt && (
                        <CheckSquare size={14} />
                      )}
                    </button>
                  ))}
                </div>
              </FormField>

              <div className="pt-4 flex gap-3">
                <Button
                  className="flex-1 gap-2 shadow-lg hover:shadow-brand/20"
                  onClick={() => {
                    generateFullReport(
                      filteredAppointments,
                      reportFilters.columns,
                      undefined,
                      currentFacility,
                    );
                  }}
                >
                  <FileDown size={18} /> Generate
                </Button>

                <Button variant="secondary" className="px-4">
                  <Printer size={18} />
                </Button>
              </div>

              <div className="pt-4 border-t border-[#d6deeb]">
                <label className="block text-xs font-black uppercase text-slate-500 mb-3">
                  Specialized Templates
                </label>
                <Button
                  variant="secondary"
                  className="w-full gap-3 justify-center border-brand/20 hover:bg-brand-light"
                  onClick={() => {
                    generateTransportSchedulePDF(
                      filteredAppointments,
                      reportFilters.startDate || "all",
                      reportFilters.endDate || "all",
                      currentFacility,
                    );
                  }}
                >
                  <Calendar size={18} /> Export Transport Calendar
                </Button>
                <p className="text-[10px] text-slate-400 mt-2 text-center italic">
                  Matches the facility transport schedule grid format.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="xl:col-span-8 space-y-6">
          <Card
            title="Column Selection"
            subtitle="Choose which data tags to include in your output."
          >
            <div className="space-y-3">
              <label
                htmlFor="report-columns"
                className="block text-sm font-medium text-slate-700"
              >
                Select Columns (Hold Ctrl/Cmd to select multiple)
              </label>
              <select
                id="report-columns"
                multiple
                value={reportFilters.columns}
                onChange={(e) => {
                  const options = (
                    Array.from(e.target.selectedOptions) as HTMLOptionElement[]
                  ).map((option) => option.value);
                  setReportFilters((prev) => ({ ...prev, columns: options }));
                }}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none font-bold text-sm min-h-[200px]"
              >
                {[
                  "Resident Name",
                  "Date",
                  "Time",
                  "Provider",
                  "Specialty",
                  "Transport",
                  "Status",
                  "Origin",
                  "Room #",
                  "Unit",
                  "Notes",
                  "Payer",
                  "Weight",
                  "Height",
                ].map((col) => (
                  <option key={col} value={col} className="p-2">
                    {col}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          <Card
            title="Live Preview (Draft)"
            subtitle="Real-time look at filtered records."
            className="overflow-hidden"
          >
            <div className="mt-2">
              {appointments.length > 0 ? (
                <WideAppointmentTable
                  appointments={filteredAppointments.slice(0, 10)}
                  residents={residents}
                  currentFacility={currentFacility}
                  selectedColumns={reportFilters.columns}
                  onEdit={handleOpenEdit}
                  onSaveAll={handleSaveAllAppointments}
                  onDuplicate={handleDuplicateAppt}
                  onGenerateForm={handleGenerateForm}
                />
              ) : (
                <div className="py-20 text-center opacity-40 italic text-sm">
                  No data matching current filters
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </motion.section>
  );
}