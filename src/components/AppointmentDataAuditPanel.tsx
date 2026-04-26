import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Appointment } from '../types';
import { buildAppointmentDataAudit } from '../services/appointmentDataAuditService';
import { SpecialtyTrendFilters } from '../services/specialtyTrendsService';

type Props = {
  appointments: Appointment[];
  filters?: SpecialtyTrendFilters;
};

export function AppointmentDataAuditPanel({ appointments, filters = {} }: Props) {
  const audit = buildAppointmentDataAudit(appointments, filters);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="transport-card p-5">
          <p className="text-xs uppercase font-black text-slate-500">Reviewed</p>
          <p className="text-3xl font-black">{audit.totalReviewed}</p>
        </div>
        <div className="transport-card p-5">
          <p className="text-xs uppercase font-black text-slate-500">Complete</p>
          <p className="text-3xl font-black text-emerald-600">{audit.completeAppointments}</p>
        </div>
        <div className="transport-card p-5">
          <p className="text-xs uppercase font-black text-slate-500">Incomplete</p>
          <p className="text-3xl font-black text-rose-600">{audit.incompleteAppointments}</p>
        </div>
        <div className="transport-card p-5">
          <p className="text-xs uppercase font-black text-slate-500">Completion %</p>
          <p className="text-3xl font-black">{audit.completionRate}%</p>
        </div>
      </div>

      {audit.incompleteAppointments > 0 && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-sm">
          <div className="flex items-center gap-2 font-black text-rose-700">
            <AlertTriangle size={16} /> Data Quality Issues Detected
          </div>
          <p className="mt-1 text-rose-800">
            {audit.incompleteAppointments} appointment(s) have missing required fields.
          </p>
        </div>
      )}

      <div className="transport-card p-5">
        <h3 className="font-black text-slate-900 mb-3">Most Missing Fields</h3>
        {audit.missingFieldCounts.length === 0 ? (
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 size={16} /> All required fields are complete
          </div>
        ) : (
          <div className="space-y-2">
            {audit.missingFieldCounts.slice(0, 6).map((item) => (
              <div key={item.field} className="flex justify-between">
                <span>{item.field}</span>
                <span className="font-black">{item.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {audit.issues.length > 0 && (
        <div className="transport-card p-5">
          <h3 className="font-black text-slate-900 mb-3">Incomplete Appointments</h3>
          <div className="max-h-64 overflow-y-auto text-sm">
            {audit.issues.slice(0, 20).map((issue) => (
              <div key={issue.appointmentId} className="border-b py-2">
                <div className="font-semibold">{issue.residentName}</div>
                <div className="text-xs text-slate-500">{issue.date} | {issue.specialty}</div>
                <div className="text-xs text-rose-600">Missing: {issue.missingFields.join(', ')}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
