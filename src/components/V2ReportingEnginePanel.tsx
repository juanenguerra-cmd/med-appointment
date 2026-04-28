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

// NOTE: uses dynamic imports to keep the main app bundle lighter.
const exportPDF = async (appointments: Appointment[], residents: Resident[]) => {
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
};

export const V2ReportingEnginePanel = ({ appointments, residents }: Props) => {
  const summary = buildSummary(appointments);
  const specialty = buildSpecialtyReport(appointments);
  const transport = buildTransportReport(appointments);
  const history = buildResidentHistory(appointments, residents);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <button
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-blue-700"
          onClick={() => downloadCsv("appointments.csv", buildAppointmentDetailRows(appointments))}
        >
          Export CSV
        </button>

        <button
          className="rounded-xl bg-green-600 px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-green-700"
          onClick={() => exportPDF(appointments, residents)}
        >
          Export Survey-Ready PDF
        </button>

        <div className="ml-auto text-xs font-semibold text-slate-500">
          Includes summary, specialty use, transportation use, line listing, and resident history.
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total" value={summary.total} />
        <Stat label="Past" value={summary.past} />
        <Stat label="Future" value={summary.future} />
        <Stat label="Today" value={summary.today} />
      </div>

      <Section title="Specialty Utilization">
        {specialty.map((s: any) => (
          <Row key={s.label} label={s.label} value={s.total} />
        ))}
      </Section>

      <Section title="Transportation Utilization">
        {transport.map((t: any) => (
          <Row key={t.label} label={t.label} value={t.total} />
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
    </div>
  );
};

const Stat = ({ label, value }: any) => (
  <div className="p-4 bg-white rounded-xl shadow">
    <div className="text-xs text-gray-500">{label}</div>
    <div className="text-xl font-bold">{value}</div>
  </div>
);

const Section = ({ title, children }: any) => (
  <div className="bg-white rounded-xl p-4 shadow">
    <h3 className="font-bold mb-2">{title}</h3>
    {children}
  </div>
);

const Row = ({ label, value }: any) => (
  <div className="flex justify-between text-sm border-b py-1">
    <span>{label}</span>
    <span>{value}</span>
  </div>
);
