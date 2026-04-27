import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  FileDown,
  Search,
  Stethoscope,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import { Appointment, Resident, Facility } from '../types';
import { buildAppointmentSummary, SummaryScope, StatusScope } from '../utils/appointmentSummary';
import { generateFullReport } from '../services/pdfService';

type AppointmentSummaryPanelProps = {
  appointments: Appointment[];
  residents: Resident[];
  facility?: Facility;
};

const scopeOptions: Array<{ value: SummaryScope; label: string; helper: string }> = [
  { value: 'all', label: 'Past + Future', helper: 'Complete workload view' },
  { value: 'past', label: 'Past only', helper: 'Completed or missed follow-up review' },
  { value: 'future', label: 'Future only', helper: 'Upcoming coordination needs' },
];

const statusOptions: Array<{ value: StatusScope; label: string; helper: string }> = [
  { value: 'all', label: 'All residents', helper: 'Active and discharged' },
  { value: 'active', label: 'Active residents', helper: 'Current census only' },
  { value: 'discharged', label: 'Discharged residents', helper: 'History and follow-up review' },
];

const safeText = (value: unknown) => String(value ?? '').trim();
const safeLower = (value: unknown) => safeText(value).toLowerCase();

const pillClass = (active: boolean) =>
  `rounded-full px-3 py-2 text-xs font-black transition-colors ${
    active ? 'bg-[#0b2a6f] text-white shadow-sm' : 'border border-[#d6deeb] bg-white text-slate-600 hover:bg-slate-50'
  }`;

const statusBadgeClass = (status: string) =>
  status === 'Discharged'
    ? 'border-amber-200 bg-amber-50 text-amber-800'
    : 'border-emerald-200 bg-emerald-50 text-emerald-700';

const appointmentStatusBadgeClass = (status: string) => {
  const normalized = safeLower(status);
  if (normalized.includes('cancel') || normalized.includes('miss') || normalized.includes('no show')) {
    return 'border-rose-200 bg-rose-50 text-rose-700';
  }
  if (normalized.includes('complete')) return 'border-slate-200 bg-slate-50 text-slate-700';
  return 'border-blue-200 bg-blue-50 text-blue-700';
};

const topEntries = (items: Record<string, number>, limit = 5) =>
  Object.entries(items)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit);

