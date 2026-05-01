import type { Resident } from '../types';

export type BackendCensusReconcileSummary = {
  batchId: string;
  totalIncoming: number;
  totalExisting: number;
  created: number;
  updated: number;
  reactivated: number;
  discharged: number;
  unchanged: number;
  activeAfterImport: number;
  dischargedAfterImport: number;
};

export type BackendCensusReconcileResponse = {
  success: boolean;
  residents: Resident[];
  summary: BackendCensusReconcileSummary;
};

export async function reconcileCensusOnBackend(params: {
  facilityId: string;
  residents: Omit<Resident, 'id' | 'facilityId'>[];
}): Promise<BackendCensusReconcileResponse> {
  const response = await fetch('/api/census/reconcile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    let message = `Census reconciliation failed with status ${response.status}`;
    try {
      const body = await response.json();
      message = body?.error || body?.message || JSON.stringify(body);
    } catch {
      const text = await response.text().catch(() => '');
      if (text) message = text;
    }
    throw new Error(message);
  }

  return response.json();
}
