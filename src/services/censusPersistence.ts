import type { Resident } from '../types';
import { apiFetch } from '../api/apiClient';
import { buildDemographicResidentPatch } from './residentDataHelpers';

type CensusReconciliation = {
  created: Resident[];
  discharged: Resident[];
  reactivated: Resident[];
  updated: Resident[];
  summary: {
    batchId: string;
    [key: string]: any;
  };
};

type PersistCensusReconciliationArgs = {
  reconciliation: CensusReconciliation;
  currentResidents: Resident[];
};

export async function persistCensusReconciliation({
  reconciliation,
  currentResidents,
}: PersistCensusReconciliationArgs) {
  for (const res of reconciliation.created) {
    await apiFetch('/api/residents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(res),
    });
  }

  for (const res of reconciliation.discharged) {
    await apiFetch(`/api/residents/${res.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'Discharged',
        dischargedAt: (res as any).dischargedAt || new Date().toISOString(),
        lastSeenCensusAt: (res as any).lastSeenCensusAt || new Date().toISOString(),
        dischargeBatchId: (res as any).dischargeBatchId || reconciliation.summary.batchId,
      }),
    });
  }

  for (const res of reconciliation.reactivated) {
    await apiFetch(`/api/residents/${res.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'Active',
        dischargedAt: '',
        dischargeBatchId: '',
        lastSeenCensusAt: (res as any).lastSeenCensusAt || new Date().toISOString(),
      }),
    });
  }

  for (const res of reconciliation.updated) {
    const existing = currentResidents.find((resident) => resident.id === res.id);
    if (!existing) continue;
    const changes = buildDemographicResidentPatch(existing, res);
    if (Object.keys(changes).length === 0) continue;

    await apiFetch(`/api/residents/${res.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    });
  }
}
