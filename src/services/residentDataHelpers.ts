import type { Resident } from '../types';
import { normalizeResidentKey, safeString } from '../utils/dataValidation';

const safeJson = (value: unknown): string => JSON.stringify(value ?? null);

export const recordsEqual = (a: unknown, b: unknown): boolean => safeJson(a) === safeJson(b);

export const pickChangedFields = <T extends Record<string, any>>(current: T, next: T): Partial<T> => {
  const changes: Partial<T> = {};
  Object.keys(next).forEach((key) => {
    if (!recordsEqual(current?.[key], next[key])) {
      changes[key as keyof T] = next[key];
    }
  });
  return changes;
};

export const normalizeResidentStatus = (status: unknown): 'Active' | 'Discharged' => {
  const text = safeString(status).trim().toLowerCase();
  if (text === 'discharged' || text === 'inactive') return 'Discharged';
  return 'Active';
};

const setPreferredResident = <T extends Partial<Resident>>(seen: Map<string, T>, key: string, existing: T, resident: T) => {
  const existingStatus = normalizeResidentStatus((existing as any).status);
  const incomingStatus = normalizeResidentStatus((resident as any).status);
  const preferredStatus = existingStatus === 'Discharged' || incomingStatus === 'Discharged' ? 'Discharged' : 'Active';

  seen.set(key, {
    ...existing,
    ...resident,
    id: (existing as any).id || (resident as any).id,
    facilityId: (existing as any).facilityId || (resident as any).facilityId,
    notes: (existing as any).notes || (resident as any).notes,
    lastVisit: (existing as any).lastVisit || (resident as any).lastVisit,
    status: preferredStatus,
    dischargedAt: (existing as any).dischargedAt || (resident as any).dischargedAt,
    lastSeenCensusAt: (resident as any).lastSeenCensusAt || (existing as any).lastSeenCensusAt,
    dischargeBatchId: (existing as any).dischargeBatchId || (resident as any).dischargeBatchId,
  });
};

export const dedupeResidents = <T extends Partial<Resident>>(residentList: T[]) => {
  const seen = new Map<string, T>();

  residentList.forEach((resident) => {
    const key = normalizeResidentKey(resident);
    if (!key || key === 'name-room:|') return;

    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, resident);
      return;
    }

    setPreferredResident(seen, key, existing, resident);
  });

  return Array.from(seen.values());
};

export const buildDemographicResidentPatch = (existing: Resident, next: Resident) => {
  const patch: Partial<Resident> = {};
  const fields: Array<keyof Resident> = [
    'name',
    'mrn',
    'lastName',
    'firstName',
    'age',
    'floor',
    'unit',
    'roomNumber',
    'sex',
    'admissionDate',
    'allergies',
    'doctor',
    'diagnosis',
    'notes',
    'lastVisit',
  ];

  fields.forEach((field) => {
    if (!recordsEqual((existing as any)[field], (next as any)[field])) {
      (patch as any)[field] = (next as any)[field];
    }
  });

  return patch;
};
