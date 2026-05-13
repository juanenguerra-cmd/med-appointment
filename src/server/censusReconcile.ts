import { hasFacilityAccess, type AuthenticatedUser } from "./sessionAuth";

const safeString = (value: unknown, fallback = ''): string => {
  if (value === undefined || value === null) return fallback;
  return String(value);
};

const toNull = (value: unknown) => (value === undefined ? null : value);

const activeStatus = (status: unknown): 'Active' | 'Discharged' => {
  const text = safeString(status).trim().toLowerCase();
  return text === 'discharged' || text === 'inactive' ? 'Discharged' : 'Active';
};

const normalizeKey = (resident: any): string => {
  const mrn = safeString(resident?.mrn).trim().toLowerCase();
  if (mrn && mrn !== '—') return `mrn:${mrn}`;
  const name = safeString(resident?.name).trim().toLowerCase();
  const room = safeString(resident?.roomNumber).trim().toLowerCase();
  return `name-room:${name}|${room}`;
};

const demographicFields = [
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
] as const;

const residentInsertFields = [
  'id',
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
  'status',
  'dischargedAt',
  'lastSeenCensusAt',
  'facilityId',
] as const;

const prepareIncomingResident = (resident: any, facilityId: string, now: string) => {
  const name = safeString(resident?.name).trim();
  const roomNumber = safeString(resident?.roomNumber).trim();
  if (!name || name === '—' || !roomNumber || roomNumber === '—') return null;

  return {
    id: safeString(resident?.id) || crypto.randomUUID(),
    name,
    mrn: safeString(resident?.mrn, '—'),
    lastName: safeString(resident?.lastName, '—'),
    firstName: safeString(resident?.firstName, '—'),
    age: safeString(resident?.age, '—'),
    floor: safeString(resident?.floor, '—'),
    unit: safeString(resident?.unit, '—'),
    roomNumber,
    sex: safeString(resident?.sex, '—'),
    admissionDate: safeString(resident?.admissionDate, '—'),
    allergies: safeString(resident?.allergies, 'No Known Allergies'),
    doctor: safeString(resident?.doctor, '—'),
    diagnosis: safeString(resident?.diagnosis, '—'),
    notes: safeString(resident?.notes, ''),
    lastVisit: safeString(resident?.lastVisit, ''),
    status: 'Active',
    dischargedAt: '',
    lastSeenCensusAt: now,
    dischargeBatchId: '',
    facilityId,
  };
};

const buildDemographicPatch = (existing: any, incoming: any) => {
  const patch: Record<string, unknown> = {};
  demographicFields.forEach((field) => {
    if (safeString(existing?.[field]) !== safeString(incoming?.[field])) {
      patch[field] = incoming[field];
    }
  });
  return patch;
};

const buildPatchStatement = (db: D1Database, id: string, patch: Record<string, unknown>) => {
  const keys = Object.keys(patch);
  if (keys.length === 0) return null;
  const setClause = keys.map((key) => `${key} = ?`).join(', ');
  const values = keys.map((key) => toNull(patch[key]));
  return db.prepare(`UPDATE residents SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(...values, id);
};

export function registerCensusReconcileRoute(app: any) {
  app.post('/census/reconcile', async (c: any) => {
    const authUser = (c as any).get('authUser') as AuthenticatedUser | undefined;
    const body = await c.req.json().catch(() => ({}));
    const facilityId = safeString(body?.facilityId).trim();
    const incomingRaw = Array.isArray(body?.residents) ? body.residents : [];

    if (!facilityId) return c.json({ success: false, error: 'facilityId is required' }, 400);
    if (!authUser || !hasFacilityAccess(authUser, facilityId)) {
      return c.json({ success: false, error: 'Facility access denied' }, 403);
    }
    if (incomingRaw.length === 0) return c.json({ success: false, error: 'At least one incoming resident is required' }, 400);

    const now = new Date().toISOString();
    const batchId = `census-${Date.now()}`;

    const existingResult = await c.env.DB.prepare('SELECT * FROM residents WHERE facilityId = ? ORDER BY name ASC').bind(facilityId).all();
    const existingResidents = (existingResult.results || []) as any[];

    let skippedInvalid = 0;
    let duplicateIncoming = 0;
    const incomingMap = new Map<string, any>();
    for (const resident of incomingRaw) {
      const prepared = prepareIncomingResident(resident, facilityId, now);
      if (!prepared) {
        skippedInvalid += 1;
        continue;
      }
      const key = normalizeKey(prepared);
      if (!key || key === 'name-room:|') {
        skippedInvalid += 1;
        continue;
      }
      if (incomingMap.has(key)) duplicateIncoming += 1;
      incomingMap.set(key, prepared);
    }

    if (incomingMap.size === 0) return c.json({ success: false, error: 'No valid residents were parsed for reconciliation' }, 400);

    const existingByKey = new Map<string, any>();
    existingResidents.forEach((resident) => {
      const key = normalizeKey(resident);
      if (key && key !== 'name-room:|') existingByKey.set(key, resident);
    });

    const statements: D1PreparedStatement[] = [];
    const summary = {
      mode: 'backend' as const,
      batchId,
      rawIncoming: incomingRaw.length,
      skippedInvalid,
      duplicateIncoming,
      totalIncoming: incomingMap.size,
      totalExisting: existingResidents.length,
      created: 0,
      updated: 0,
      reactivated: 0,
      discharged: 0,
      unchanged: 0,
      statementsQueued: 0,
      activeAfterImport: 0,
      dischargedAfterImport: 0,
    };

    incomingMap.forEach((incoming, key) => {
      const existing = existingByKey.get(key);
      if (!existing) {
        summary.created += 1;
        statements.push(
          c.env.DB.prepare(`
            INSERT INTO residents (${residentInsertFields.join(', ')})
            VALUES (${residentInsertFields.map(() => '?').join(', ')})
          `).bind(...residentInsertFields.map((field) => toNull((incoming as any)[field]))),
        );
        return;
      }

      const patch = buildDemographicPatch(existing, incoming);
      patch.lastSeenCensusAt = now;

      if (activeStatus(existing.status) === 'Discharged') {
        summary.reactivated += 1;
        patch.status = 'Active';
        patch.dischargedAt = '';
        patch.dischargeBatchId = '';
      } else if (Object.keys(patch).length > 1) {
        summary.updated += 1;
      } else {
        summary.unchanged += 1;
      }

      const stmt = buildPatchStatement(c.env.DB, existing.id, patch);
      if (stmt) statements.push(stmt);
    });

    existingResidents.forEach((existing) => {
      const key = normalizeKey(existing);
      if (incomingMap.has(key)) return;
      if (activeStatus(existing.status) !== 'Active') return;

      summary.discharged += 1;
      const patch = {
        status: 'Discharged',
        dischargedAt: safeString(existing.dischargedAt) || now,
        lastSeenCensusAt: now,
        dischargeBatchId: batchId,
      };
      const stmt = buildPatchStatement(c.env.DB, existing.id, patch);
      if (stmt) statements.push(stmt);
    });

    summary.statementsQueued = statements.length;

    if (statements.length > 0) {
      await c.env.DB.batch(statements);
    }

    const refreshed = await c.env.DB.prepare('SELECT * FROM residents WHERE facilityId = ? ORDER BY name ASC').bind(facilityId).all();
    const residents = (refreshed.results || []) as any[];
    summary.activeAfterImport = residents.filter((resident) => activeStatus(resident.status) === 'Active').length;
    summary.dischargedAfterImport = residents.filter((resident) => activeStatus(resident.status) === 'Discharged').length;

    return c.json({ success: true, residents, summary });
  });
}
