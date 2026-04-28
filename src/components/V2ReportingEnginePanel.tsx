import React from "react";
import { Appointment, Resident } from "../types";
import {
  buildSummary,
  buildSpecialtyReport,
  buildTransportReport,
  buildResidentHistory,
  buildAppointmentDetailRows,
  downloadCsv,
} from "../utils/reportingEngine";

const formatDateTime = () => new Date().toLocaleString();

const getTodayKey = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
};

const formatTime = (value?: string) => {
  const raw = String(value || "").trim();
  if (!raw) return "—";
  if (/\b(AM|PM)\b/i.test(raw)) return raw;
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return raw;
  const date = new Date(`1970-01-01T${match[1].padStart(2, "0")}:${match[2]}:00`);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
};

const getResidentStatus = (resident?: Resident) => {
  const status = String(resident?.status || "Active").trim();
  if (/discharged|inactive/i.test(status)) return "Discharged";
  return "Active";
};

const filterAppointments = (
  appointments: Appointment[],
  residents: Resident[],
  filters: {
    startDate: string;
    endDate: string;
    unit: string;
    residentStatus: string;
    specialty: string;
    transport: string;
  },
) => {
  const residentMap = new Map(residents.map((r) => [String(r.name || "").toLowerCase(), r]));

  return appointments.filter((appointment) => {
    const date = String(appointment.date || "");
    const resident = residentMap.get(String(appointment.residentName || "").toLowerCase());
    const residentStatus = getResidentStatus(resident);
    const unit = appointment.unit || resident?.unit || "";
    const transport = appointment.transportCompanyOther || appointment.transportCompany || "Unassigned";

    if (filters.startDate && date < filters.startDate) return false;
    if (filters.endDate && date > filters.endDate) return false;
    if (filters.unit !== "All" && unit !== filters.unit) return false;
    if (filters.residentStatus !== "All" && residentStatus !== filters.residentStatus) return false;
    if (filters.specialty !== "All" && appointment.type !== filters.specialty) return false;
    if (filters.transport !== "All" && transport !== filters.transport) return false;

    return true;
  });
};

