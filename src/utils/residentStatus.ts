import { Resident } from '../types';

export type ResidentStatusGroup = 'Active' | 'Discharged';
export type ResidentStatusFilter = 'Active' | 'Discharged' | 'All';

const text = (value: unknown) => String(value ?? '').trim();

export function getResidentStatusGroup(resident?: Resident): ResidentStatusGroup {
  const status = text((resident as any)?.status).toLowerCase();
  if (status === 'discharged' || status === 'inactive') return 'Discharged';
  return 'Active';
}

export function isActiveResident(resident?: Resident): boolean {
  return getResidentStatusGroup(resident) === 'Active';
}

export function isDischargedResident(resident?: Resident): boolean {
  return getResidentStatusGroup(resident) === 'Discharged';
}
