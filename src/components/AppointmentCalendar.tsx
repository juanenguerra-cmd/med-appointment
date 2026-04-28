import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Printer,
  Stethoscope,
} from 'lucide-react';
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns';
import { Appointment, Resident } from '../types';
import {
  buildAppointmentIntelligence,
  getTransportReadinessIssues,
  isMissedAppointment,
  isOverdueAppointment,
  isTransportReady,
} from '../utils/appointmentIntelligence';

interface AppointmentCalendarProps {
  appointments: Appointment[];
  residents: Resident[];
  getDoctorNameDisplay: (apt: Appointment) => string;
  onAppointmentClick: (apt: Appointment) => void;
}

function IntelligenceCard({
  label,
  value,
  tone = 'default',
  helper,
}: {
  label: string;
  value: number;
  tone?: 'default' | 'danger' | 'warning' | 'success';
  helper: string;
}) {
  const toneClass =
    tone === 'danger'
      ? 'bg-red-50 border-red-200 text-red-700'
      : tone === 'warning'
        ? 'bg-amber-50 border-amber-200 text-amber-700'
        : tone === 'success'
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
          : 'bg-white border-[#d6deeb] text-[#0b2a6f]';

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneClass}`}>
      <p className="text-[10px] uppercase tracking-wider font-black opacity-80">{label}</p>
      <p className="text-3xl font-black leading-tight mt-1">{value}</p>
      <p className="text-[11px] font-semibold opacity-75 mt-1">{helper}</p>
    </div>
  );
}

const formatTime = (value?: string) => {
  const raw = String(value || '').trim();
  if (!raw) return 'TBD';
  if (/\b(AM|PM)\b/i.test(raw)) return raw;
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return raw;
  const date = new Date(`1970-01-01T${match[1].padStart(2, '0')}:${match[2]}:00`);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
};

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export function AppointmentCalendar({
  appointments,
  residents,
  getDoctorNameDisplay,
  onAppointmentClick,
}: AppointmentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  const intelligence = useMemo(() => buildAppointmentIntelligence(appointments), [appointments]);

  const goToPrevious = () => {
    if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNext = () => {
    if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const goToToday = () => setCurrentDate(new Date());

  const days = useMemo(() => {
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
    }

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate, viewMode]);

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();

    appointments.forEach((apt) => {
      if (!apt.date) return;
      const dateParts = apt.date.split('-');
      if (dateParts.length !== 3) return;
      const d = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
      if (Number.isNaN(d.getTime())) return;
      const dateStr = format(d, 'yyyy-MM-dd');
      const existing = map.get(dateStr) || [];
      existing.push(apt);
      map.set(dateStr, existing);
    });

    map.forEach((list) => {
      list.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    });

    return map;
  }, [appointments]);

  const getHeaderLabel = () => {
    if (viewMode === 'week') {
      const start = days[0];
      const end = days[6];
      if (start.getMonth() === end.getMonth()) return format(start, 'MMMM yyyy');
      if (start.getFullYear() === end.getFullYear()) return `${format(start, 'MMM')} - ${format(end, 'MMM yyyy')}`;
      return `${format(start, 'MMM yyyy')} - ${format(end, 'MMM yyyy')}`;
    }
    return format(currentDate, 'MMMM yyyy');
  };

  const getPrintDays = (mode: 'week' | 'month') => {
    if (mode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
    }
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    return eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn: 0 }),
      end: endOfWeek(monthEnd, { weekStartsOn: 0 }),
    });
  };

  const handlePrintCalendar = (mode: 'week' | 'month') => {
    const printDays = getPrintDays(mode);
    const title = mode === 'week'
      ? `Weekly Appointment Calendar: ${format(printDays[0], 'MMM d')} - ${format(printDays[6], 'MMM d, yyyy')}`
      : `Monthly Appointment Calendar: ${format(currentDate, 'MMMM yyyy')}`;

    const dayColumns = printDays.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayAppts = appointmentsByDay.get(dateStr) || [];
      const rows = dayAppts.length
        ? dayAppts.map((apt) => {
            const ready = isTransportReady(apt);
            return `<div class="visit ${ready ? 'ready' : 'not-ready'}">
              <div class="visit-time">${escapeHtml(formatTime(apt.time))}</div>
              <div class="visit-name">${escapeHtml(apt.residentName)}</div>
              <div>${escapeHtml(apt.type || apt.description || 'Visit')}</div>
              <div>${escapeHtml(getDoctorNameDisplay(apt))}</div>
              <div>${escapeHtml([apt.transportCompanyOther || apt.transportCompany, apt.transportCompanyPhone].filter(Boolean).join(' / '))}</div>
            </div>`;
          }).join('')
        : '<div class="empty">No appointments</div>';

      return `<div class="day-cell">
        <div class="day-head">
          <span>${escapeHtml(format(day, 'EEE'))}</span>
          <strong>${escapeHtml(format(day, 'MMM d'))}</strong>
          <em>${dayAppts.length}</em>
        </div>
        <div class="day-body">${rows}</div>
      </div>`;
    }).join('');

    const win = window.open('', '_blank');
    if (!win) return;

    win.document.open();
    win.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
@page { size: landscape; margin: 0.35in; }
* { box-sizing: border-box; }
body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; margin: 0; background: #fff; }
.header { border-bottom: 3px solid #0b2a6f; padding-bottom: 10px; margin-bottom: 12px; display: flex; justify-content: space-between; gap: 20px; }
.header h1 { margin: 0; font-size: 18px; color: #0b2a6f; }
.header p { margin: 4px 0 0; font-size: 11px; color: #475569; font-weight: 700; }
.summary { font-size: 11px; text-align: right; color: #475569; font-weight: 700; }
.calendar { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
.day-cell { border: 1px solid #cbd5e1; border-radius: 10px; min-height: ${mode === 'week' ? '6.4in' : '1.42in'}; overflow: hidden; break-inside: avoid; background: #fff; }
.day-head { background: #f1f5f9; border-bottom: 1px solid #cbd5e1; padding: 5px 6px; display: flex; align-items: center; gap: 5px; font-size: 10px; }
.day-head span { color: #64748b; font-weight: 900; text-transform: uppercase; }
.day-head strong { color: #0b2a6f; font-size: 11px; }
.day-head em { margin-left: auto; background: #0b2a6f; color: #fff; border-radius: 999px; min-width: 18px; text-align: center; font-style: normal; padding: 2px 4px; font-size: 9px; font-weight: 900; }
.day-body { padding: 5px; display: grid; gap: 4px; }
.visit { border: 1px solid #dbe3ef; border-left: 4px solid #0b2a6f; border-radius: 8px; padding: 4px 5px; font-size: ${mode === 'week' ? '9px' : '7px'}; line-height: 1.18; background: #fff; }
.visit.not-ready { border-left-color: #d97706; background: #fffbeb; }
.visit.ready { border-left-color: #059669; }
.visit-time { font-weight: 900; color: #0b2a6f; margin-bottom: 1px; }
.visit-name { font-weight: 900; color: #111827; }
.empty { color: #94a3b8; font-style: italic; font-size: 9px; padding: 6px; }
.footer { position: fixed; bottom: 0.08in; left: 0.35in; right: 0.35in; display: flex; justify-content: space-between; color: #64748b; font-size: 8px; border-top: 1px solid #cbd5e1; padding-top: 4px; }
@media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${escapeHtml(title)}</h1>
      <p>Generated: ${escapeHtml(new Date().toLocaleString())}</p>
    </div>
    <div class="summary">Total Appointments: ${appointments.length}<br/>Printed View: ${mode.toUpperCase()}</div>
  </div>
  <div class="calendar">${dayColumns}</div>
  <div class="footer"><span>CONFIDENTIAL MEDICAL RECORD / APPOINTMENT COORDINATION</span><span>Calendar print layout</span></div>
</body>
</html>`);
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <IntelligenceCard label="Today" value={intelligence.today.length} helper="Open visits today" />
        <IntelligenceCard label="Tomorrow" value={intelligence.tomorrow.length} helper="Upcoming next-day visits" tone="success" />
        <IntelligenceCard label="Overdue" value={intelligence.overdue.length} helper="Past date and not closed" tone="danger" />
        <IntelligenceCard label="Transport Not Ready" value={intelligence.transportNotReady.length} helper="Missing logistics fields" tone="warning" />
      </div>

      {intelligence.overdue.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-red-800 font-black text-sm">
            <AlertTriangle size={16} /> Overdue / Missed Appointment Review
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {intelligence.overdue.slice(0, 6).map((apt) => (
              <button
                key={apt.id}
                type="button"
                onClick={() => onAppointmentClick(apt)}
                className="text-left rounded-xl bg-white border border-red-100 p-3 hover:border-red-300 transition-colors"
              >
                <p className="text-sm font-black text-slate-800">{apt.residentName}</p>
                <p className="text-xs text-slate-500 font-semibold mt-1">{apt.date || 'No date'} • {formatTime(apt.time)} • {apt.type || 'Visit'}</p>
                <p className="text-[10px] text-red-700 font-black uppercase tracking-wider mt-2">
                  {isMissedAppointment(apt) ? 'Missed' : 'Overdue'}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#d6deeb] shadow-[0_6px_16px_rgba(11,42,111,.10)] overflow-hidden flex flex-col h-full bg-slate-50/50">
        <div className="px-5 py-4 border-b border-[#d6deeb] bg-[rgba(11,42,111,.03)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-[#d6deeb] flex items-center justify-center text-brand">
              <CalendarIcon size={20} />
            </div>
            <div>
              <h3 className="font-black text-slate-800 tracking-tight text-lg">Calendar View</h3>
              <p className="text-sm text-slate-500 font-medium">{getHeaderLabel()}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex bg-white rounded-xl border border-[#d6deeb] p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'week' ? 'bg-[rgba(11,42,111,.06)] text-brand' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Week
              </button>
              <button
                type="button"
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'month' ? 'bg-[rgba(11,42,111,.06)] text-brand' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Month
              </button>
            </div>

            <div className="flex items-center gap-1 bg-white rounded-xl border border-[#d6deeb] p-1 shadow-sm">
              <button type="button" onClick={goToPrevious} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
                <ChevronLeft size={18} />
              </button>
              <button type="button" onClick={goToToday} className="px-3 py-1.5 hover:bg-slate-100 rounded-lg transition-colors text-xs font-bold text-slate-600">
                Today
              </button>
              <button type="button" onClick={goToNext} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="flex items-center gap-1 bg-white rounded-xl border border-[#d6deeb] p-1 shadow-sm">
              <button type="button" onClick={() => handlePrintCalendar('week')} className="inline-flex items-center gap-1 px-3 py-1.5 hover:bg-slate-100 rounded-lg transition-colors text-xs font-bold text-slate-600">
                <Printer size={14} /> Print Week
              </button>
              <button type="button" onClick={() => handlePrintCalendar('month')} className="inline-flex items-center gap-1 px-3 py-1.5 hover:bg-slate-100 rounded-lg transition-colors text-xs font-bold text-slate-600">
                <Printer size={14} /> Print Month
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          <div className="min-w-[800px] h-full flex flex-col p-4">
            <div className="grid grid-cols-7 gap-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                  {day}
                </div>
              ))}

              {days.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayAppts = appointmentsByDay.get(dateStr) || [];
                const today = isToday(day);
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();

                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[140px] flex flex-col rounded-2xl border ${today ? 'border-brand/30 bg-brand/5 shadow-sm' : 'border-[#d6deeb] bg-white'} ${!isCurrentMonth && viewMode === 'month' ? 'opacity-50 bg-slate-50' : ''} overflow-hidden`}
                  >
                    <div className={`px-3 py-2 border-b border-[#d6deeb]/50 flex justify-between items-center ${today ? 'bg-brand/10' : 'bg-slate-50/50'}`}>
                      <span className={`text-sm font-black ${today ? 'text-brand' : 'text-slate-600'}`}>{format(day, 'd')}</span>
                      {dayAppts.length > 0 && (
                        <span className="text-[10px] font-bold bg-white border border-[#d6deeb] px-1.5 py-0.5 rounded-full text-slate-500">
                          {dayAppts.length}
                        </span>
                      )}
                    </div>

                    <div className="p-2 space-y-2 flex-grow overflow-y-auto custom-scrollbar max-h-[300px]">
                      <AnimatePresence>
                        {dayAppts.map((apt) => {
                          const overdue = isOverdueAppointment(apt);
                          const missed = isMissedAppointment(apt);
                          const ready = isTransportReady(apt);
                          const readinessIssues = getTransportReadinessIssues(apt);

                          return (
                            <motion.button
                              layout
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              key={apt.id}
                              type="button"
                              onClick={() => onAppointmentClick(apt)}
                              className={`w-full text-left bg-white border transition-all rounded-xl p-2.5 group relative hover:shadow-md ${overdue ? 'border-red-200 bg-red-50/70' : ready ? 'border-[#e2e8f0] hover:border-brand/40' : 'border-amber-200 bg-amber-50/60'}`}
                            >
                              <div className="flex items-center gap-1.5 mb-1.5 text-brand">
                                <Clock size={12} className="opacity-70" />
                                <span className="text-[10px] font-black">{formatTime(apt.time)}</span>
                              </div>

                              <div className="font-bold text-slate-800 text-xs mb-0.5 line-clamp-1 group-hover:text-brand transition-colors">
                                {apt.residentName}
                              </div>

                              <div className="flex items-center gap-1 text-slate-500 mb-1 text-[10px]">
                                <Stethoscope size={10} className="shrink-0" />
                                <span className="line-clamp-1">{getDoctorNameDisplay(apt)}</span>
                              </div>

                              <div className="flex items-center gap-1 text-slate-500 text-[10px]">
                                <MapPin size={10} className="shrink-0" />
                                <span className="line-clamp-1">{apt.type || apt.description || 'Visit'}</span>
                              </div>

                              <div className="mt-2 flex flex-wrap gap-1">
                                {overdue && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
                                    <AlertTriangle size={9} /> {missed ? 'Missed' : 'Overdue'}
                                  </span>
                                )}
                                {!ready && (
                                  <span title={readinessIssues.map((issue) => issue.label).join(', ')} className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
                                    <AlertTriangle size={9} /> Not Ready
                                  </span>
                                )}
                                {ready && !overdue && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
                                    <CheckCircle2 size={9} /> Ready
                                  </span>
                                )}
                              </div>

                              <div
                                className={`absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full ${
                                  apt.status === 'Completed'
                                    ? 'bg-emerald-500'
                                    : apt.status === 'Cancelled'
                                      ? 'bg-red-500'
                                      : apt.status === 'Pending'
                                        ? 'bg-amber-500'
                                        : 'bg-brand-2'
                                }`}
                              />
                            </motion.button>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
