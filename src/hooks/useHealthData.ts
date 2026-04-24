import { useState, useEffect } from 'react';
import { Appointment, Doctor, MedicalRecord, Resident } from '../types';

export function useHealthData() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedAppointments = localStorage.getItem('appointments');
    const savedDoctors = localStorage.getItem('doctors');
    const savedRecords = localStorage.getItem('records');
    const savedResidents = localStorage.getItem('residents');

    if (savedAppointments) setAppointments(JSON.parse(savedAppointments));
    if (savedDoctors) setDoctors(JSON.parse(savedDoctors));
    if (savedRecords) setRecords(JSON.parse(savedRecords));
    if (savedResidents) setResidents(JSON.parse(savedResidents));
    
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('appointments', JSON.stringify(appointments));
      localStorage.setItem('doctors', JSON.stringify(doctors));
      localStorage.setItem('records', JSON.stringify(records));
      localStorage.setItem('residents', JSON.stringify(residents));
    }
  }, [appointments, doctors, records, residents, isLoaded]);

  const addAppointment = (appointment: Omit<Appointment, 'id'>) => {
    const newAppointment = { ...appointment, id: crypto.randomUUID() };
    setAppointments(prev => [...prev, newAppointment]);
  };

  const updateAppointment = (id: string, updates: Partial<Appointment>) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteAppointment = (id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
  };

  const addDoctor = (doctor: Omit<Doctor, 'id'>) => {
    const newDoctor = { ...doctor, id: crypto.randomUUID() };
    setDoctors(prev => [...prev, newDoctor]);
  };

  const addRecord = (record: Omit<MedicalRecord, 'id'>) => {
    const newRecord = { ...record, id: crypto.randomUUID() };
    setRecords(prev => [...prev, newRecord]);
  };

  const addResident = (resident: Omit<Resident, 'id'>) => {
    const newResident = { ...resident, id: crypto.randomUUID() };
    setResidents(prev => [...prev, newResident]);
  };

  const updateResident = (id: string, updates: Partial<Resident>) => {
    setResidents(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteResident = (id: string) => {
    setResidents(prev => prev.filter(r => r.id !== id));
  };

  const batchAddResidents = (newResidents: Omit<Resident, 'id'>[]) => {
    const prepared = newResidents.map(r => ({ ...r, id: crypto.randomUUID() }));
    setResidents(prev => [...prev, ...prepared]);
  };

  const replaceResidents = (newResidents: Omit<Resident, 'id'>[]) => {
    setResidents(currentResidents => {
      // Create a map for quick lookup of existing residents to preserve their IDs
      const existingResidentsMap = new Map<string, Resident>();
      currentResidents.forEach(res => {
        const key = res.mrn !== '—' ? res.mrn : `${res.name}|${res.roomNumber}`.toLowerCase();
        existingResidentsMap.set(key, res);
      });

      // Filter newResidents for internal duplicates first (based on the same logic)
      const uniqueNewResidentsMap = new Map<string, Omit<Resident, 'id'>>();
      newResidents.forEach(res => {
        const key = res.mrn !== '—' ? res.mrn : `${res.name}|${res.roomNumber}`.toLowerCase();
        uniqueNewResidentsMap.set(key, res);
      });

      // Convert back to array and apply IDs
      const merged = Array.from(uniqueNewResidentsMap.values()).map(newRes => {
        const key = newRes.mrn !== '—' ? newRes.mrn : `${newRes.name}|${newRes.roomNumber}`.toLowerCase();
        const existing = existingResidentsMap.get(key);

        if (existing) {
          // Preserve the original ID so any references remain intact
          return {
            ...newRes,
            id: existing.id,
            // Preserve local notes or lastVisit if they exist but are missing in the new data
            notes: existing.notes || newRes.notes,
            lastVisit: existing.lastVisit || newRes.lastVisit
          };
        }

        // Entirely new resident
        return { ...newRes, id: crypto.randomUUID() };
      });

      return merged;
    });
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
