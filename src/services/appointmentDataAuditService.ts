import { Appointment } from '../types';
import { SpecialtyTrendFilters } from './specialtyTrendsService';

export type MissingFieldIssue = {
  appointmentId: string;
  residentName: string;
  date: string;
  specialty: string;
  missingFields: string[];
};

export type MissingFieldCount = {
  field: string;
  count: number;
};

export type AppointmentDataAuditSummary = {
  totalReviewed: number;
  incompleteAppointments: number;
  completeAppointments: number;
  completionRate: number;
  missingFieldCounts: MissingFieldCount[];
  issues: MissingFieldIssue[];
};

const REQUIRED_FIELDS: Array<{ key: keyof Appointment; label: string }> = [
  { key: 'residentName', label: 'Resident Name' },
  { key: 'date', label: 'Appointment Date' },
  { key: 'time', label: 'Appointment Time' },
  { key: 'type', label: 'Specialty' },
  { key: 'providerName', label: 'Provider Name' },
  { key: 'location', label: 'Location' },
  { key: 'contactNumber', label: 'Contact Number' },
  { key: 'transportType', label: 'Transport Type' },
  { key: 'transportCompany', label: 'Transport Company' },
  { key: 'payerForRide', label: 'Payer for Ride' },
  { key: 'escort', label: 'Escort' },
];

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || String(value).trim() === '' || String(value).trim() === '—';
}

function isIsoDate(value?: string | null): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '').trim());
}

function statusMatches(appointment: Appointment, status?: string): boolean {
  if (!status || status === 'All') return true;
  return String(appointment.status ?? '').toLowerCase() === String(status ?? '').toLowerCase();
}

function dateMatches(appointment: Appointment, filters?: SpecialtyTrendFilters): boolean {
  if (!filters?.startDate && !filters?.endDate) return true;
  if (!isIsoDate(appointment.date)) return false;
  if (filters.startDate && appointment.date < filters.startDate) return false;
  if (filters.endDate && appointment.date > filters.endDate) return false;
  return true;
}

function calculateCompletionRate(total: number, complete: number): number {
  if (!total) return 100;
  return Math.round((complete / total) * 1000) / 10;
}

export function buildAppointmentDataAudit(
  appointments: Appointment[],
  filters: SpecialtyTrendFilters = {},
): AppointmentDataAuditSummary {
  const reviewed = appointments.filter(
    (appointment) => statusMatches(appointment, filters.status) && dateMatches(appointment, filters),
  );
  const fieldCountMap = new Map<string, number>();
  const issues: MissingFieldIssue[] = [];

  reviewed.forEach((appointment) => {
    const missingFields = REQUIRED_FIELDS
      .filter((field) => isBlank(appointment[field.key]))
      .map((field) => field.label);

    if (!isBlank(appointment.date) && !isIsoDate(appointment.date)) {
      missingFields.push('Valid Appointment Date');
    }

    if (missingFields.length > 0) {
      missingFields.forEach((field) => {
        fieldCountMap.set(field, (fieldCountMap.get(field) || 0) + 1);
      });

      issues.push({
        appointmentId: appointment.id,
        residentName: appointment.residentName || 'Unspecified Resident',
        date: appointment.date || 'No date',
        specialty: appointment.type || 'Unspecified Specialty',
        missingFields,
      });
    }
  });

  const incompleteAppointments = issues.length;
  const totalReviewed = reviewed.length;
  const completeAppointments = totalReviewed - incompleteAppointments;

  const missingFieldCounts = Array.from(fieldCountMap.entries())
    .map(([field, count]) => ({ field, count }))
    .sort((a, b) => b.count - a.count || a.field.localeCompare(b.field));

  return {
    totalReviewed,
    incompleteAppointments,
    completeAppointments,
    completionRate: calculateCompletionRate(totalReviewed, completeAppointments),
    missingFieldCounts,
    issues: issues.sort((a, b) => b.missingFields.length - a.missingFields.length || a.residentName.localeCompare(b.residentName)),
  };
}
