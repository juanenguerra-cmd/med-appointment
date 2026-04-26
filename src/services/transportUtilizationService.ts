import { Appointment } from '../types';
import { SpecialtyTrendFilters } from './specialtyTrendsService';

export type TransportUtilizationRow = {
  label: string;
  count: number;
  percentage: number;
};

export type TransportUtilizationSummary = {
  totalIncluded: number;
  transportTypeRows: TransportUtilizationRow[];
  transportCompanyRows: TransportUtilizationRow[];
  payerRows: TransportUtilizationRow[];
  escortRows: TransportUtilizationRow[];
  mobilityRows: TransportUtilizationRow[];
  missingTransportType: number;
  missingTransportCompany: number;
  missingPayer: number;
  topTransportType: TransportUtilizationRow | null;
  topTransportCompany: TransportUtilizationRow | null;
};

function isIsoDate(value?: string | null): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '').trim());
}

function percentage(count: number, total: number): number {
  if (!total) return 0;
  return Math.round((count / total) * 1000) / 10;
}

function normalizeText(value?: string | null, fallback = 'Unspecified') {
  const raw = String(value || '').trim().replace(/\s+/g, ' ');
  if (!raw) return fallback;
  return raw
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function normalizeTransportType(appointment: Appointment) {
  if (appointment.transportType === 'Others' && appointment.transportTypeOther) {
    return normalizeText(appointment.transportTypeOther);
  }
  return normalizeText(appointment.transportType);
}

function normalizePayer(appointment: Appointment) {
  if (appointment.payerForRide === 'Others' && appointment.payerForRideOther) {
    return normalizeText(appointment.payerForRideOther);
  }
  return normalizeText(appointment.payerForRide);
}

function normalizeEscort(value?: string | null) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'Unspecified';
  if (['yes', 'y', 'true', 'required'].includes(raw)) return 'Escort Required';
  if (['no', 'n', 'false', 'not required'].includes(raw)) return 'No Escort';
  return normalizeText(value);
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

function addCount(map: Map<string, number>, label: string) {
  map.set(label, (map.get(label) || 0) + 1);
}

function rowsFromMap(map: Map<string, number>, total: number): TransportUtilizationRow[] {
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count, percentage: percentage(count, total) }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function buildTransportUtilization(
  appointments: Appointment[],
  filters: SpecialtyTrendFilters = {},
): TransportUtilizationSummary {
  const included = appointments.filter((appointment) => statusMatches(appointment, filters) && dateMatches(appointment, filters));
  const totalIncluded = included.length;

  const transportTypeMap = new Map<string, number>();
  const transportCompanyMap = new Map<string, number>();
  const payerMap = new Map<string, number>();
  const escortMap = new Map<string, number>();
  const mobilityMap = new Map<string, number>();

  let missingTransportType = 0;
  let missingTransportCompany = 0;
  let missingPayer = 0;

  included.forEach((appointment) => {
    const transportType = normalizeTransportType(appointment);
    const transportCompany = normalizeText(appointment.transportCompany);
    const payer = normalizePayer(appointment);
    const escort = normalizeEscort(appointment.escort);

    if (transportType === 'Unspecified') missingTransportType += 1;
    if (transportCompany === 'Unspecified') missingTransportCompany += 1;
    if (payer === 'Unspecified') missingPayer += 1;

    addCount(transportTypeMap, transportType);
    addCount(transportCompanyMap, transportCompany);
    addCount(payerMap, payer);
    addCount(escortMap, escort);

    if (appointment.wheelchair) addCount(mobilityMap, 'Wheelchair');
    if (appointment.withLift) addCount(mobilityMap, 'Lift Required');
    if (appointment.recliner) addCount(mobilityMap, 'Recliner');
    if (appointment.bariatric) addCount(mobilityMap, 'Bariatric');
    if (appointment.oxygen) addCount(mobilityMap, 'Oxygen');
    if (appointment.ambulating) addCount(mobilityMap, 'Ambulating');
  });

  if (mobilityMap.size === 0 && totalIncluded > 0) {
    addCount(mobilityMap, 'No Mobility Flags Documented');
  }

  const transportTypeRows = rowsFromMap(transportTypeMap, totalIncluded);
  const transportCompanyRows = rowsFromMap(transportCompanyMap, totalIncluded);
  const payerRows = rowsFromMap(payerMap, totalIncluded);
  const escortRows = rowsFromMap(escortMap, totalIncluded);
  const mobilityRows = rowsFromMap(mobilityMap, totalIncluded);

  return {
    totalIncluded,
    transportTypeRows,
    transportCompanyRows,
    payerRows,
    escortRows,
    mobilityRows,
    missingTransportType,
    missingTransportCompany,
    missingPayer,
    topTransportType: transportTypeRows[0] || null,
    topTransportCompany: transportCompanyRows[0] || null,
  };
}
