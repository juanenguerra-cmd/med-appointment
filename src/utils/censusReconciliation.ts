import { Resident } from '../types';
import { normalizeResident, normalizeResidentKey } from './dataValidation';

export type ResidentCensusStatus = 'Active' | 'Discharged';

export type CensusReconciliationSummary = {
  batchId: string;
  censusStamp: string;
  totalIncoming: number;
  totalExisting: number;
  activeAfterImport: number;
  dischargedAfterImport: number;
  created: number;
  reactivated: number;
  updated: number;
  discharged: number;
  unchanged: number;
};

export type CensusReconciliationResult = {
  residents: Resident[];
  created: Resident[];
  updated: Resident[];
  reactivated: Resident[];
  discharged: Resident[];
  unchanged: Resident[];
  summary: CensusReconciliationSummary;
};

const safeString = (value: unknown): string => String(value ?? '').trim();

const normalizeStatus = (status: unknown): ResidentCensusStatus => {
  const text = safeString(status).toLowerCase();
  if (text === 'discharged' || text === 'inactive') return 'Discharged';
  return 'Active';
};

const buildBatchId = () => `census-${new Date().toISOString()}-${crypto.randomUUID()}`;

const isSameResidentRecord = (a: Partial<Resident>, b: Partial<Resident>) => {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
};

export function reconcileCensusResidents({
  existingResidents,
  incomingResidents,
  facilityId,
  censusStamp = new Date().toISOString(),
  batchId = buildBatchId(),
}: {
  existingResidents: Resident[];
  incomingResidents: Omit<Resident, 'id' | 'facilityId'>[];
  facilityId: string;
  censusStamp?: string;
  batchId?: string;
}): CensusReconciliationResult {
  const existingMap = new Map<string, Resident>();
  const incomingMap = new Map<string, Omit<Resident, 'id' | 'facilityId'>>();

  existingResidents.forEach((resident) => {
    const key = normalizeResidentKey(resident);
    if (key) existingMap.set(key, resident);
  });

  incomingResidents.forEach((resident) => {
    const key = normalizeResidentKey(resident);
    if (key) incomingMap.set(key, resident);
  });

  const created: Resident[] = [];
  const updated: Resident[] = [];
  const reactivated: Resident[] = [];
  const discharged: Resident[] = [];
  const unchanged: Resident[] = [];
  const finalResidents: Resident[] = [];

  incomingMap.forEach((incoming, key) => {
    const existing = existingMap.get(key);

    if (!existing) {
      const newResident = normalizeResident({
        ...incoming,
        id: crypto.randomUUID(),
        facilityId,
        status: 'Active',
        dischargedAt: undefined,
        lastSeenCensusAt: censusStamp,
        dischargeBatchId: undefined,
      }) as Resident;
      created.push(newResident);
      finalResidents.push(newResident);
      return;
    }

    const wasDischarged = normalizeStatus((existing as any).status) === 'Discharged';
    const merged = normalizeResident({
      ...existing,
      ...incoming,
      id: existing.id,
      facilityId: existing.facilityId || facilityId,
      notes: existing.notes || incoming.notes,
      lastVisit: existing.lastVisit || incoming.lastVisit,
      status: 'Active',
      dischargedAt: undefined,
      lastSeenCensusAt: censusStamp,
      dischargeBatchId: undefined,
    }) as Resident;

    if (wasDischarged) {
      reactivated.push(merged);
    } else if (isSameResidentRecord(existing, merged)) {
      unchanged.push(merged);
    } else {
      updated.push(merged);
    }

    finalResidents.push(merged);
  });

  existingMap.forEach((existing, key) => {
    if (incomingMap.has(key)) return;

    const alreadyDischarged = normalizeStatus((existing as any).status) === 'Discharged';
    const nextResident = normalizeResident({
      ...existing,
      status: 'Discharged',
      dischargedAt: (existing as any).dischargedAt || censusStamp,
      dischargeBatchId: (existing as any).dischargeBatchId || batchId,
    }) as Resident;

    if (alreadyDischarged) {
      unchanged.push(nextResident);
    } else {
      discharged.push(nextResident);
    }

    // Keep discharged residents in app memory so profile and reports can still open them.
    finalResidents.push(nextResident);
  });

  const activeAfterImport = finalResidents.filter((resident) => normalizeStatus((resident as any).status) === 'Active').length;
  const dischargedAfterImport = finalResidents.filter((resident) => normalizeStatus((resident as any).status) === 'Discharged').length;

  return {
    residents: finalResidents,
    created,
    updated,
    reactivated,
    discharged,
    unchanged,
    summary: {
      batchId,
      censusStamp,
      totalIncoming: incomingMap.size,
      totalExisting: existingMap.size,
      activeAfterImport,
      dischargedAfterImport,
      created: created.length,
      reactivated: reactivated.length,
      updated: updated.length,
      discharged: discharged.length,
      unchanged: unchanged.length,
    },
  };
}
