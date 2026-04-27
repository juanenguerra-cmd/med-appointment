import { Appointment, Resident } from '../types';
import { getResidentStatusGroup } from './residentStatus';

export type SummaryScope = 'past' | 'future' | 'all';
export type StatusScope = 'active' | 'discharged' | 'all';

export function buildAppointmentSummary(
  appointments: Appointment[],
  residents: Resident[],
  scope: SummaryScope,
  statusScope: StatusScope,
) {
  const today = new Date().toISOString().slice(0, 10);

  const rows = appointments.map((apt) => {
    const resident = residents.find((r) => r.name === apt.residentName);
    return {
      ...apt,
      residentStatus: getResidentStatusGroup(resident),
    };
  }).filter((apt) => {
    if (scope === 'past' && apt.date >= today) return false;
    if (scope === 'future' && apt.date < today) return false;

    if (statusScope === 'active' && apt.residentStatus !== 'Active') return false;
    if (statusScope === 'discharged' && apt.residentStatus !== 'Discharged') return false;

    return true;
  });

  return {
    total: rows.length,
    past: rows.filter((r) => r.date < today).length,
    future: rows.filter((r) => r.date >= today).length,
    rows,
  };
}
