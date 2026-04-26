import { Appointment } from '../types';

export type SpecialtyTrendFilters = {
  startDate?: string;
  endDate?: string;
  status?: string;
};

export type SpecialtyTrendRow = {
  specialty: string;
  count: number;
  percentage: number;
};

export type SpecialtyMonthTrend = {
  month: string;
  specialty: string;
  count: number;
};

export type SpecialtyTrendsSummary = {
  totalIncluded: number;
  excludedMissingDate: number;
  excludedMissingSpecialty: number;
  specialtyRows: SpecialtyTrendRow[];
  topSpecialty: SpecialtyTrendRow | null;
  monthlyRows: SpecialtyMonthTrend[];
};

const SPECIALTY_ALIASES: Record<string, string> = {
  dental: 'Dental',
  dentistry: 'Dental',
  gastroenterology: 'Gastroenterology / GI',
  gi: 'Gastroenterology / GI',
  'gastroenterology / gi': 'Gastroenterology / GI',
  pmr: 'Physiatry / Physical Medicine & Rehabilitation',
  'pm&r': 'Physiatry / Physical Medicine & Rehabilitation',
  'physiatry (pm&r)': 'Physiatry / Physical Medicine & Rehabilitation',
  'physical medicine': 'Physiatry / Physical Medicine & Rehabilitation',
  'vascular surgery': 'Vascular',
  vascular: 'Vascular',
  ent: 'ENT',
};

export function normalizeSpecialtyForTrend(value?: string | null): string {
  const raw = String(value || '').trim().replace(/\s+/g, ' ');
  if (!raw) return '';

  const key = raw.toLowerCase();
  if (SPECIALTY_ALIASES[key]) return SPECIALTY_ALIASES[key];

  return raw
    .split(' ')
    .map((word) => {
      const upper = word.toUpperCase();
      if (['ENT', 'GI', 'OB/GYN'].includes(upper)) return upper;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

function isIsoDate(value?: string | null): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '').trim());
}

function percentage(count: number, total: number): number {
  if (!total) return 0;
  return Math.round((count / total) * 1000) / 10;
}

function statusMatches(appointment: Appointment, status?: string): boolean {
  if (!status || status === 'All') return true;
  return String(appointment.status || '').toLowerCase() === status.toLowerCase();
}

function dateMatches(appointment: Appointment, filters?: SpecialtyTrendFilters): boolean {
  if (!isIsoDate(appointment.date)) return false;
  if (filters?.startDate && appointment.date < filters.startDate) return false;
  if (filters?.endDate && appointment.date > filters.endDate) return false;
  return true;
}

export function buildSpecialtyTrends(
  appointments: Appointment[],
  filters: SpecialtyTrendFilters = {},
): SpecialtyTrendsSummary {
  const specialtyCounts = new Map<string, number>();
  const monthCounts = new Map<string, number>();
  let excludedMissingDate = 0;
  let excludedMissingSpecialty = 0;

  appointments.forEach((appointment) => {
    const specialty = normalizeSpecialtyForTrend(appointment.type);

    if (!specialty) {
      excludedMissingSpecialty += 1;
      return;
    }

    if (!isIsoDate(appointment.date)) {
      excludedMissingDate += 1;
      return;
    }

    if (!statusMatches(appointment, filters)) return;
    if (!dateMatches(appointment, filters)) return;

    specialtyCounts.set(specialty, (specialtyCounts.get(specialty) || 0) + 1);

    const monthKey = `${appointment.date.slice(0, 7)}|${specialty}`;
    monthCounts.set(monthKey, (monthCounts.get(monthKey) || 0) + 1);
  });

  const totalIncluded = Array.from(specialtyCounts.values()).reduce((sum, count) => sum + count, 0);

  const specialtyRows = Array.from(specialtyCounts.entries())
    .map(([specialty, count]) => ({
      specialty,
      count,
      percentage: percentage(count, totalIncluded),
    }))
    .sort((a, b) => b.count - a.count || a.specialty.localeCompare(b.specialty));

  const monthlyRows = Array.from(monthCounts.entries())
    .map(([key, count]) => {
      const [month, specialty] = key.split('|');
      return { month, specialty, count };
    })
    .sort((a, b) => a.month.localeCompare(b.month) || b.count - a.count || a.specialty.localeCompare(b.specialty));

  return {
    totalIncluded,
    excludedMissingDate,
    excludedMissingSpecialty,
    specialtyRows,
    topSpecialty: specialtyRows[0] || null,
    monthlyRows,
  };
}
