import { useState, useEffect } from 'react';
import { Appointment, Doctor, MedicalRecord, Resident } from '../types';

export function useHealthData() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initial Fetch from SQLite / API (Simulation of Cloudflare D1)
  useEffect(() => {
    async function fetchData() {
      try {
        const [resResidents, resAppointments] = await Promise.all([
          fetch('/api/residents'),
          fetch('/api/appointments')
        ]);
        
        if (resResidents.ok) setResidents(await resResidents.json());
        if (resAppointments.ok) setAppointments(await resAppointments.json());
        
        // Doctors and Records still in local storage for now, or could be moved too
        const savedDoctors = localStorage.getItem('doctors');
        const savedRecords = localStorage.getItem('records');
        if (savedDoctors) setDoctors(JSON.parse(savedDoctors));
        if (savedRecords) setRecords(JSON.parse(savedRecords));

        setIsLoaded(true);
      } catch (error) {
        console.error("Failed to fetch data from API:", error);
        setIsLoaded(true); // Still set loaded to allow UI interaction
      }
    }
    fetchData();
  }, []);

  // Persist doctors/records to localStorage as they aren't in DB yet
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('doctors', JSON.stringify(doctors));
      localStorage.setItem('records', JSON.stringify(records));
    }
  }, [doctors, records, isLoaded]);

  const addAppointment = async (appointment: Omit<Appointment, 'id'>) => {
    const id = crypto.randomUUID();
    const newAppointment = { ...appointment, id };
    setAppointments(prev => [...prev, newAppointment]);
    
    // Non-blocking save to background DB
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

  const addResident = async (resident: Omit<Resident, 'id'>) => {
    const id = crypto.randomUUID();
    const newResident = { ...resident, id };
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
    
    // PARTIAL UPDATE (Efficient / Non-wasting) - Matches D1 request
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

  const batchAddResidents = async (newResidents: Omit<Resident, 'id'>[]) => {
    const prepared = newResidents.map(r => ({ ...r, id: crypto.randomUUID() }));
    setResidents(prev => [...prev, ...prepared]);
    
    for (const res of prepared) {
      fetch('/api/residents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(res)
      });
    }
  };

  const replaceResidents = async (newResidents: Omit<Resident, 'id'>[]) => {
    const currentResidents = [...residents];
    const existingResidentsMap = new Map<string, Resident>();
    currentResidents.forEach(res => {
      const key = res.mrn !== '—' ? res.mrn : `${res.name}|${res.roomNumber}`.toLowerCase();
      existingResidentsMap.set(key, res);
    });

    const uniqueNewResidentsMap = new Map<string, Omit<Resident, 'id'>>();
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
          notes: existing.notes || newRes.notes,
          lastVisit: existing.lastVisit || newRes.lastVisit
        } as Resident;
      }
      return { ...newRes, id: crypto.randomUUID() } as Resident;
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
