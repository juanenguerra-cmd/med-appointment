import type { Appointment } from "../types";

export type AppointmentDuplicateCheckOptions = {
  ignoreAppointmentId?: string;
  sameResidentOnly?: boolean;
};

const clean = (value: unknown) => String(value ?? "").trim();
const lower = (value: unknown) => clean(value).toLowerCase();

const sameValue = (a: unknown, b: unknown) => lower(a) === lower(b);

export const getAppointmentDuplicateKey = (appointment: Partial<Appointment>) => [
  lower((appointment as any).residentId || appointment.residentName),
  lower((appointment as any).residentMrn),
  lower(appointment.date),
  lower(appointment.time),
  lower(appointment.type),
  lower(appointment.providerName),
  lower(appointment.location),
].join("|");

export const areAppointmentsPotentialDuplicates = (
  a: Partial<Appointment>,
  b: Partial<Appointment>,
  options: AppointmentDuplicateCheckOptions = {},
) => {
  if (options.ignoreAppointmentId && clean(a.id) && clean(a.id) === options.ignoreAppointmentId) return false;
  if (options.ignoreAppointmentId && clean(b.id) && clean(b.id) === options.ignoreAppointmentId) return false;

  const sameResidentId = clean((a as any).residentId) && clean((a as any).residentId) === clean((b as any).residentId);
  const sameMrn = clean((a as any).residentMrn) && sameValue((a as any).residentMrn, (b as any).residentMrn);
  const sameResidentName = sameValue(a.residentName, b.residentName);
  const sameResident = Boolean(sameResidentId || sameMrn || sameResidentName);

  if (options.sameResidentOnly && !sameResident) return false;
  if (!sameResident) return false;

  const sameDate = sameValue(a.date, b.date);
  const sameTime = sameValue(a.time, b.time);
  const sameSpecialty = sameValue(a.type, b.type);
  const sameProvider = sameValue(a.providerName, b.providerName);
  const sameLocation = sameValue(a.location, b.location);

  return sameDate && sameTime && sameSpecialty && (sameProvider || sameLocation);
};

export const findPotentialDuplicateAppointments = (
  appointment: Partial<Appointment>,
  existingAppointments: Partial<Appointment>[],
  options: AppointmentDuplicateCheckOptions = {},
) => existingAppointments.filter((existing) => areAppointmentsPotentialDuplicates(appointment, existing, options));

export const hasPotentialDuplicateAppointment = (
  appointment: Partial<Appointment>,
  existingAppointments: Partial<Appointment>[],
  options: AppointmentDuplicateCheckOptions = {},
) => findPotentialDuplicateAppointments(appointment, existingAppointments, options).length > 0;
