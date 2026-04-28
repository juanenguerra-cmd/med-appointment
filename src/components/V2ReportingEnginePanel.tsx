import React from "react";
import { Appointment, Resident } from "../types";
import {
  buildSummary,
  buildSpecialtyReport,
  buildTransportReport,
  buildResidentHistory,
} from "../utils/reportingEngine";

type Props = {
  appointments: Appointment[];
  residents: Resident[];
};

export const V2ReportingEnginePanel = ({
  appointments,
  residents,
}: Props) => {
  const summary = buildSummary(appointments);
  const specialty = buildSpecialtyReport(appointments);
  const transport = buildTransportReport(appointments);
  const history = buildResidentHistory(appointments, residents);

  return (
    <div className="space-y-6">

      {/* SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total" value={summary.total} />
        <Stat label="Past" value={summary.past} />
        <Stat label="Future" value={summary.future} />
        <Stat label="Today" value={summary.today} />
      </div>

      {/* SPECIALTY */}
      <Section title="Specialty Utilization">
        {specialty.map((s) => (
          <Row key={s.label} label={s.label} value={s.total} />
        ))}
      </Section>

      {/* TRANSPORT */}
      <Section title="Transportation Utilization">
        {transport.map((t) => (
          <Row key={t.label} label={t.label} value={t.total} />
        ))}
      </Section>

      {/* RESIDENT HISTORY */}
      <Section title="Resident Appointment History">
        {history.map((r: any) => (
          <div
            key={r.name}
            className="flex justify-between text-sm border-b py-1"
          >
            <div>
              <strong>{r.name}</strong> ({r.room})
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