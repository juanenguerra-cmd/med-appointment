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

// NOTE: uses dynamic import for jsPDF to avoid bundle bloat
const exportPDF = async (appointments: Appointment[], residents: Resident[]) => {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text("Appointment Report", 10, 10);

  let y = 20;

  appointments.slice(0, 25).forEach((a) => {
    doc.setFontSize(8);
    doc.text(`${a.residentName} | ${a.date} ${a.time} | ${a.type}`, 10, y);
    y += 5;
  });

  doc.save("appointment-report.pdf");
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

      {/* ACTIONS */}
      <div className="flex gap-3">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-xl"
          onClick={() => downloadCsv("appointments.csv", buildAppointmentDetailRows(appointments))}
        >
          Export CSV
        </button>

        <button
          className="px-4 py-2 bg-green-600 text-white rounded-xl"
          onClick={() => exportPDF(appointments, residents)}
        >
          Export PDF
        </button>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total" value={summary.total} />
        <Stat label="Past" value={summary.past} />
        <Stat label="Future" value={summary.future} />
        <Stat label="Today" value={summary.today} />
      </div>

      {/* SPECIALTY */}
      <Section title="Specialty Utilization">
        {specialty.map((s: any) => (
          <Row key={s.label} label={s.label} value={s.total} />
        ))}
      </Section>

      {/* TRANSPORT */}
      <Section title="Transportation Utilization">
        {transport.map((t: any) => (
          <Row key={t.label} label={t.label} value={t.total} />
        ))}
      </Section>

      {/* RESIDENT HISTORY */}
      <Section title="Resident Appointment History">
        {history.map((r: any) => (
          <div key={r.name} className="flex justify-between text-sm border-b py-1">
            <div>
              <strong>{r.name}</strong> ({r.room})
            </div>
            <div>
              {r.total} visits ({r.past} / {r.future})
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
