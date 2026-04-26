export type AuditAction = 'create' | 'update' | 'delete' | 'import' | 'replace';
export type AuditEntity = 'facility' | 'appointment' | 'resident' | 'user' | 'census';

export type AuditEvent = {
  id: string;
  timestamp: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  facilityId?: string;
  actorId?: string;
  actorRole?: string;
  summary: string;
  changedFields?: string[];
  counts?: Record<string, number>;
};

type AuditActor = {
  id?: string;
  role?: string;
};

const AUDIT_KEY = 'med_appointment_audit_log_v1';
const MAX_LOCAL_EVENTS = 200;

const safeString = (value: unknown): string => {
  if (value === undefined || value === null) return '';
  return String(value);
};

const makeAuditId = () => `AUD-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export function createAuditEvent(params: {
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  facilityId?: string;
  actor?: AuditActor | null;
  summary: string;
  changedFields?: string[];
  counts?: Record<string, number>;
}): AuditEvent {
  return {
    id: makeAuditId(),
    timestamp: new Date().toISOString(),
    action: params.action,
    entity: params.entity,
    entityId: safeString(params.entityId) || undefined,
    facilityId: safeString(params.facilityId) || undefined,
    actorId: safeString(params.actor?.id) || undefined,
    actorRole: safeString(params.actor?.role) || undefined,
    summary: safeString(params.summary),
    changedFields: params.changedFields?.filter(Boolean).slice(0, 50),
    counts: params.counts,
  };
}

export function appendLocalAuditEvent(event: AuditEvent) {
  try {
    const existing = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
    const current = Array.isArray(existing) ? existing : [];
    const next = [...current.slice(-(MAX_LOCAL_EVENTS - 1)), event];
    localStorage.setItem(AUDIT_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn('Audit log was not written locally.', error);
  }
}

export function getLocalAuditEvents(): AuditEvent[] {
  try {
    const existing = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
    return Array.isArray(existing) ? existing : [];
  } catch {
    return [];
  }
}

export function clearLocalAuditEvents() {
  localStorage.removeItem(AUDIT_KEY);
}
