import React, { useMemo, useState } from 'react';
import { Filter, Calendar, RotateCcw } from 'lucide-react';
import { Appointment } from '../types';
import { SpecialtyTrendsPanel } from './SpecialtyTrendsPanel';

type TrendsDateMode = 'all' | 'next7days' | 'month' | 'custom';

type TrendsTabContentProps = {
  appointments: Appointment[];
};

function toLocalDateInput(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getNextSevenDaysRange() {
  const start = new Date();
  const end = new Date();
  end.setDate(start.getDate() + 7);
  return {
    startDate: toLocalDateInput(start),
    endDate: toLocalDateInput(end),
  };
}

export function TrendsTabContent({ appointments }: TrendsTabContentProps) {
  const [dateMode, setDateMode] = useState<TrendsDateMode>('all');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [status, setStatus] = useState('All');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const trendFilters = useMemo(() => {
    if (dateMode === 'next7days') {
      return { ...getNextSevenDaysRange(), status };
    }

    if (dateMode === 'month' && month) {
      return {
        startDate: `${month}-01`,
        endDate: `${month}-31`,
        status,
      };
    }

    if (dateMode === 'custom') {
      return {
        startDate: customStartDate || undefined,
        endDate: customEndDate || undefined,
        status,
      };
    }

    return { status };
  }, [dateMode, month, status, customStartDate, customEndDate]);

  const resetFilters = () => {
    setDateMode('all');
    setMonth(new Date().toISOString().slice(0, 7));
    setStatus('All');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  return (
    <div className="space-y-6">
      <div className="transport-card p-5">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-black uppercase tracking-wider mb-3">
              <Filter size={14} /> Utilization Filters
            </div>
            <h2 className="text-2xl font-black text-slate-900">Specialty Utilization Review</h2>
            <p className="text-sm text-slate-500 mt-1">
              Review high appointment utilization by specialty, status, and date range.
            </p>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw size={16} /> Reset
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5">
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-black">Date View</span>
            <select
              value={dateMode}
              onChange={(event) => setDateMode(event.target.value as TrendsDateMode)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All Dates</option>
              <option value="next7days">Next 7 Days</option>
              <option value="month">Selected Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-black">Status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="All">All</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Pending">Pending</option>
              <option value="Hospitalized">Hospitalized</option>
            </select>
          </label>

          {dateMode === 'month' && (
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-black">Month</span>
              <input
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          )}

          {dateMode === 'custom' && (
            <>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-wider text-slate-500 font-black">Start Date</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(event) => setCustomStartDate(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-wider text-slate-500 font-black">End Date</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(event) => setCustomEndDate(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
            </>
          )}

          {dateMode !== 'month' && dateMode !== 'custom' && (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 flex items-center gap-3">
              <Calendar size={18} />
              <span>{dateMode === 'all' ? 'All appointment dates are included.' : 'Upcoming 7-day utilization window.'}</span>
            </div>
          )}
        </div>
      </div>

      <SpecialtyTrendsPanel appointments={appointments} filters={trendFilters} />
    </div>
  );
}
