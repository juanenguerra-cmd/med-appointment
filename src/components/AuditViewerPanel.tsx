import React, { useMemo, useState } from 'react';
import { Download, Filter, RefreshCw, ShieldCheck, Trash2, Activity, CalendarDays, Edit3, Database } from 'lucide-react';
import { AuditAction, AuditEntity, AuditEvent, clearLocalAuditEvents, getLocalAuditEvents } from '../utils/auditLog';

const safeLower = (value: unknown) => String(value ?? '').toLowerCase();

const ACTION_LABELS: Record<AuditAction, string> = {
  create: 'Create',
  update: 'Update',
  delete: 'Delete',
  import: 'Import',
  replace: 'Replace',
};

const ENTITY_LABELS: Record<AuditEntity, string> = {
  facility: 'Facility',
  appointment: 'Appointment',
  resident: 'Resident',
  user: 'User',
  census: 'Census',
};

function formatDateTime(value: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function isToday(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

function csvEscape(value: unknown) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function buildAuditCsv(events: AuditEvent[]) {
  const headers = ['Timestamp', 'Action', 'Entity', 'Summary', 'Changed Fields', 'Counts', 'Actor Role', 'Actor ID', 'Facility ID', 'Entity ID'];
  const rows = events.map((event) => [
    event.timestamp,
    event.action,
    event.entity,
    event.summary,
    event.changedFields?.join('; ') || '',
    event.counts ? JSON.stringify(event.counts) : '',
    event.actorRole || '',
    event.actorId || '',
    event.facilityId || '',
    event.entityId || '',
  ]);

  return [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
}

function downloadCsv(events: AuditEvent[]) {
  const csv = buildAuditCsv(events);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function SummaryCard({ label, value, sublabel, icon }: { label: string; value: string | number; sublabel: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#d6deeb] bg-white p-4 flex items-center gap-3 shadow-sm">
      <div className="w-11 h-11 rounded-2xl bg-brand-light flex items-center justify-center text-[#0b2a6f]">
        {icon}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-black">{label}</p>
        <p className="text-2xl font-black text-[#0b2a6f] leading-tight">{value}</p>
        <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{sublabel}</p>
      </div>
    </div>
  );
}

export function AuditViewerPanel() {
  const [events, setEvents] = useState<AuditEvent[]>(() => getLocalAuditEvents().reverse());
  const [actionFilter, setActionFilter] = useState<'All' | AuditAction>('All');
  const [entityFilter, setEntityFilter] = useState<'All' | AuditEntity>('All');
  const [search, setSearch] = useState('');

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (actionFilter !== 'All' && event.action !== actionFilter) return false;
      if (entityFilter !== 'All' && event.entity !== entityFilter) return false;
      const haystack = [
        event.summary,
        event.action,
        event.entity,
        event.actorRole,
        event.actorId,
        event.facilityId,
        event.entityId,
        event.changedFields?.join(' '),
      ].join(' ');
      return safeLower(haystack).includes(safeLower(search));
    });
  }, [events, actionFilter, entityFilter, search]);

  const summary = useMemo(() => {
    const todayCount = events.filter((event) => isToday(event.timestamp)).length;
    const updateCount = events.filter((event) => event.action === 'update').length;
    const appointmentCount = events.filter((event) => event.entity === 'appointment').length;
    const uniqueActors = new Set(events.map((event) => event.actorId).filter(Boolean)).size;
    const lastEvent = events[0];

    return {
      total: events.length,
      todayCount,
      updateCount,
      appointmentCount,
      uniqueActors,
      lastEventText: lastEvent ? formatDateTime(lastEvent.timestamp) : 'No events yet',
    };
  }, [events]);

  const refresh = () => setEvents(getLocalAuditEvents().reverse());

  const clearAuditLog = () => {
    const confirmed = window.confirm('Clear local audit log from this browser? This does not delete records from the database.');
    if (!confirmed) return;
    clearLocalAuditEvents();
    setEvents([]);
  };

  return (
    <section className="transport-card overflow-hidden">
      <div className="p-5 border-b border-[#d6deeb] bg-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-light px-3 py-1 text-[10px] font-black uppercase tracking-wider text-brand mb-2">
              <ShieldCheck size={14} />
              Local Audit Viewer
            </div>
            <h3 className="font-black text-[#0b2a6f] text-lg">Audit Log & Change History</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Browser-local action history for traceability. This viewer does not read from or write to Cloudflare D1.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={refresh} className="rounded-full border border-[#d6deeb] bg-white px-4 py-2 text-xs font-black text-[#0b2a6f] hover:bg-slate-50 inline-flex items-center gap-2">
              <RefreshCw size={14} /> Refresh
            </button>
            <button type="button" onClick={() => downloadCsv(filteredEvents)} disabled={filteredEvents.length === 0} className="rounded-full bg-[#0b2a6f] px-4 py-2 text-xs font-black text-white hover:opacity-90 disabled:opacity-40 inline-flex items-center gap-2">
              <Download size={14} /> Export CSV
            </button>
            <button type="button" onClick={clearAuditLog} disabled={events.length === 0} className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-black text-red-700 hover:bg-red-100 disabled:opacity-40 inline-flex items-center gap-2">
              <Trash2 size={14} /> Clear Local
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 border-b border-[#d6deeb] bg-[#f8fbff]">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 mb-4">
          <SummaryCard label="Total Events" value={summary.total} sublabel="Local audit entries" icon={<Activity size={20} />} />
          <SummaryCard label="Today" value={summary.todayCount} sublabel="Events logged today" icon={<CalendarDays size={20} />} />
          <SummaryCard label="Updates" value={summary.updateCount} sublabel="Changed records" icon={<Edit3 size={20} />} />
          <SummaryCard label="Appointments" value={summary.appointmentCount} sublabel="Appointment actions" icon={<Database size={20} />} />
          <SummaryCard label="Actors" value={summary.uniqueActors} sublabel={`Last: ${summary.lastEventText}`} icon={<ShieldCheck size={20} />} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <label className="text-xs font-black text-slate-600">
            <span className="block mb-1 uppercase tracking-wider text-[10px] text-slate-400">Search</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search summary, user, fields..." className="w-full rounded-xl border border-[#d6deeb] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-2/20" />
          </label>

          <label className="text-xs font-black text-slate-600">
            <span className="block mb-1 uppercase tracking-wider text-[10px] text-slate-400">Action</span>
            <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value as 'All' | AuditAction)} className="w-full rounded-xl border border-[#d6deeb] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-2/20">
              <option value="All">All Actions</option>
              {Object.entries(ACTION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>

          <label className="text-xs font-black text-slate-600">
            <span className="block mb-1 uppercase tracking-wider text-[10px] text-slate-400">Entity</span>
            <select value={entityFilter} onChange={(event) => setEntityFilter(event.target.value as 'All' | AuditEntity)} className="w-full rounded-xl border border-[#d6deeb] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-2/20">
              <option value="All">All Entities</option>
              {Object.entries(ENTITY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>

          <div className="rounded-2xl bg-white border border-[#d6deeb] px-4 py-3 flex items-center gap-3">
            <Filter size={16} className="text-[#0b2a6f]" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-black">Showing</p>
              <p className="text-sm font-black text-[#0b2a6f]">{filteredEvents.length} of {events.length}</p>
            </div>
          </div>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="p-10 text-center">
          <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
            <ShieldCheck size={26} />
          </div>
          <p className="font-black text-slate-700">No audit events found</p>
          <p className="text-xs text-slate-400 mt-1">Create, update, or delete an appointment to generate local audit history.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white text-[10px] uppercase tracking-wider text-slate-400 font-black">
              <tr>
                <th className="px-5 py-3 border-b border-[#eef2f7]">Date/Time</th>
                <th className="px-5 py-3 border-b border-[#eef2f7]">Action</th>
                <th className="px-5 py-3 border-b border-[#eef2f7]">Entity</th>
                <th className="px-5 py-3 border-b border-[#eef2f7]">Summary</th>
                <th className="px-5 py-3 border-b border-[#eef2f7]">Changed Fields</th>
                <th className="px-5 py-3 border-b border-[#eef2f7]">Actor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef2f7]">
              {filteredEvents.map((event) => (
                <tr key={event.id} className="bg-white hover:bg-brand-light/20 transition-colors align-top">
                  <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">{formatDateTime(event.timestamp)}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600">{ACTION_LABELS[event.action] || event.action}</span>
                  </td>
                  <td className="px-5 py-4 text-xs font-black text-[#0b2a6f]">{ENTITY_LABELS[event.entity] || event.entity}</td>
                  <td className="px-5 py-4 text-sm text-slate-700 min-w-64">
                    <p className="font-semibold">{event.summary || '—'}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">{event.id}</p>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500 min-w-48">
                    {event.changedFields?.length ? event.changedFields.join(', ') : '—'}
                    {event.counts && <p className="mt-1 font-mono text-[10px]">{JSON.stringify(event.counts)}</p>}
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                    <p>{event.actorRole || '—'}</p>
                    <p className="font-mono text-[10px] text-slate-400">{event.actorId || 'No actor ID'}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
