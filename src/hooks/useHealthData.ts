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

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);

  if (!res.ok) {
    let message = `API error ${res.status}`;
    try {
      const body = await res.json();
      message = body?.error || body?.message || JSON.stringify(body);
    } catch {
      const text = await res.text().catch(() => '');
      if (text) message = text;
    }
    throw new Error(message);
  }

  if (res.status === 204) {
    return null as T;
  }

  return res.json();
}

const safeJson = (value: unknown): string => JSON.stringify(value ?? null);

const recordsEqual = (a: unknown, b: unknown): boolean => safeJson(a) === safeJson(b);

const pickChangedFields = <T extends Record<string, any>>(current: T, next: T): Partial<T> => {
  const changes: Partial<T> = {};
  Object.keys(next).forEach((key) => {
    if (!recordsEqual(current?.[key], next?.[key])) {
      changes[key as keyof T] = next[key];
    }
  });
  return changes;
};

const validateOrAlert = <T,>(result: { value: T; issues: { message: string; severity: 'warning' | 'error' }[]; isValid: boolean }, title: string): T | null => {
  if (result.isValid) return result.value;
  const errors = result.issues.filter((issue) => issue.severity === 'error').map((issue) => `• ${issue.message}`).join('\n');
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

    seen.set(key, {
      ...existing,
      ...resident,
      id: (existing as any).id || (resident as any).id,
      facilityId: (existing as any).facilityId || (resident as any).facilityId,
      notes: (existing as any).notes || (resident as any).notes,
      lastVisit: (existing as any).lastVisit || (resident as any).lastVisit,
    });
  });

  return Array.from(seen.values());
};

