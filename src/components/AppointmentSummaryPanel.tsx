import React, { useMemo, useState } from 'react';
import { BarChart3, CalendarClock, FileDown, Users } from 'lucide-react';
import { Appointment, Resident, Facility } from '../types';
import { buildAppointmentSummary, SummaryScope, StatusScope } from '../utils/appointmentSummary';
import { generateFullReport } from '../services/pdfService';

type AppointmentSummaryPanelProps = {
  appointments: Appointment[];
  residents: Resident[];
  facility?: Facility;
};

const scopeOptions: Array<{ value: SummaryScope; label: string }> = [
  { value: 'all', label: 'Past + Future' },
  { value: 'past', label: 'Past only' },
  { value: 'future', label: 'Future only' },
];

const statusOptions: Array<{ value: StatusScope; label: string }> = [
  { value: 'all', label: 'All residents' },
  { value: 'active', label: 'Active residents' },
  { value: 'discharged', label: 'Discharged residents' },
];

const pillClass = (active: boolean) =>
  `rounded-full px-3 py-2 text-xs font-black transition-colors ${
    active ? 'bg-[#0b2a6f] text-white shadow-sm' : 'border border-[#d6deeb] bg-white text-slate-600 hover:bg-slate-50'
  }`;

export function AppointmentSummaryPanel({ appointments, residents, facility }: AppointmentSummaryPanelProps) {
  const [scope, setScope] = useState<SummaryScope>('all');
  const [statusScope, setStatusScope] = useState<StatusScope>('all');

  const summary = useMemo(
    () => buildAppointmentSummary(appointments, residents, scope, statusScope),
    [appointments, residents, scope, statusScope],
  );

  const exportSummaryPdf = () => {
    generateFullReport(
      summary.rows,
      ['Resident Name', 'Date', 'Time', 'Provider', 'Specialty', 'Transport', 'Status', 'Room #', 'Unit'],
      'Medical Appointment Summary Report',
      facility,
    );
  };

  return (
    <section className="transport-card overflow-hidden">
      <div className="border-b border-[#d6deeb] bg-white p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-black text-[#0b2a6f]">
              <BarChart3 size={20} />
              Medical Appointment Summary
            </h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Review past and future appointments, including discharged residents when needed.
            </p>
          </div>

          <button
            type="button"
            onClick={exportSummaryPdf}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0b2a6f] px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-[#123a8c]"
          >
            <FileDown size={15} />
            Export Summary PDF
          </button>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#d6deeb] bg-[#f8fbff] p-3">
            <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">Appointment range</p>
            <div className="flex flex-wrap gap-2">
              {scopeOptions.map((option) => (
                <button key={option.value} type="button" className={pillClass(scope === option.value)} onClick={() => setScope(option.value)}>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#d6deeb] bg-[#f8fbff] p-3">
            <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">Resident status</p>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button key={option.value} type="button" className={pillClass(statusScope === option.value)} onClick={() => setStatusScope(option.value)}>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-5 md:grid-cols-3">
        <div className="rounded-2xl border border-[#d6deeb] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Total</p>
            <Users size={18} className="text-slate-400" />
          </div>
          <p className="mt-2 text-3xl font-black text-[#0b2a6f]">{summary.total}</p>
        </div>

        <div className="rounded-2xl border border-[#d6deeb] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Past</p>
            <CalendarClock size={18} className="text-slate-400" />
          </div>
          <p className="mt-2 text-3xl font-black text-slate-700">{summary.past}</p>
        </div>

        <div className="rounded-2xl border border-[#d6deeb] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Future</p>
            <CalendarClock size={18} className="text-slate-400" />
          </div>
          <p className="mt-2 text-3xl font-black text-emerald-700">{summary.future}</p>
        </div>
      </div>

      <div className="overflow-x-auto px-5 pb-5">
        <table className="w-full text-left">
          <thead className="bg-[#f8fbff] text-[10px] font-black uppercase tracking-wider text-slate-400">
            <tr>
              <th className="border-b border-[#eef2f7] px-4 py-3">Resident</th>
              <th className="border-b border-[#eef2f7] px-4 py-3">Resident Status</th>
              <th className="border-b border-[#eef2f7] px-4 py-3">Date</th>
              <th className="border-b border-[#eef2f7] px-4 py-3">Time</th>
              <th className="border-b border-[#eef2f7] px-4 py-3">Specialty</th>
              <th className="border-b border-[#eef2f7] px-4 py-3">Provider</th>
              <th className="border-b border-[#eef2f7] px-4 py-3">Appointment Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eef2f7] bg-white">
            {summary.rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm font-bold text-slate-400">
                  No appointments found for the selected filters.
                </td>
              </tr>
            ) : (
              summary.rows.map((appointment) => (
                <tr key={appointment.id} className="hover:bg-brand-light/20">
                  <td className="px-4 py-3 text-sm font-black text-slate-800">{appointment.residentName || '—'}</td>
                  <td className="px-4 py-3 text-xs font-black text-slate-600">{appointment.residentStatus}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-600">{appointment.date || '—'}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-600">{appointment.time || '—'}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-600">{appointment.type || '—'}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-600">{appointment.providerName || '—'}</td>
                  <td className="px-4 py-3 text-xs font-black text-slate-600">{appointment.status || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
