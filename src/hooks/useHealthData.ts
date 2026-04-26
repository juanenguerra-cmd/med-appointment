import { useState, useEffect } from 'react';
import { Appointment, Doctor, MedicalRecord, Resident, Facility } from '../types';

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

const safeString = (value: unknown, fallback = ''): string => {
  if (value === undefined || value === null) return fallback;
  return String(value);
};

const safeLower = (value: unknown): string => safeString(value).trim().toLowerCase();

const safeBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  const normalized = safeLower(value);
  return ['true', 'yes', 'y', '1', 'checked'].includes(normalized);
};

const normalizeAppointment = (appointment: any): Appointment => ({
  ...appointment,
  id: safeString(appointment?.id),
  facilityId: safeString(appointment?.facilityId),
  origin: safeString(appointment?.origin),
  residentName: safeString(appointment?.residentName),
  unit: safeString(appointment?.unit),
  roomNumber: safeString(appointment?.roomNumber),
  providerName: safeString(appointment?.providerName),
  location: safeString(appointment?.location),
  contactNumber: safeString(appointment?.contactNumber),
  schedulingDate: safeString(appointment?.schedulingDate),
  referralDate: safeString(appointment?.referralDate),
  status: (safeString(appointment?.status, 'Scheduled') || 'Scheduled') as Appointment['status'],
  date: safeString(appointment?.date),
  time: safeString(appointment?.time),
  pickUpTime: safeString(appointment?.pickUpTime),
  type: safeString(appointment?.type),
  description: safeString(appointment?.description),
  serviceInHouse: safeString(appointment?.serviceInHouse),
  reasonSendOut: safeString(appointment?.reasonSendOut),
  transportType: safeString(appointment?.transportType),
  transportTypeOther: safeString(appointment?.transportTypeOther),
  transportCompany: safeString(appointment?.transportCompany),
  payerForRide: safeString(appointment?.payerForRide),
  payerForRideOther: safeString(appointment?.payerForRideOther),
  roundTrip: safeString(appointment?.roundTrip),
  escort: safeString(appointment?.escort),
  escortDetails: safeString(appointment?.escortDetails),
  notes: safeString(appointment?.notes),
  weight: safeString(appointment?.weight),
  height: safeString(appointment?.height),
  nurseCompleting: safeString(appointment?.nurseCompleting),
  reasonConsultation: safeString(appointment?.reasonConsultation),
  consultReason: safeString(appointment?.consultReason),
  ambulating: safeBoolean(appointment?.ambulating),
  wheelchair: safeBoolean(appointment?.wheelchair),
  withLift: safeBoolean(appointment?.withLift),
  recliner: safeBoolean(appointment?.recliner),
  oxygen: safeBoolean(appointment?.oxygen),
  bariatric: safeBoolean(appointment?.bariatric),
});

const normalizeResident = (resident: any): Resident => ({
  ...resident,
  id: safeString(resident?.id),
  facilityId: safeString(resident?.facilityId),
  name: safeString(resident?.name),
  lastName: safeString(resident?.lastName),
  firstName: safeString(resident?.firstName),
  mrn: safeString(resident?.mrn),
  age: safeString(resident?.age),
  floor: safeString(resident?.floor),
  unit: safeString(resident?.unit),
  roomNumber: safeString(resident?.roomNumber),
  sex: safeString(resident?.sex),
  admissionDate: safeString(resident?.admissionDate),
  allergies: safeString(resident?.allergies),
  doctor: safeString(resident?.doctor),
  diagnosis: safeString(resident?.diagnosis),
  lastVisit: safeString(resident?.lastVisit),
  notes: safeString(resident?.notes),
});

const normalizeFacility = (facility: any): Facility => ({
  ...facility,
  id: safeString(facility?.id),
  name: safeString(facility?.name),
  address: safeString(facility?.address),
  phone: safeString(facility?.phone),
  contactPerson: safeString(facility?.contactPerson),
});

const normalizeResidentKey = (resident: Partial<Resident>) => {
  const mrn = safeString(resident.mrn).trim();
  if (mrn && mrn !== '—') return `mrn:${safeLower(mrn)}`;

  const name = safeString(resident.name).trim().replace(/\s+/g, ' ');
  const room = safeString(resident.roomNumber).trim().replace(/\s+/g, ' ');
  return `name-room:${safeLower(name)}|${safeLower(room)}`;
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
    const newFac = normalizeFacility({ ...facility, id });
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
    const previousFacilities = facilities;
    setFacilities(prev => prev.map(f => f.id === id ? normalizeFacility({ ...f, ...updates }) : f));

    try {
      await apiFetch(`/api/facilities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
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
    const newAppointment = normalizeAppointment({ ...appointment, id, facilityId: currentFacilityId });
    const previousAppointments = appointments;
    setAppointments(prev => [...prev, newAppointment]);

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
    const previousAppointments = appointments;
    setAppointments(prev => prev.map(a => a.id === id ? normalizeAppointment({ ...a, ...updates }) : a));

    try {
      await apiFetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (error) {
      setAppointments(previousAppointments);
      reportSaveError('Appointment changes were not saved. Please try again.', error);
    }
  };

  const deleteAppointment = async (id: string) => {
    const previousAppointments = appointments;
    setAppointments(prev => prev.filter(a => a.id !== id));

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
    const newResident = normalizeResident({ ...resident, id, facilityId: currentFacilityId, status: 'Active' });
    const previousResidents = residents;
    setResidents(prev => dedupeResidents([...prev, newResident]) as Resident[]);

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
    const previousResidents = residents;
    setResidents(prev => dedupeResidents(prev.map(r => r.id === id ? normalizeResident({ ...r, ...updates }) : r)) as Resident[]);

    try {
      await apiFetch(`/api/residents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (error) {
      setResidents(previousResidents);
      reportSaveError('Resident changes were not saved. Please try again.', error);
    }
  };

  const deleteResident = async (id: string) => {
    const previousResidents = residents;
    setResidents(prev => prev.filter(r => r.id !== id));

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
    const prepared = dedupeResidents(newResidents.map(normalizeResident))
      .filter((resident) => !existingKeys.has(normalizeResidentKey(resident)))
      .map(r => normalizeResident({ ...r, id: crypto.randomUUID(), facilityId: currentFacilityId, status: 'Active' })) as Resident[];

    if (prepared.length === 0) return;

    const previousResidents = residents;
    setResidents(prev => dedupeResidents([...prev, ...prepared]) as Resident[]);

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

    const uniqueNewResidentsMap = new Map<string, Omit<Resident, 'id' | 'facilityId'>>();
    dedupeResidents(newResidents.map(normalizeResident)).forEach(res => {
      uniqueNewResidentsMap.set(normalizeResidentKey(res), res as any);
    });

    const censusStamp = new Date().toISOString();
    const merged = Array.from(uniqueNewResidentsMap.values()).map(newRes => {
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
      return normalizeResident({ ...newRes, id: crypto.randomUUID(), facilityId: currentFacilityId, status: 'Active', lastSeenCensusAt: censusStamp });
    });

    const dedupedMerged = dedupeResidents(merged) as Resident[];
    const previousResidents = residents;
    setResidents(dedupedMerged);

    try {
      for (const res of dedupedMerged) {
        const key = normalizeResidentKey(res);
        const existing = existingResidentsMap.get(key);
        if (existing) {
          await apiFetch(`/api/residents/${res.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(res),
          });
        } else {
          await apiFetch('/api/residents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(res),
          });
        }
      }
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