export function useHealthData() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [currentFacilityId, setCurrentFacilityId] = useState<string | null>(() => {
    return localStorage.getItem('currentFacilityId');
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const auditActor = {
    id: currentUser?.id,
    role: currentUser?.role,
  };

  const reportSaveError = (message: string, error: unknown) => {
    console.error(message, error);
    alert(message);
  };

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentFacilityId) {
      localStorage.setItem('currentFacilityId', currentFacilityId);
    }
  }, [currentFacilityId]);

  useEffect(() => {
    if (!currentUser) {
      setIsLoaded(true);
      return;
    }
    async function fetchFacilities() {
      try {
        const data = await apiFetch<Facility[]>(`/api/facilities?userId=${currentUser.id}`);
        setFacilities(data.map(normalizeFacility));
        if (data.length > 0 && !currentFacilityId) {
          setCurrentFacilityId(safeString(data[0].id));
        }
      } catch (err) {
        console.error('Failed to fetch facilities', err);
      }
    }
    fetchFacilities();
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      apiFetch<any[]>('/api/users').then(setUsers).catch(console.error);
    }
  }, [currentUser?.role]);

  useEffect(() => {
    if (!currentFacilityId || !currentUser) {
      if (!currentUser) setIsLoaded(true);
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
        if (savedDoctors) setDoctors(JSON.parse(savedDoctors));
        else setDoctors([]);
        
        if (savedRecords) setRecords(JSON.parse(savedRecords));
        else setRecords([]);

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
  }, [currentFacilityId]);

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

    setFacilities(prev => [...prev, newFac]);
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
          body: JSON.stringify({ facilityIds: [...facilities.map(f => f.id), id] }),
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

    const changes = pickChangedFields(current, nextFacility);
    if (Object.keys(changes).length === 0) return;

    const previousFacilities = facilities;
    setFacilities(prev => prev.map(f => f.id === id ? nextFacility : f));

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
    setFacilities(prev => prev.filter(f => f.id !== id));
    if (currentFacilityId === id) {
      const next = facilities.find(f => f.id !== id);
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
    setUsers(prev => [...prev, newUser]);

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
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updatedUser } : u));

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

  const fetchUserPermissions = async (userId: string) => {
    return apiFetch<string[]>(`/api/users/${userId}/facilities`);
  };

  const addAppointment = async (appointment: Omit<Appointment, 'id' | 'facilityId'>) => {
    if (!currentFacilityId) return;

    const id = crypto.randomUUID();
    const validated = validateAppointment({ ...appointment, id, facilityId: currentFacilityId });
    const newAppointment = validateOrAlert(validated, 'Appointment was not saved because required information is missing.');
    if (!newAppointment) return;

    const previousAppointments = appointments;
    setAppointments(prev => [...prev, newAppointment]);

    appendLocalAuditEvent(
      createAuditEvent({
        action: 'create',
        entity: 'appointment',
        entityId: newAppointment.id,
        facilityId: currentFacilityId,
        actor: auditActor,
        summary: `Appointment created for ${newAppointment.residentName}`,
      }),
    );

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

    const changes = pickChangedFields(current, nextAppointment);
    if (Object.keys(changes).length === 0) return;

    const previousAppointments = appointments;
    setAppointments(prev => prev.map(a => a.id === id ? nextAppointment : a));

    appendLocalAuditEvent(
      createAuditEvent({
        action: 'update',
        entity: 'appointment',
        entityId: id,
        facilityId: currentFacilityId || undefined,
        actor: auditActor,
        summary: 'Appointment updated',
        changedFields: Object.keys(changes),
      }),
    );

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
    setAppointments(prev => prev.filter(a => a.id !== id));

    appendLocalAuditEvent(
      createAuditEvent({
        action: 'delete',
        entity: 'appointment',
        entityId: id,
        facilityId: currentFacilityId || undefined,
        actor: auditActor,
        summary: 'Appointment deleted',
      }),
    );

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
    setResidents(prev => dedupeResidents([...prev, newResident]) as Resident[]);

    appendLocalAuditEvent(
      createAuditEvent({
        action: 'create',
        entity: 'resident',
        entityId: newResident.id,
        facilityId: currentFacilityId,
        actor: auditActor,
        summary: `Resident added: ${newResident.name}`,
      }),
    );

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

    const changes = pickChangedFields(current, nextResident);
    if (Object.keys(changes).length === 0) return;

    const previousResidents = residents;
    setResidents(prev => dedupeResidents(prev.map(r => r.id === id ? nextResident : r)) as Resident[]);

    appendLocalAuditEvent(
      createAuditEvent({
        action: 'update',
        entity: 'resident',
        entityId: id,
        facilityId: currentFacilityId || undefined,
        actor: auditActor,
        summary: 'Resident updated',
        changedFields: Object.keys(changes),
      }),
    );

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
    const previousResidents = residents;
    setResidents(prev => prev.filter(r => r.id !== id));

    appendLocalAuditEvent(
      createAuditEvent({
        action: 'delete',
        entity: 'resident',
        entityId: id,
        facilityId: currentFacilityId || undefined,
        actor: auditActor,
        summary: 'Resident deleted',
      }),
    );

    try {
      await apiFetch(`/api/residents/${id}`, { method: 'DELETE' });
    } catch (error) {
      setResidents(previousResidents);
      reportSaveError('Resident was not deleted. Please try again.', error);
    }
  };

  const batchAddResidents = async (newResidents: Omit<Resident, 'id' | 'facilityId'>[]) => {
    if (!currentFacilityId) return;
    const existingKeys = new Set(residents.map(normalizeResidentKey));
    const prepared = dedupeResidents(newResidents.map((resident) => validateResident(resident).value))
      .filter((resident) => validateResident(resident).isValid)
      .filter((resident) => !existingKeys.has(normalizeResidentKey(resident)))
      .map(r => normalizeResident({ ...r, id: crypto.randomUUID(), facilityId: currentFacilityId, status: 'Active' })) as Resident[];

    if (prepared.length === 0) return;

    const previousResidents = residents;
    setResidents(prev => dedupeResidents([...prev, ...prepared]) as Resident[]);

    appendLocalAuditEvent(
      createAuditEvent({
        action: 'import',
        entity: 'census',
        facilityId: currentFacilityId,
        actor: auditActor,
        summary: 'Census import completed',
        counts: { added: prepared.length },
      }),
    );

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

  const replaceResidents = async (newResidents: Omit<Resident, 'id' | 'facilityId'>[]) => {
    if (!currentFacilityId) return;
    const currentResidents = dedupeResidents([...residents]) as Resident[];
    const existingResidentsMap = new Map<string, Resident>();
    currentResidents.forEach(res => {
      existingResidentsMap.set(normalizeResidentKey(res), res);
    });

    const validNewResidents = newResidents
      .map((resident) => validateResident(resident))
      .filter((result) => result.isValid)
      .map((result) => result.value);

    const uniqueNewResidentsMap = new Map<string, Omit<Resident, 'id' | 'facilityId'>>();
    dedupeResidents(validNewResidents).forEach(res => {
      uniqueNewResidentsMap.set(normalizeResidentKey(res), res as any);
    });

    const incomingKeys = new Set(uniqueNewResidentsMap.keys());
    const censusStamp = new Date().toISOString();

    const activeMerged = Array.from(uniqueNewResidentsMap.values()).map(newRes => {
      const key = normalizeResidentKey(newRes);
      const existing = existingResidentsMap.get(key);

      if (existing) {
        return normalizeResident({
          ...newRes,
          id: existing.id,
          facilityId: currentFacilityId,
          notes: existing.notes || newRes.notes,
          lastVisit: existing.lastVisit || newRes.lastVisit,
          status: 'Active',
          dischargedAt: undefined,
          lastSeenCensusAt: censusStamp,
        });
      }

      return normalizeResident({
        ...newRes,
        id: crypto.randomUUID(),
        facilityId: currentFacilityId,
        status: 'Active',
        dischargedAt: undefined,
        lastSeenCensusAt: censusStamp,
      });
    });

    const dischargedResidents = currentResidents
      .filter(existing => !incomingKeys.has(normalizeResidentKey(existing)))
      .map(existing => normalizeResident({
        ...existing,
        status: 'Discharged',
        dischargedAt: existing.dischargedAt || censusStamp,
      }));

    const finalResidents = dedupeResidents([...activeMerged, ...dischargedResidents]) as Resident[];
    const previousResidents = residents;
    setResidents(finalResidents);

    let createdCount = 0;
    let updatedCount = 0;
    let unchangedCount = 0;
    let markedDischargedCount = 0;

    try {
      for (const res of finalResidents) {
        const key = normalizeResidentKey(res);
        const existing = existingResidentsMap.get(key);
        if (existing) {
          const changes = pickChangedFields(existing, res);
          if (Object.keys(changes).length === 0) {
            unchangedCount += 1;
            continue;
          }
          if (changes.status === 'Discharged') {
            markedDischargedCount += 1;
          }
          updatedCount += 1;
          await apiFetch(`/api/residents/${res.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(changes),
          });
        } else {
          createdCount += 1;
          await apiFetch('/api/residents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(res),
          });
        }
      }

      appendLocalAuditEvent(
        createAuditEvent({
          action: 'replace',
          entity: 'census',
          facilityId: currentFacilityId,
          actor: auditActor,
          summary: 'Census replacement completed; missing residents preserved as discharged',
          counts: {
            total: finalResidents.length,
            active: activeMerged.length,
            created: createdCount,
            updated: updatedCount,
            unchanged: unchangedCount,
            markedDischarged: markedDischargedCount,
          },
        }),
      );
    } catch (error) {
      setResidents(previousResidents);
      reportSaveError('Census replacement was not fully saved. Please try again.', error);
    }
  };

  const addDoctor = (doctor: Omit<Doctor, 'id'>) => {
    const newDoctor = { ...doctor, id: crypto.randomUUID() };
    setDoctors(prev => [...prev, newDoctor]);
  };

  const addRecord = (record: Omit<MedicalRecord, 'id'>) => {
    const newRecord = { ...record, id: crypto.randomUUID() };
    setRecords(prev => [...prev, newRecord]);
  };

  const login = async (email: string, password?: string) => {
    return apiFetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentFacilityId(null);
    setFacilities([]);
    setAppointments([]);
    setResidents([]);
  };

  const setupPassword = async (userId: string, password: string) => {
    return apiFetch('/api/setup-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, password }),
    });
  };

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
    isLoaded
  };
}
