import { useState, useEffect } from 'react';
import { Appointment, Doctor, MedicalRecord, Resident, Facility } from '../types';
import {
  normalizeAppointment,
  normalizeFacility,
  normalizeResident,
  normalizeResidentKey,
  safeString,
  validateAppointment,
  validateFacility,
  validateResident,
} from '../utils/dataValidation';
import { createAuditEvent, appendLocalAuditEvent } from '../utils/auditLog';
import { reconcileCensusResidents } from '../utils/censusReconciliation';
import { reconcileCensusOnBackend } from '../services/censusReconcileService';
import { apiFetch } from '../api/apiClient';
import { mergeWithSeededFacilities, SEEDED_FACILITY_REGISTRY } from '../admin/facilityRegistry';

const safeJson = (value: unknown): string => JSON.stringify(value ?? null);
const recordsEqual = (a: unknown, b: unknown): boolean => safeJson(a) === safeJson(b);

const toHealthFacilities = (payload?: unknown): Facility[] => {
  const merged = payload === undefined ? SEEDED_FACILITY_REGISTRY : mergeWithSeededFacilities(payload);
  return merged.map((facility) => normalizeFacility({
    id: facility.id,
    name: facility.name,
    shortName: facility.shortName,
    code: facility.code,
    address: facility.address,
    phone: facility.phone,
    administrator: facility.administrator || '',
    don: facility.don || '',
    adon: facility.adon || '',
    status: facility.status || 'active',
  } as any)) as Facility[];
};

const dedupeHealthFacilities = (facilityList: Partial<Facility>[]) => {
  return mergeWithSeededFacilities({ facilities: facilityList }).map((facility) => normalizeFacility({
    id: facility.id,
    name: facility.name,
    shortName: facility.shortName,
    code: facility.code,
    address: facility.address,
    phone: facility.phone,
    administrator: facility.administrator || '',
    don: facility.don || '',
    adon: facility.adon || '',
    status: facility.status || 'active',
  } as any)) as Facility[];
};

const pickChangedFields = <T extends Record<string, any>>(current: T, next: T): Partial<T> => {
  const changes: Partial<T> = {};
  Object.keys(next).forEach((key) => {
    if (!recordsEqual(current?.[key], next[key])) {
      changes[key as keyof T] = next[key];
    }
  });
  return changes;
};

const validateOrAlert = <T,>(
  result: { value: T; issues: { message: string; severity: 'warning' | 'error' }[]; isValid: boolean },
  title: string,
): T | null => {
  if (result.isValid) return result.value;
  const errors = result.issues
    .filter((issue) => issue.severity === 'error')
    .map((issue) => `• ${issue.message}`)
    .join('\n');
  alert(`${title}\n\n${errors || 'Please review the record and try again.'}`);
  return null;
};

