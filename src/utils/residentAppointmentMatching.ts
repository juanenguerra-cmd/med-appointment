import type { Appointment, Resident } from "../types";
import { safeLower } from "./stringHelpers";

const clean = (value: unknown) => String(value || "").trim();

export const appointmentMatchesResident = (appointment: Partial<Appointment>, resident: Partial<Resident>) => {
  const appointmentResidentId = clean((appointment as any).residentId);
  const appointmentResidentMrn = safeLower((appointment as any).residentMrn);
  const appointmentNotes = safeLower(appointment.notes);
  const appointmentName = safeLower(appointment.residentName);

  const residentId = clean(resident.id);
  const residentMrn = safeLower(resident.mrn);
  const firstName = safeLower(resident.firstName);
  const lastName = safeLower(resident.lastName);
  const fullName = safeLower(resident.name);

  if (appointmentResidentId && residentId && appointmentResidentId === residentId) return true;
  if (appointmentResidentMrn && residentMrn && appointmentResidentMrn === residentMrn) return true;
  if (residentMrn && appointmentNotes.includes(residentMrn)) return true;
  if (fullName && appointmentName === fullName) return true;
  if (firstName && lastName && appointmentName.includes(firstName) && appointmentName.includes(lastName)) return true;

  return false;
};

export const filterAppointmentsForResident = (appointments: Partial<Appointment>[], resident: Partial<Resident> | null | undefined) => {
  if (!resident) return [];
  return appointments.filter((appointment) => appointmentMatchesResident(appointment, resident));
};
