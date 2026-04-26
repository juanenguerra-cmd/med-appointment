import { Appointment } from '../types';

export type AnalyticsDateRange = {
  startDate?: string;
  endDate?: string;
};

export type SpecialtyCount = {
  specialty: string;
  count: number;
  percentage: number;
};

export type MonthlyTrendPoint = {
  month: string;
  count: number;
};

export type StatusCount = {
  status: string;
  count: number;
  percentage: number;
};

export type AnalyticsSummary = {
  totalAppointments: number;
  scheduledAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  missingSpecialtyCount: number;
  missingDateCount: number;
  specialtyCounts: SpecialtyCount[];
  monthlyTrends: MonthlyTrendPoint[];
  statusCounts: StatusCount[];
  topSpecialty: SpecialtyCount | null;
};

const SPECIALTY_ALIASES: Record<string, string> = {
  dentistry: 'Dental',
  dental: 'Dental',
  gastroenterology: 'Gastroenterology / GI',
  gi: 'Gastroenterology / GI',
  'gastroenterology / gi': 'Gastroenterology / GI',
  'physiatry (pm&r)': 'Physiatry / Physical Medicine & Rehabilitation',
  'physiatry / physical medicine & rehabilitation': 'Physiatry / Physical Medicine & Rehabilitation',
  pmr: 'Physiatry / Physical Medicine & Rehabilitation',
  'pm&r': 'Physiatry / Physical Medicine & Rehabilitation',
  'vascular surgery': 'Vascular',
  vascular: 'Vascular',
  ent: 'ENT',
  ophthalmology: 'Ophthalmology',
  optometry: 'Optometry',
};

const STATUS_ALIASES: Record<string, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  canceled: 'Cancelled',
  pending: 'Pending',
  hospitalized: 'Hospitalized',
};

function safeString(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value);
}

export function normalizeSpecialty(value?: unknown): string {
  const raw = safeString(value).trim();
  if (!raw) return 'Unspecified';

  const compact = raw.replace(/\s+/g, ' ');
  const key = compact.toLowerCase();
  if (SPECIALTY_ALIASES[key]) return SPECIALTY_ALIASES[key];

  return compact
    .split(' ')
    .map((part) => {
      const upper = part.toUpperCase();
      if (upper === 'ENT') return 'ENT';
      if (upper === 'GI') return 'GI';
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(' ');
}

export function normalizeStatus(value?: unknown): string {
  const raw = safeString(value).trim();
  if (!raw) return 'Unknown';

  const key = raw.toLowerCase();
  return STATUS_ALIASES[key] || raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function isValidIsoDate(value?: unknown): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(safeString(value).trim());
}

function isWithinRange(dateValue: unknown, range?: AnalyticsDateRange): boolean {
  const date = safeString(dateValue).trim();
  if (!isValidIsoDate(date)) return false;
  if (range?.startDate && date < range.startDate) return false;
  if (range?.endDate && date > range.endDate) return false;
  return true;
}

function countToPercent(count: number, total: number): number {
  if (!total) return 0;
  return Math.round((count / total) * 1000) / 10;
}

export function filterAppointmentsForAnalytics(
  appointments: Appointment[],
  range?: AnalyticsDateRange,
): Appointment[] {
  return appointments.filter((appointment) => isWithinRange(appointment.date, range));
}

export function buildAnalyticsSummary(
  appointments: Appointment[],
  range?: AnalyticsDateRange,
): AnalyticsSummary {
  const totalAppointments = appointments.length;
  const missingSpecialtyCount = appointments.filter((appointment) => !safeString(appointment.type).trim()).length;
  const missingDateCount = appointments.filter((appointment) => !isValidIsoDate(appointment.date)).length;
  const validAppointments = filterAppointmentsForAnalytics(appointments, range);

  const specialtyMap = new Map<string, number>();
  const monthMap = new Map<string, number>();
  const statusMap = new Map<string, number>();

  validAppointments.forEach((appointment) => {
    const specialty = normalizeSpecialty(appointment.type);
    specialtyMap.set(specialty, (specialtyMap.get(specialty) || 0) + 1);

    const date = safeString(appointment.date).trim();
    const month = date.slice(0, 7);
    monthMap.set(month, (monthMap.get(month) || 0) + 1);

    const status = normalizeStatus(appointment.status);
    statusMap.set(status, (statusMap.get(status) || 0) + 1);
  });

  const validTotal = validAppointments.length;

  const specialtyCounts = Array.from(specialtyMap.entries())
    .map(([specialty, count]) => ({
      specialty,
      count,
      percentage: countToPercent(count, validTotal),
    }))
    .sort((a, b) => b.count - a.count || a.specialty.localeCompare(b.specialty));

  const monthlyTrends = Array.from(monthMap.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const statusCounts = Array.from(statusMap.entries())
    .map(([status, count]) => ({
      status,
      count,
      percentage: countToPercent(count, validTotal),
    }))
    .sort((a, b) => b.count - a.count || a.status.localeCompare(b.status));

  const scheduledAppointments = validAppointments.filter((appointment) => normalizeStatus(appointment.status) === 'Scheduled').length;
  const completedAppointments = validAppointments.filter((appointment) => normalizeStatus(appointment.status) === 'Completed').length;
  const cancelledAppointments = validAppointments.filter((appointment) => normalizeStatus(appointment.status) === 'Cancelled').length;

  return {
    totalAppointments: validTotal || totalAppointments,
    scheduledAppointments,
    completedAppointments,
    cancelledAppointments,
    missingSpecialtyCount,
    missingDateCount,
    specialtyCounts,
    monthlyTrends,
    statusCounts,
    topSpecialty: specialtyCounts[0] || null,
  };
}

export function getTopSpecialties(
  appointments: Appointment[],
  limit = 5,
  range?: AnalyticsDateRange,
): SpecialtyCount[] {
  return buildAnalyticsSummary(appointments, range).specialtyCounts.slice(0, limit);
}

export function getMonthlyTrends(
  appointments: Appointment[],
  range?: AnalyticsDateRange,
): MonthlyTrendPoint[] {
  return buildAnalyticsSummary(appointments, range).monthlyTrends;
}
