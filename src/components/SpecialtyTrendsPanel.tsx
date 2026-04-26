import React from 'react';
import { BarChart3, TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import { Appointment } from '../types';
import { buildSpecialtyTrends, SpecialtyTrendFilters } from '../services/specialtyTrendsService';

export type SpecialtyTrendsPanelProps = {
  appointments: Appointment[];
  filters?: SpecialtyTrendFilters;
};

export function SpecialtyTrendsPanel({ appointments, filters = {} }: SpecialtyTrendsPanelProps) {
  const trends = buildSpecialtyTrends(appointments, filters);
  const maxCount = trends.specialtyRows[0]?.count || 1;
  const highUtilizationRows = trends.specialtyRows.filter((row) => row.count >= Math.max(2, maxCount * 0.5));
  const topFive = trends.specialtyRows.slice(0, 5);
  const latestMonths = Array.from(new Set(trends.monthlyRows.map((row) => row.month))).slice(-6);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="transport-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 font-black">Total Reviewed</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{trends.totalIncluded}</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <BarChart3 size={22} />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">Appointments included in specialty utilization review.</p>
        </div>

        <div className="transport-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 font-black">Highest Utilization</p>
              <p className="text-xl font-black text-slate-900 mt-1 truncate">{trends.topSpecialty?.specialty || 'No data'}</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp size={22} />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            {trends.topSpecialty ? `${trends.topSpecialty.count} visits (${trends.topSpecialty.percentage}%)` : 'Add appointments with specialty to review trends.'}
          </p>
        </div>

        <div className="transport-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 font-black">High-Use Areas</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{highUtilizationRows.length}</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Activity size={22} />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">Specialties at or above 50% of the top specialty volume.</p>
        </div>

        <div className="transport-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 font-black">Data Gaps</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{trends.excludedMissingDate + trends.excludedMissingSpecialty}</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <AlertTriangle size={22} />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">Missing date or specialty fields excluded from trends.</p>
        </div>
      </div>

      {(trends.excludedMissingDate > 0 || trends.excludedMissingSpecialty > 0) && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="font-black flex items-center gap-2"><AlertTriangle size={18} /> Specialty Trends data-quality warning</div>
          <div className="mt-1">
            {trends.excludedMissingSpecialty} appointment(s) missing specialty and {trends.excludedMissingDate} appointment(s) missing valid date were excluded from utilization review.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="transport-card p-6 xl:col-span-2">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h3 className="text-lg font-black text-slate-900">Specialty Utilization Ranking</h3>
              <p className="text-sm text-slate-500">Review which specialties have the highest appointment volume.</p>
            </div>
            <span className="rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-black uppercase tracking-wider">
              High utilization review
            </span>
          </div>

          {trends.specialtyRows.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              No specialty utilization data available yet.
            </div>
          ) : (
            <div className="space-y-4">
              {trends.specialtyRows.map((row, index) => {
                const width = Math.max(4, Math.round((row.count / maxCount) * 100));
                const isHighUse = highUtilizationRows.some((item) => item.specialty === row.specialty);
                return (
                  <div key={row.specialty} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-400">#{index + 1}</span>
                          <p className="font-black text-slate-900 truncate">{row.specialty}</p>
                          {isHighUse && <span className="rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-[10px] font-black uppercase">High use</span>}
                        </div>
                        <p className="text-xs text-slate-500">{row.percentage}% of reviewed appointments</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-slate-900">{row.count}</p>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-black">visits</p>
                      </div>
                    </div>
                    <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="transport-card p-6">
          <h3 className="text-lg font-black text-slate-900">Top 5 Specialties</h3>
          <p className="text-sm text-slate-500 mb-5">Quick view for leadership follow-up.</p>

          {topFive.length === 0 ? (
            <div className="text-sm text-slate-500">No data available.</div>
          ) : (
            <div className="space-y-3">
              {topFive.map((row) => (
                <div key={row.specialty} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
                  <div className="min-w-0">
                    <p className="font-black text-slate-800 truncate">{row.specialty}</p>
                    <p className="text-xs text-slate-500">{row.percentage}% utilization share</p>
                  </div>
                  <span className="text-lg font-black text-slate-900">{row.count}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 rounded-3xl bg-slate-900 p-4 text-white">
            <p className="text-xs uppercase tracking-wider text-white/60 font-black">Interpretation</p>
            <p className="mt-2 text-sm leading-relaxed">
              High specialty volume may indicate increased resident need, referral workflow patterns, provider access issues, or opportunities for in-house service review.
            </p>
          </div>
        </div>
      </div>

      <div className="transport-card p-6">
        <h3 className="text-lg font-black text-slate-900">Monthly Specialty Movement</h3>
        <p className="text-sm text-slate-500 mb-5">Shows the most recent monthly utilization by specialty.</p>

        {latestMonths.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
            No monthly movement data available.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <th className="py-3 pr-4">Month</th>
                  <th className="py-3 pr-4">Specialty</th>
                  <th className="py-3 text-right">Visits</th>
                </tr>
              </thead>
              <tbody>
                {trends.monthlyRows
                  .filter((row) => latestMonths.includes(row.month))
                  .slice(0, 30)
                  .map((row) => (
                    <tr key={`${row.month}-${row.specialty}`} className="border-b border-slate-50">
                      <td className="py-3 pr-4 font-black text-slate-700">{row.month}</td>
                      <td className="py-3 pr-4 text-slate-700">{row.specialty}</td>
                      <td className="py-3 text-right font-black text-slate-900">{row.count}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
