import React from 'react';
import { Truck, AlertTriangle } from 'lucide-react';
import { Appointment } from '../types';
import { buildTransportUtilization } from '../services/transportUtilizationService';
import { SpecialtyTrendFilters } from '../services/specialtyTrendsService';

type Props = {
  appointments: Appointment[];
  filters?: SpecialtyTrendFilters;
};

export function TransportUtilizationPanel({ appointments, filters = {} }: Props) {
  const data = buildTransportUtilization(appointments, filters);

  const renderList = (title: string, rows: any[]) => (
    <div className="transport-card p-5">
      <h3 className="text-lg font-black text-slate-900 mb-4">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">No data</p>
      ) : (
        <div className="space-y-3">
          {rows.slice(0, 6).map((row) => (
            <div key={row.label} className="flex justify-between">
              <span className="text-sm text-slate-700">{row.label}</span>
              <span className="font-black">{row.count} ({row.percentage}%)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="transport-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-slate-500 font-black">Total Reviewed</p>
              <p className="text-3xl font-black">{data.totalIncluded}</p>
            </div>
            <Truck />
          </div>
        </div>

        <div className="transport-card p-5">
          <p className="text-xs uppercase text-slate-500 font-black">Top Transport Type</p>
          <p className="text-xl font-black mt-2">{data.topTransportType?.label || 'N/A'}</p>
        </div>

        <div className="transport-card p-5">
          <p className="text-xs uppercase text-slate-500 font-black">Top Vendor</p>
          <p className="text-xl font-black mt-2">{data.topTransportCompany?.label || 'N/A'}</p>
        </div>
      </div>

      {(data.missingTransportType > 0 || data.missingTransportCompany > 0 || data.missingPayer > 0) && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-sm">
          <div className="flex items-center gap-2 font-black">
            <AlertTriangle size={16} /> Missing Data Warning
          </div>
          <p className="mt-1">
            Missing Type: {data.missingTransportType} | Missing Company: {data.missingTransportCompany} | Missing Payer: {data.missingPayer}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderList('Transport Types', data.transportTypeRows)}
        {renderList('Transport Companies', data.transportCompanyRows)}
        {renderList('Payers', data.payerRows)}
        {renderList('Escort Needs', data.escortRows)}
        {renderList('Mobility Needs', data.mobilityRows)}
      </div>
    </div>
  );
}
