import type { Resident } from '../types';

export type BackendCensusReconcileSummary = {
  mode: 'backend';
  batchId: string;
  rawIncoming: number;
  skippedInvalid: number;
  duplicateIncoming: number;
  totalIncoming: number;
  totalExisting: number;
  created: number;
  updated: number;
  reactivated: number;
  discharged: number;
  unchanged: number;
  statementsQueued: number;
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
      const body = (await response.json()) as { error?: string; message?: string };
      message = body?.error || body?.message || JSON.stringify(body);
    } catch {
      const text = await response.text().catch(() => '');
      if (text) message = text;
    }
    throw new Error(message);
  }

  return response.json();
}