const countBy = <T,>(rows: T[], getKey: (row: T) => string) =>
  rows.reduce<Record<string, number>>((acc, row) => {
    const key = getKey(row) || 'Unassigned';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

export function AppointmentSummaryPanel({ appointments, residents, facility }: AppointmentSummaryPanelProps) {
  const [scope, setScope] = useState<SummaryScope>('all');
  const [statusScope, setStatusScope] = useState<StatusScope>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const summary = useMemo(
    () => buildAppointmentSummary(appointments, residents, scope, statusScope),
    [appointments, residents, scope, statusScope],
  );

  const filteredRows = useMemo(() => {
    const q = safeLower(searchQuery);
    if (!q) return summary.rows;

    return summary.rows.filter((appointment) =>
      [
        appointment.residentName,
        appointment.residentStatus,
        appointment.date,
        appointment.time,
        appointment.type,
        appointment.providerName,
        appointment.status,
        appointment.transportType,
        appointment.location,
      ]
        .map((value) => safeLower(value))
        .some((value) => value.includes(q)),
    );
  }, [summary.rows, searchQuery]);

  const visibleSummary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const discharged = filteredRows.filter((row) => row.residentStatus === 'Discharged').length;
    const active = filteredRows.filter((row) => row.residentStatus === 'Active').length;
    const past = filteredRows.filter((row) => row.date < today).length;
    const future = filteredRows.filter((row) => row.date >= today).length;
    const cancelledOrMissed = filteredRows.filter((row) => {
      const status = safeLower(row.status);
      return status.includes('cancel') || status.includes('miss') || status.includes('no show');
    }).length;

    return {
      total: filteredRows.length,
      active,
      discharged,
      past,
      future,
      cancelledOrMissed,
      bySpecialty: countBy(filteredRows, (row) => safeText(row.type)),
      byProvider: countBy(filteredRows, (row) => safeText(row.providerName)),
    };
  }, [filteredRows]);

  const exportSummaryPdf = () => {
    generateFullReport(
      filteredRows,
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
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d6deeb] bg-[#f8fbff] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
              <BarChart3 size={13} />
              v1.1 Summary Report
            </div>
            <h3 className="mt-2 flex items-center gap-2 text-xl font-black text-[#0b2a6f]">
              Medical Appointment Summary
            </h3>
            <p className="mt-1 max-w-3xl text-sm font-semibold leading-relaxed text-slate-500">
              Review appointment workload across past and future visits. Include discharged residents when checking follow-up history, missed visits, or pending outside appointments.
            </p>
          </div>

          <button
            type="button"
            onClick={exportSummaryPdf}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0b2a6f] px-4 py-2.5 text-xs font-black text-white shadow-sm hover:bg-[#123a8c]"
          >
            <FileDown size={15} />
            Export Visible PDF
          </button>
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_1fr_320px]">
          <div className="rounded-2xl border border-[#d6deeb] bg-[#f8fbff] p-3">
            <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">Appointment range</p>
            <div className="flex flex-wrap gap-2">
              {scopeOptions.map((option) => (
                <button key={option.value} type="button" className={pillClass(scope === option.value)} onClick={() => setScope(option.value)} title={option.helper}>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#d6deeb] bg-[#f8fbff] p-3">
            <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">Resident status</p>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button key={option.value} type="button" className={pillClass(statusScope === option.value)} onClick={() => setStatusScope(option.value)} title={option.helper}>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#d6deeb] bg-white p-3">
            <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">Quick search</p>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Resident, provider, specialty..."
                className="w-full rounded-xl border border-[#d6deeb] bg-white py-2 pl-9 pr-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#0b2a6f]/15"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label="Visible total" value={visibleSummary.total} icon={<Users size={18} />} tone="text-[#0b2a6f]" />
        <SummaryCard label="Past" value={visibleSummary.past} icon={<CalendarClock size={18} />} tone="text-slate-700" />
        <SummaryCard label="Future" value={visibleSummary.future} icon={<CalendarClock size={18} />} tone="text-emerald-700" />
        <SummaryCard label="Discharged" value={visibleSummary.discharged} icon={<UserX size={18} />} tone="text-amber-700" />
        <SummaryCard label="Cancel/Missed" value={visibleSummary.cancelledOrMissed} icon={<AlertTriangle size={18} />} tone="text-rose-700" />
      </div>

      <div className="grid gap-4 px-5 pb-5 xl:grid-cols-2">
        <BreakdownCard title="Top Specialties" icon={<Stethoscope size={17} />} entries={topEntries(visibleSummary.bySpecialty)} total={visibleSummary.total} />
        <BreakdownCard title="Top Providers" icon={<UserCheck size={17} />} entries={topEntries(visibleSummary.byProvider)} total={visibleSummary.total} />
      </div>

      <div className="border-t border-[#d6deeb] bg-white px-5 py-4">
        <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <div>
            <h4 className="text-sm font-black text-[#0b2a6f]">Detailed Appointment List</h4>
            <p className="text-xs font-semibold text-slate-500">
              Showing {filteredRows.length} of {summary.rows.length} appointments after search and filter.
            </p>
          </div>
          {visibleSummary.discharged > 0 && (
            <p className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-black text-amber-800">
              Includes discharged resident follow-up history
            </p>
          )}
        </div>
      </div>

      <div className="overflow-x-auto px-5 pb-5">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-[#f8fbff] text-[10px] font-black uppercase tracking-wider text-slate-400">
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
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm font-bold text-slate-400">
                  No appointments found for the selected filters or search.
                </td>
              </tr>
            ) : (
              filteredRows.map((appointment) => (
                <tr key={appointment.id} className="hover:bg-brand-light/20">
                  <td className="px-4 py-3">
                    <p className="text-sm font-black text-slate-800">{appointment.residentName || '—'}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{appointment.transportType || 'Transport not listed'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black ${statusBadgeClass(appointment.residentStatus)}`}>
                      {appointment.residentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-600">{appointment.date || '—'}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-600">{appointment.time || '—'}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-600">{appointment.type || '—'}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-600">{appointment.providerName || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black ${appointmentStatusBadgeClass(appointment.status)}`}>
                      {appointment.status || 'Scheduled'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SummaryCard({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: string }) {
  return (
    <div className="rounded-2xl border border-[#d6deeb] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</p>
        <div className="text-slate-400">{icon}</div>
      </div>
      <p className={`mt-2 text-3xl font-black ${tone}`}>{value}</p>
    </div>
  );
}

function BreakdownCard({ title, icon, entries, total }: { title: string; icon: React.ReactNode; entries: Array<[string, number]>; total: number }) {
  return (
    <div className="rounded-2xl border border-[#d6deeb] bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-sm font-black text-[#0b2a6f]">{icon}{title}</h4>
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Top 5</span>
      </div>

      {entries.length === 0 ? (
        <p className="py-5 text-center text-xs font-bold text-slate-400">No data available.</p>
      ) : (
        <div className="space-y-3">
          {entries.map(([label, count]) => {
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={label}>
                <div className="mb-1 flex items-center justify-between gap-3 text-xs font-bold text-slate-600">
                  <span className="truncate">{label}</span>
                  <span className="font-black text-slate-700">{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-[#0b2a6f]" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