// NOTE: uses dynamic imports to keep the main app bundle lighter.
const exportPDF = async (appointments: Appointment[], residents: Resident[], filterLabel: string) => {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const autoTable = (autoTableModule as any).default;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const summary = buildSummary(appointments);
  const specialty = buildSpecialtyReport(appointments);
  const transport = buildTransportReport(appointments);
  const history = buildResidentHistory(appointments, residents);

  const addHeader = (subtitle = "Appointment Reporting Engine") => {
    doc.setFillColor(11, 42, 111);
    doc.rect(0, 0, pageWidth, 24, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("MEDICAL APPOINTMENT SUMMARY REPORT", 12, 10);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(subtitle, 12, 16);
    doc.text(`Generated: ${formatDateTime()} | Total Records: ${appointments.length}`, pageWidth - 12, 16, { align: "right" });
    doc.setTextColor(0, 0, 0);
  };

  const addFooter = () => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i += 1) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(90, 90, 90);
      doc.text("CONFIDENTIAL MEDICAL RECORD / QAPI REVIEW SUPPORT", pageWidth / 2, pageHeight - 8, { align: "center" });
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 12, pageHeight - 8, { align: "right" });
    }
    doc.setTextColor(0, 0, 0);
  };

  addHeader("Survey-ready appointment summary, specialty use, transport use, and resident history.");

  autoTable(doc, {
    startY: 30,
    head: [["Applied Filters", filterLabel]],
    body: [],
    theme: "grid",
    headStyles: { fillColor: [245, 248, 255], textColor: [11, 42, 111], fontStyle: "bold" },
    styles: { fontSize: 8, cellPadding: 2 },
    margin: { left: 10, right: 10 },
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 5,
    head: [["Metric", "Count", "Metric", "Count", "Metric", "Count"]],
    body: [
      ["Total", summary.total, "Past", summary.past, "Future", summary.future],
      ["Today", summary.today, "Scheduled", summary.scheduled, "Completed", summary.completed],
      ["Cancelled/Deferred", summary.cancelled, "Escort Required", summary.escortRequired, "Missing Transport Phone", summary.missingTransportPhone],
    ],
    theme: "grid",
    headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255], fontStyle: "bold" },
    styles: { fontSize: 8, cellPadding: 2 },
    margin: { left: 10, right: 10 },
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 8,
    head: [["Specialty", "Total", "Past", "Future", "Scheduled", "Completed", "Cancelled/Deferred"]],
    body: specialty.map((row: any) => [row.label, row.total, row.past, row.future, row.scheduled, row.completed, row.cancelled]),
    theme: "striped",
    headStyles: { fillColor: [11, 42, 111], textColor: [255, 255, 255] },
    styles: { fontSize: 7, cellPadding: 2 },
    margin: { left: 10, right: 10 },
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 8,
    head: [["Transportation Company", "Total", "Scheduled", "Completed", "Escort Required", "Missing Phone"]],
    body: transport.map((row: any) => [row.label, row.total, row.scheduled, row.completed, row.escortRequired, row.missingPhone]),
    theme: "striped",
    headStyles: { fillColor: [11, 42, 111], textColor: [255, 255, 255] },
    styles: { fontSize: 7, cellPadding: 2 },
    margin: { left: 10, right: 10 },
  });

  doc.addPage();
  addHeader("Detailed appointment line listing.");

  autoTable(doc, {
    startY: 30,
    head: [["Date", "Time", "Resident", "Unit/Rm", "Status", "Specialty", "Provider", "Transport / Phone", "Escort / Phone"]],
    body: appointments.map((a) => [
      a.date || "—",
      formatTime(a.time),
      a.residentName || "—",
      `${a.unit || ""} ${a.roomNumber || ""}`.trim() || "—",
      a.status || "—",
      a.type || "—",
      a.providerName || "—",
      [a.transportCompanyOther || a.transportCompany || "—", a.transportCompanyPhone ? `Phone: ${a.transportCompanyPhone}` : ""].filter(Boolean).join("\n"),
      [a.escortDetails || a.escort || "—", a.escortPhone ? `Phone: ${a.escortPhone}` : ""].filter(Boolean).join("\n"),
    ]),
    theme: "grid",
    headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255], fontSize: 7 },
    styles: { fontSize: 6.5, cellPadding: 1.5, valign: "top" },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 18 },
      2: { cellWidth: 42 },
      3: { cellWidth: 20 },
      4: { cellWidth: 22 },
      5: { cellWidth: 32 },
      6: { cellWidth: 38 },
      7: { cellWidth: 42 },
      8: { cellWidth: 40 },
    },
    margin: { left: 8, right: 8 },
  });

  doc.addPage();
  addHeader("Resident appointment history summary.");

  autoTable(doc, {
    startY: 30,
    head: [["Resident", "Status", "Unit", "Room", "Total", "Past", "Upcoming/Today", "Last Appointment", "Next Appointment"]],
    body: history.map((row: any) => [row.name, row.status, row.unit || "—", row.room || "—", row.total, row.past, row.future, row.lastAppointment || "—", row.nextAppointment || "—"]),
    theme: "grid",
    headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255], fontSize: 7 },
    styles: { fontSize: 7, cellPadding: 2 },
    margin: { left: 10, right: 10 },
  });

  addFooter();
  doc.save(`Survey_Ready_Appointment_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
};

type Props = {
  appointments: Appointment[];
  residents: Resident[];
  currentUserRole?: string | null;
};

export const V2ReportingEnginePanel = ({ appointments, residents, currentUserRole }: Props) => {
  const isAdmin = String(currentUserRole || "").toLowerCase() === "admin";
  const uniqueUnits = React.useMemo(() => Array.from(new Set(appointments.map((a) => a.unit).filter(Boolean))).sort(), [appointments]);
  const uniqueSpecialties = React.useMemo(() => Array.from(new Set(appointments.map((a) => a.type).filter(Boolean))).sort(), [appointments]);
  const uniqueTransports = React.useMemo(() => Array.from(new Set(appointments.map((a) => a.transportCompanyOther || a.transportCompany || "Unassigned"))).sort(), [appointments]);

  const [filters, setFilters] = React.useState({
    startDate: "",
    endDate: "",
    unit: "All",
    residentStatus: "All",
    specialty: "All",
    transport: "All",
  });

  const filteredAppointments = React.useMemo(() => filterAppointments(appointments, residents, filters), [appointments, residents, filters]);
  const summary = buildSummary(filteredAppointments);
  const specialty = buildSpecialtyReport(filteredAppointments);
  const transport = buildTransportReport(filteredAppointments);
  const history = buildResidentHistory(filteredAppointments, residents);
  const filterLabel = `Date: ${filters.startDate || "All"} to ${filters.endDate || "All"} | Unit: ${filters.unit} | Resident Status: ${filters.residentStatus} | Specialty: ${filters.specialty} | Transport: ${filters.transport}`;

  const resetFilters = () => setFilters({ startDate: "", endDate: "", unit: "All", residentStatus: "All", specialty: "All", transport: "All" });

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900">V2 Reporting Engine</h3>
            <p className="text-xs font-semibold text-slate-500">
              {isAdmin ? "Admin view: all report slices and exported audit summaries." : "Staff view: operational report tools for appointment coordination."}
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
            {isAdmin ? "Admin Dashboard" : "Staff Dashboard"}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <FormControl label="From">
            <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} className="report-input" />
          </FormControl>
          <FormControl label="To">
            <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} className="report-input" />
          </FormControl>
          <FormControl label="Unit">
            <select value={filters.unit} onChange={(e) => setFilters({ ...filters, unit: e.target.value })} className="report-input">
              <option value="All">All Units</option>
              {uniqueUnits.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
            </select>
          </FormControl>
          <FormControl label="Resident Status">
            <select value={filters.residentStatus} onChange={(e) => setFilters({ ...filters, residentStatus: e.target.value })} className="report-input">
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Discharged">Discharged</option>
            </select>
          </FormControl>
          <FormControl label="Specialty">
            <select value={filters.specialty} onChange={(e) => setFilters({ ...filters, specialty: e.target.value })} className="report-input">
              <option value="All">All Specialties</option>
              {uniqueSpecialties.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </FormControl>
          <FormControl label="Transport">
            <select value={filters.transport} onChange={(e) => setFilters({ ...filters, transport: e.target.value })} className="report-input">
              <option value="All">All Transport</option>
              {uniqueTransports.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </FormControl>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-blue-700"
            onClick={() => downloadCsv("appointments_filtered.csv", buildAppointmentDetailRows(filteredAppointments))}
          >
            Export Filtered CSV
          </button>

          <button
            className="rounded-xl bg-green-600 px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-green-700"
            onClick={() => exportPDF(filteredAppointments, residents, filterLabel)}
          >
            Export Filtered Survey-Ready PDF
          </button>

          <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-50" onClick={resetFilters}>
            Reset Filters
          </button>

          <div className="ml-auto text-xs font-semibold text-slate-500">
            Showing {filteredAppointments.length} of {appointments.length} appointments
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Filtered Total" value={summary.total} />
        <Stat label="Past" value={summary.past} />
        <Stat label="Future" value={summary.future} />
        <Stat label="Today" value={summary.today} />
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Stat label="Missing Transport Phone" value={summary.missingTransportPhone} />
          <Stat label="Escort Required" value={summary.escortRequired} />
          <Stat label="Cancelled / Deferred" value={summary.cancelled} />
        </div>
      )}

      <Section title="Specialty Utilization">
        {specialty.map((s: any) => (
          <Row key={s.label} label={s.label} value={`${s.total} total • ${s.completed} completed • ${s.scheduled} scheduled`} />
        ))}
      </Section>

      <Section title="Transportation Utilization">
        {transport.map((t: any) => (
          <Row key={t.label} label={t.label} value={`${t.total} total • ${t.escortRequired} escort • ${t.missingPhone} missing phone`} />
        ))}
      </Section>

      <Section title="Resident Appointment History">
        {history.map((r: any) => (
          <div key={r.name} className="flex justify-between text-sm border-b py-1">
            <div>
              <strong>{r.name}</strong> ({r.room || "—"})
              <span className="ml-2 text-xs font-bold text-slate-400">{r.status}</span>
            </div>
            <div>
              {r.total} visits ({r.past} past / {r.future} upcoming)
            </div>
          </div>
        ))}
      </Section>

      <style>{`
        .report-input {
          width: 100%;
          border-radius: 0.9rem;
          border: 1px solid #d6deeb;
          background: white;
          padding: 0.65rem 0.75rem;
          font-size: 0.78rem;
          font-weight: 700;
          color: #334155;
          outline: none;
        }
        .report-input:focus {
          box-shadow: 0 0 0 3px rgba(11, 42, 111, 0.10);
          border-color: #0b2a6f;
        }
      `}</style>
    </div>
  );
};

const FormControl = ({ label, children }: any) => (
  <label className="block">
    <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</span>
    {children}
  </label>
);

const Stat = ({ label, value }: any) => (
  <div className="p-4 bg-white rounded-xl shadow border border-slate-100">
    <div className="text-xs font-black uppercase tracking-wider text-gray-500">{label}</div>
    <div className="text-2xl font-black text-[#0b2a6f]">{value}</div>
  </div>
);

const Section = ({ title, children }: any) => (
  <div className="bg-white rounded-xl p-4 shadow border border-slate-100">
    <h3 className="font-black text-slate-800 mb-2">{title}</h3>
    <div className="space-y-1">{children}</div>
  </div>
);

const Row = ({ label, value }: any) => (
  <div className="flex justify-between gap-4 text-sm border-b py-2 last:border-b-0">
    <span className="font-bold text-slate-700">{label}</span>
    <span className="text-right text-slate-500 font-semibold">{value}</span>
  </div>
);