const dedupeResidents = <T extends Partial<Resident>>(residentList: T[]) => {
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

const normalizeResidentStatus = (status: unknown): 'Active' | 'Discharged' => {
  const text = safeString(status).trim().toLowerCase();
  if (text === 'discharged' || text === 'inactive') return 'Discharged';
  return 'Active';
};

const buildDemographicResidentPatch = (existing: Resident, next: Resident) => {
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

export function useHealthData() {
  const seededFacilities = toHealthFacilities();
  const [facilities, setFacilities] = useState<Facility[]>(seededFacilities);
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentFacilityId, setCurrentFacilityId] = useState<string | null>(() => localStorage.getItem('currentFacilityId') || safeString(seededFacilities[0]?.id) || null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const authUserId = currentUser?.id;

  const auditActor = { id: currentUser?.id, role: currentUser?.role };

  const reportSaveError = (message: string, error: unknown) => {
    console.error(message, error);
    const detail = error instanceof Error ? error.message : safeString(error);
    alert(detail ? `${message}\n\n${detail}` : message);
  };

  useEffect(() => {
    let active = true;

    apiFetch<{ success: boolean; user: any }>('/api/auth/session')
      .then((response) => {
        if (!active) return;
        setCurrentUser(response.user || null);
      })
      .catch(() => {
        if (!active) return;
        setCurrentUser(null);
      })
      .finally(() => {
        if (active) setIsAuthResolved(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (currentFacilityId) localStorage.setItem('currentFacilityId', currentFacilityId);
  }, [currentFacilityId]);

  useEffect(() => {
    if (!isAuthResolved) return;
    if (!currentUser) {
      setFacilities(toHealthFacilities());
      if (!currentFacilityId && seededFacilities[0]?.id) setCurrentFacilityId(safeString(seededFacilities[0].id));
      setIsLoaded(true);
      return;
    }

    async function fetchFacilities() {
      try {
        const data = await apiFetch<unknown>('/api/facilities');
        const merged = toHealthFacilities(data);
        setFacilities(merged);
        if (merged.length > 0 && (!currentFacilityId || !merged.some((f) => f.id === currentFacilityId))) {
          setCurrentFacilityId(safeString(merged[0].id));
        }
      } catch (err) {
        console.error('Failed to fetch facilities; using seeded facility registry', err);
        const fallback = toHealthFacilities();
        setFacilities(fallback);
        if (fallback.length > 0 && (!currentFacilityId || !fallback.some((f) => f.id === currentFacilityId))) {
          setCurrentFacilityId(safeString(fallback[0].id));
        }
      }
    }

    fetchFacilities();
  }, [currentUser?.id, isAuthResolved]);

  useEffect(() => {
    const roleIds = [currentUser?.role, ...(currentUser?.roleIds || [])].filter(Boolean);
    if (roleIds.some((roleId) => ['admin', 'role-super-admin', 'role-org-admin', 'role-facility-admin'].includes(roleId))) {
      apiFetch<{ users?: any[] } | any[]>('/api/users')
        .then((response) => setUsers(Array.isArray(response) ? response : response?.users || []))
        .catch(console.error);
    }
  }, [currentUser?.role, currentUser?.roleIds]);

  useEffect(() => {
    if (!isAuthResolved) return;
    if (!currentFacilityId || !authUserId) {
      if (!authUserId) setIsLoaded(true);
      return;
    }

    async function fetchData(retries = 3) {
      try {
        const [residentsData, appointmentsData] = await Promise.all([
          apiFetch<Resident[]>(`/api/residents?facilityId=${currentFacilityId}`),
          apiFetch<Appointment[]>(`/api/appointments?facilityId=${currentFacilityId}`),
        ]);

        setResidents(dedupeResidents(residentsData.map(normalizeResident)) as Resident[]);
        setAppointments(appointmentsData.map(normalizeAppointment));

        const savedDoctors = localStorage.getItem(`doctors_${currentFacilityId}`);
        const savedRecords = localStorage.getItem(`records_${currentFacilityId}`);
        setDoctors(savedDoctors ? JSON.parse(savedDoctors) : []);
        setRecords(savedRecords ? JSON.parse(savedRecords) : []);
        setIsLoaded(true);
      } catch (error) {
        if (retries > 0) {
          console.warn(`Fetch failed, retrying... (${retries} left)`, error);
          setTimeout(() => fetchData(retries - 1), 2000);
        } else {
          console.error('Failed to fetch data from API after retries:', error);
          setIsLoaded(true);
        }
      }
    }

    setIsLoaded(false);
    fetchData();
  }, [currentFacilityId, authUserId, isAuthResolved]);

  useEffect(() => {
    if (isLoaded && currentFacilityId) {
      localStorage.setItem(`doctors_${currentFacilityId}`, JSON.stringify(doctors));
      localStorage.setItem(`records_${currentFacilityId}`, JSON.stringify(records));
    }
  }, [doctors, records, isLoaded, currentFacilityId]);

  const addFacility = async (facility: Omit<Facility, 'id'>) => {
    const id = crypto.randomUUID();
    const validated = validateFacility({ ...facility, id });
    const newFac = validateOrAlert(validated, 'Facility was not saved because required information is missing.');
    if (!newFac) return;

    const previousFacilities = facilities;
    const previousFacilityId = currentFacilityId;
    setFacilities((prev) => dedupeHealthFacilities([...prev, newFac]));
    if (!currentFacilityId) setCurrentFacilityId(id);

    try {
      await apiFetch('/api/facilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFac),
      });

      if (currentUser.id) {
        await apiFetch(`/api/users/${currentUser.id}/facilities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ facilityIds: [...facilities.map((f) => f.id), id] }),
        });
      }
    } catch (error) {
      setFacilities(previousFacilities);
      setCurrentFacilityId(previousFacilityId);
      reportSaveError('Facility was not saved. Please try again.', error);
    }
  };

  const updateFacility = async (id: string, updates: Partial<Facility>) => {
    const current = facilities.find((f) => f.id === id);
    if (!current) return;

    const validated = validateFacility({ ...current, ...updates, id });
    const nextFacility = validateOrAlert(validated, 'Facility changes were not saved because required information is missing.');
    if (!nextFacility) return;

    const changes = pickChangedFields(current as any, nextFacility as any);
    if (Object.keys(changes).length === 0) return;

    const previousFacilities = facilities;
    setFacilities((prev) => dedupeHealthFacilities(prev.map((f) => (f.id === id ? nextFacility : f))));

    try {
      await apiFetch(`/api/facilities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });
    } catch (error) {
      setFacilities(previousFacilities);
      reportSaveError('Facility changes were not saved. Please try again.', error);
    }
  };

  const deleteFacility = async (id: string) => {
    const previousFacilities = facilities;
    const previousFacilityId = currentFacilityId;
    setFacilities((prev) => prev.filter((f) => f.id !== id));
    if (currentFacilityId === id) {
      const next = facilities.find((f) => f.id !== id);
      setCurrentFacilityId(next?.id || null);
    }

    try {
      await apiFetch(`/api/facilities/${id}`, { method: 'DELETE' });
    } catch (error) {
      setFacilities(previousFacilities);
      setCurrentFacilityId(previousFacilityId);
      reportSaveError('Facility was not deleted. Please try again.', error);
    }
  };

  const addUser = async (user: any) => {
    const id = crypto.randomUUID();
    const newUser = { ...user, id };
    const previousUsers = users;
    setUsers((prev) => [...prev, newUser]);

    try {
      await apiFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      return id;
    } catch (error) {
      setUsers(previousUsers);
      reportSaveError('User was not saved. Please try again.', error);
      return null;
    }
  };

  const updateUser = async (id: string, user: any) => {
    const updatedUser = { ...user, id };
    const previousUsers = users;
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updatedUser } : u)));

    try {
      await apiFetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      });
    } catch (error) {
      setUsers(previousUsers);
      reportSaveError('User changes were not saved. Please try again.', error);
    }
  };

  const updateUserPermissions = async (userId: string, facilityIds: string[]) => {
    await apiFetch(`/api/users/${userId}/facilities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facilityIds }),
    });
  };

  const fetchUserPermissions = async (userId: string) => apiFetch<string[]>(`/api/users/${userId}/facilities`);

  const addAppointment = async (appointment: Omit<Appointment, 'id' | 'facilityId'>) => {
    if (!currentFacilityId) return;

    const id = crypto.randomUUID();
    const validated = validateAppointment({ ...appointment, id, facilityId: currentFacilityId });
    const newAppointment = validateOrAlert(validated, 'Appointment was not saved because required information is missing.');
    if (!newAppointment) return;

    const previousAppointments = appointments;
    setAppointments((prev) => [...prev, newAppointment]);

    appendLocalAuditEvent(createAuditEvent({
      action: 'create',
      entity: 'appointment',
      entityId: newAppointment.id,
      facilityId: currentFacilityId,
      actor: auditActor,
      summary: `Appointment created for ${newAppointment.residentName}`,
    }));

    try {
      await apiFetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAppointment),
      });
    } catch (error) {
      setAppointments(previousAppointments);
      reportSaveError('Appointment was not saved. Please try again.', error);
    }
  };

  const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    const current = appointments.find((appointment) => appointment.id === id);
    if (!current) return;

    const validated = validateAppointment({ ...current, ...updates, id, facilityId: current.facilityId || currentFacilityId || '' });
    const nextAppointment = validateOrAlert(validated, 'Appointment changes were not saved because required information is missing.');
    if (!nextAppointment) return;

    const changes = pickChangedFields(current as any, nextAppointment as any);
    if (Object.keys(changes).length === 0) return;

    const previousAppointments = appointments;
    setAppointments((prev) => prev.map((a) => (a.id === id ? nextAppointment : a)));

    appendLocalAuditEvent(createAuditEvent({
      action: 'update',
      entity: 'appointment',
      entityId: id,
      facilityId: currentFacilityId || undefined,
      actor: auditActor,
      summary: 'Appointment updated',
      changedFields: Object.keys(changes),
    }));

    try {
      await apiFetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });
    } catch (error) {
      setAppointments(previousAppointments);
      reportSaveError('Appointment changes were not saved. Please try again.', error);
    }
  };

  const deleteAppointment = async (id: string) => {
    const previousAppointments = appointments;
    setAppointments((prev) => prev.filter((a) => a.id !== id));

    appendLocalAuditEvent(createAuditEvent({
      action: 'delete',
      entity: 'appointment',
      entityId: id,
      facilityId: currentFacilityId || undefined,
      actor: auditActor,
      summary: 'Appointment deleted',
    }));

    try {
      await apiFetch(`/api/appointments/${id}`, { method: 'DELETE' });
    } catch (error) {
      setAppointments(previousAppointments);
      reportSaveError('Appointment was not deleted. Please try again.', error);
    }
  };

  const addResident = async (resident: Omit<Resident, 'id' | 'facilityId'>) => {
    if (!currentFacilityId) return;
    const id = crypto.randomUUID();
    const validated = validateResident({ ...resident, id, facilityId: currentFacilityId, status: 'Active' });
    const newResident = validateOrAlert(validated, 'Resident was not saved because required information is missing.');
    if (!newResident) return;

    const previousResidents = residents;
    setResidents((prev) => dedupeResidents([...prev, newResident]) as Resident[]);

    appendLocalAuditEvent(createAuditEvent({
      action: 'create',
      entity: 'resident',
      entityId: newResident.id,
      facilityId: currentFacilityId,
      actor: auditActor,
      summary: `Resident added: ${newResident.name}`,
    }));

    try {
      await apiFetch('/api/residents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newResident),
      });
    } catch (error) {
      setResidents(previousResidents);
      reportSaveError('Resident was not saved. Please try again.', error);
    }
  };

  const updateResident = async (id: string, updates: Partial<Resident>) => {
    const current = residents.find((resident) => resident.id === id);
    if (!current) return;

    const validated = validateResident({ ...current, ...updates, id, facilityId: current.facilityId || currentFacilityId || '' });
    const nextResident = validateOrAlert(validated, 'Resident changes were not saved because required information is missing.');
    if (!nextResident) return;

    const changes = pickChangedFields(current as any, nextResident as any);
    if (Object.keys(changes).length === 0) return;

    const previousResidents = residents;
    setResidents((prev) => dedupeResidents(prev.map((r) => (r.id === id ? nextResident : r))) as Resident[]);

    appendLocalAuditEvent(createAuditEvent({
      action: 'update',
      entity: 'resident',
      entityId: id,
      facilityId: currentFacilityId || undefined,
      actor: auditActor,
      summary: 'Resident updated',
      changedFields: Object.keys(changes),
    }));

    try {
      await apiFetch(`/api/residents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });
    } catch (error) {
      setResidents(previousResidents);
      reportSaveError('Resident changes were not saved. Please try again.', error);
    }
  };

  const deleteResident = async (id: string) => {
    const current = residents.find((resident) => resident.id === id);
    if (!current) return;

    await updateResident(id, {
      status: 'Discharged',
      dischargedAt: (current as any).dischargedAt || new Date().toISOString(),
    } as any);
  };

  const batchAddResidents = async (newResidents: Omit<Resident, 'id' | 'facilityId'>[]) => {
    if (!currentFacilityId) return;
    const existingKeys = new Set(residents.map(normalizeResidentKey));
    const prepared = dedupeResidents(newResidents.map((resident) => validateResident(resident).value as any))
      .filter((resident) => validateResident(resident as any).isValid)
      .filter((resident) => !existingKeys.has(normalizeResidentKey(resident)))
      .map((r) => normalizeResident({ ...r, id: crypto.randomUUID(), facilityId: currentFacilityId, status: 'Active' })) as Resident[];

    if (prepared.length === 0) return;

    const previousResidents = residents;
    setResidents((prev) => dedupeResidents([...prev, ...prepared]) as Resident[]);

    appendLocalAuditEvent(createAuditEvent({
      action: 'import',
      entity: 'census',
      facilityId: currentFacilityId,
      actor: auditActor,
      summary: 'Census import completed',
      counts: { added: prepared.length },
    }));

    try {
      for (const res of prepared) {
        await apiFetch('/api/residents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(res),
        });
      }
    } catch (error) {
      setResidents(previousResidents);
      reportSaveError('Census residents were not fully saved. Please try again.', error);
    }
  };

  const replaceResidentsWithFrontendFallback = async (
    currentResidents: Resident[],
    validNewResidents: Omit<Resident, 'id' | 'facilityId'>[],
    previousResidents: Resident[],
  ) => {
    const reconciliation = reconcileCensusResidents({
      existingResidents: currentResidents,
      incomingResidents: validNewResidents,
      facilityId: currentFacilityId || '',
    });

    setResidents(dedupeResidents(reconciliation.residents) as Resident[]);

    try {
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

      appendLocalAuditEvent(createAuditEvent({
        action: 'replace',
        entity: 'census',
        facilityId: currentFacilityId,
        actor: auditActor,
        summary: 'Smart census reconciliation completed using frontend fallback',
        counts: {
          total: reconciliation.summary.totalIncoming,
          existing: reconciliation.summary.totalExisting,
          activeAfterImport: reconciliation.summary.activeAfterImport,
          dischargedAfterImport: reconciliation.summary.dischargedAfterImport,
          created: reconciliation.summary.created,
          updated: reconciliation.summary.updated,
          reactivated: reconciliation.summary.reactivated,
          discharged: reconciliation.summary.discharged,
          unchanged: reconciliation.summary.unchanged,
        },
      }));

      console.info('Frontend fallback census reconciliation summary', reconciliation.summary);
    } catch (error) {
      console.error('Frontend fallback census reconciliation failed', error, reconciliation.summary);
      setResidents(previousResidents);
      reportSaveError('Smart census reconciliation was not fully saved. Previous resident list was restored.', error);
    }
  };

  const replaceResidents = async (newResidents: Omit<Resident, 'id' | 'facilityId'>[]) => {
    if (!currentFacilityId) return;

    const currentResidents = dedupeResidents([...residents]) as Resident[];
    const validNewResidents = newResidents
      .map((resident) => validateResident(resident))
      .filter((result) => result.isValid)
      .map((result) => result.value as Omit<Resident, 'id' | 'facilityId'>);

    if (validNewResidents.length === 0) return;

    const previousResidents = residents;

    try {
      const response = await reconcileCensusOnBackend({
        facilityId: currentFacilityId,
        residents: validNewResidents,
      });

      const nextResidents = dedupeResidents((response.residents || []).map(normalizeResident)) as Resident[];
      setResidents(nextResidents);

      appendLocalAuditEvent(createAuditEvent({
        action: 'replace',
        entity: 'census',
        facilityId: currentFacilityId,
        actor: auditActor,
        summary: 'Backend census reconciliation completed',
        counts: {
          total: response.summary.totalIncoming,
          existing: response.summary.totalExisting,
          activeAfterImport: response.summary.activeAfterImport,
          dischargedAfterImport: response.summary.dischargedAfterImport,
          created: response.summary.created,
          updated: response.summary.updated,
          reactivated: response.summary.reactivated,
          discharged: response.summary.discharged,
          unchanged: response.summary.unchanged,
        },
      }));

      console.info('Backend census reconciliation summary', response.summary);
    } catch (error) {
      console.warn('Backend census reconciliation failed; using frontend fallback.', error);
      await replaceResidentsWithFrontendFallback(currentResidents, validNewResidents, previousResidents);
    }
  };

  const addDoctor = (doctor: Omit<Doctor, 'id'>) => {
    const newDoctor = { ...doctor, id: crypto.randomUUID() };
    setDoctors((prev) => [...prev, newDoctor]);
  };

  const addRecord = (record: Omit<MedicalRecord, 'id'>) => {
    const newRecord = { ...record, id: crypto.randomUUID() };
    setRecords((prev) => [...prev, newRecord]);
  };

  const login = async (email: string, password?: string) => apiFetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const logout = () => {
    void apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
    setCurrentUser(null);
    setCurrentFacilityId(null);
    setFacilities(toHealthFacilities());
    setAppointments([]);
    setResidents([]);
  };

  const setupPassword = async (userId: string, password: string) => apiFetch('/api/setup-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, password }),
  });

  return {
    facilities,
    currentFacilityId,
    setCurrentFacilityId,
    addFacility,
    updateFacility,
    deleteFacility,
    users,
    currentUser,
    setCurrentUser,
    login,
    logout,
    setupPassword,
    addUser,
    updateUser,
    updateUserPermissions,
    fetchUserPermissions,
    appointments,
    doctors,
    records,
    residents,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    addDoctor,
    addRecord,
    addResident,
    updateResident,
    deleteResident,
    batchAddResidents,
    replaceResidents,
    isLoaded,
    isAuthResolved,
  };
}

export default useHealthData;
