import { useState, useEffect } from 'react';
import { Appointment, Doctor, MedicalRecord, Resident, Facility } from '../types';

export function useHealthData() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>({ id: 'admin-user-1', email: 'juan.enguerra.secure@gmail.com', role: 'admin' });
  const [currentFacilityId, setCurrentFacilityId] = useState<string | null>(() => {
    return localStorage.getItem('currentFacilityId');
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Persistence for currentFacilityId
  useEffect(() => {
    if (currentFacilityId) {
      localStorage.setItem('currentFacilityId', currentFacilityId);
    }
  }, [currentFacilityId]);

  // Fetch Facilities initially
  useEffect(() => {
    async function fetchFacilities() {
      try {
        // Fetch restricted facilities for current user
        const res = await fetch(`/api/facilities?userId=${currentUser.id}`);
        if (res.ok) {
          const data: Facility[] = await res.json();
          setFacilities(data);
          if (data.length > 0 && !currentFacilityId) {
            setCurrentFacilityId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch facilities", err);
      }
    }
    fetchFacilities();
  }, [currentUser.id]);

  useEffect(() => {
    if (currentUser.role === 'admin') {
      fetch('/api/users').then(res => res.json()).then(setUsers).catch(console.error);
    }
  }, [currentUser.role]);

  // Main Data Fetch dependent on currentFacilityId
  useEffect(() => {
    if (!currentFacilityId) return;

    async function fetchData(retries = 3) {
      try {
        const [resResidents, resAppointments] = await Promise.all([
          fetch(`/api/residents?facilityId=${currentFacilityId}`),
          fetch(`/api/appointments?facilityId=${currentFacilityId}`)
        ]);
        
        if (!resResidents.ok || !resAppointments.ok) {
          throw new Error(`Failed to fetch: ${resResidents.status} / ${resAppointments.status}`);
        }

        const residentsData = await resResidents.json();
        const appointmentsData = await resAppointments.json();
        
        setResidents(residentsData);
        setAppointments(appointmentsData);
        
        const savedDoctors = localStorage.getItem(`doctors_${currentFacilityId}`);
        const savedRecords = localStorage.getItem(`records_${currentFacilityId}`);
        if (savedDoctors) setDoctors(JSON.parse(savedDoctors));
        else setDoctors([]); // Reset if switching facilities
        
        if (savedRecords) setRecords(JSON.parse(savedRecords));
        else setRecords([]);

        setIsLoaded(true);
      } catch (error) {
        if (retries > 0) {
          console.warn(`Fetch failed, retrying... (${retries} left)`, error);
          setTimeout(() => fetchData(retries - 1), 2000);
        } else {
          console.error("Failed to fetch data from API after retries:", error);
          setIsLoaded(true);
        }
      }
    }
    
    setIsLoaded(false); // Trigger loading state on facility switch
    fetchData();
  }, [currentFacilityId]);

  // Persist doctors/records to localStorage
  useEffect(() => {
    if (isLoaded && currentFacilityId) {
      localStorage.setItem(`doctors_${currentFacilityId}`, JSON.stringify(doctors));
      localStorage.setItem(`records_${currentFacilityId}`, JSON.stringify(records));
    }
  }, [doctors, records, isLoaded, currentFacilityId]);

  const addFacility = async (facility: Omit<Facility, 'id'>) => {
    const id = crypto.randomUUID();
    const newFac = { ...facility, id };
    setFacilities(prev => [...prev, newFac]);
    
    await fetch('/api/facilities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFac)
    });
    
    if (!currentFacilityId) setCurrentFacilityId(id);

    // If admin, auto-grant permission to the created facility
    if (currentUser.id) {
      await fetch(`/api/users/${currentUser.id}/facilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facilityIds: [...facilities.map(f => f.id), id] })
      });
    }
  };

  const updateFacility = async (id: string, updates: Partial<Facility>) => {
    setFacilities(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    await fetch(`/api/facilities/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  };

  const deleteFacility = async (id: string) => {
    setFacilities(prev => prev.filter(f => f.id !== id));
    if (currentFacilityId === id) {
      const next = facilities.find(f => f.id !== id);
      setCurrentFacilityId(next?.id || null);
    }
    await fetch(`/api/facilities/${id}`, { method: 'DELETE' });
  };

  const addUser = async (user: any) => {
    const id = crypto.randomUUID();
    const newUser = { ...user, id };
    setUsers(prev => [...prev, newUser]);
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    });
    return id;
  };

  const updateUserPermissions = async (userId: string, facilityIds: string[]) => {
    await fetch(`/api/users/${userId}/facilities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facilityIds })
    });
  };

  const fetchUserPermissions = async (userId: string) => {
    const res = await fetch(`/api/users/${userId}/facilities`);
    return await res.json();
  };

  const addAppointment = async (appointment: Omit<Appointment, 'id' | 'facilityId'>) => {
    if (!currentFacilityId) return;

    const id = crypto.randomUUID();
    const newAppointment = { ...appointment, id, facilityId: currentFacilityId } as Appointment;
    setAppointments(prev => [...prev, newAppointment]);
    
    fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAppointment)
    });
  };

  const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    // Optimistic Update
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    
    // PARTIAL UPDATE (Efficient / Non-wasting) - Matches D1 request
    fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  };

  const deleteAppointment = async (id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
    fetch(`/api/appointments/${id}`, { method: 'DELETE' });
  };

  const addResident = async (resident: Omit<Resident, 'id' | 'facilityId'>) => {
    if (!currentFacilityId) return;
    const id = crypto.randomUUID();
    const newResident = { ...resident, id, facilityId: currentFacilityId } as Resident;
    setResidents(prev => [...prev, newResident]);
    
    fetch('/api/residents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newResident)
    });
  };

  const updateResident = async (id: string, updates: Partial<Resident>) => {
    // Optimistic Update
    setResidents(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    
    fetch(`/api/residents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  };

  const deleteResident = async (id: string) => {
    setResidents(prev => prev.filter(r => r.id !== id));
    fetch(`/api/residents/${id}`, { method: 'DELETE' });
  };

  const batchAddResidents = async (newResidents: Omit<Resident, 'id' | 'facilityId'>[]) => {
    if (!currentFacilityId) return;
    const prepared = newResidents.map(r => ({ ...r, id: crypto.randomUUID(), facilityId: currentFacilityId })) as Resident[];
    setResidents(prev => [...prev, ...prepared]);
    
    for (const res of prepared) {
      fetch('/api/residents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(res)
      });
    }
  };

  const replaceResidents = async (newResidents: Omit<Resident, 'id' | 'facilityId'>[]) => {
    if (!currentFacilityId) return;
    const currentResidents = [...residents];
    const existingResidentsMap = new Map<string, Resident>();
    currentResidents.forEach(res => {
      const key = res.mrn !== '—' ? res.mrn : `${res.name}|${res.roomNumber}`.toLowerCase();
      existingResidentsMap.set(key, res);
    });

    const uniqueNewResidentsMap = new Map<string, Omit<Resident, 'id' | 'facilityId'>>();
    newResidents.forEach(res => {
      const key = res.mrn !== '—' ? res.mrn : `${res.name}|${res.roomNumber}`.toLowerCase();
      uniqueNewResidentsMap.set(key, res);
    });

    const merged = Array.from(uniqueNewResidentsMap.values()).map(newRes => {
      const key = newRes.mrn !== '—' ? newRes.mrn : `${newRes.name}|${newRes.roomNumber}`.toLowerCase();
      const existing = existingResidentsMap.get(key);

      if (existing) {
        return {
          ...newRes,
          id: existing.id,
          facilityId: currentFacilityId,
          notes: existing.notes || newRes.notes,
          lastVisit: existing.lastVisit || newRes.lastVisit
        } as Resident;
      }
      return { ...newRes, id: crypto.randomUUID(), facilityId: currentFacilityId } as Resident;
    });

    setResidents(merged);

    // Sync to DB
    for (const res of merged) {
       const key = res.mrn !== '—' ? res.mrn : `${res.name}|${res.roomNumber}`.toLowerCase();
       const existing = existingResidentsMap.get(key);
       if (existing) {
         fetch(`/api/residents/${res.id}`, {
           method: 'PATCH',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(res)
         });
       } else {
         fetch('/api/residents', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(res)
         });
       }
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

  return {
    facilities,
    currentFacilityId,
    setCurrentFacilityId,
    addFacility,
    updateFacility,
    deleteFacility,
    users,
    currentUser,
    addUser,
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
