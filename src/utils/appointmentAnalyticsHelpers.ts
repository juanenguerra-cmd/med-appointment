import type { Appointment } from "../types";
import { getAppointmentStatusGroup } from "./appointmentStatusHelpers";

export type AppointmentCountMap = Record<string, number>;

const clean = (value: unknown, fallback = "Unknown") => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

const increment = (map: AppointmentCountMap, key: string) => {
  map[key] = (map[key] || 0) + 1;
  return map;
};

export const countAppointmentsByStatusGroup = (appointments: Partial<Appointment>[]) =>
  appointments.reduce<AppointmentCountMap>((map, appointment) => {
    const group = getAppointmentStatusGroup(appointment.status);
    return increment(map, group);
  }, {});

export const countAppointmentsBySpecialty = (appointments: Partial<Appointment>[]) =>
  appointments.reduce<AppointmentCountMap>((map, appointment) => {
    return increment(map, clean(appointment.type));
  }, {});

export const countAppointmentsByUnit = (appointments: Partial<Appointment>[]) =>
  appointments.reduce<AppointmentCountMap>((map, appointment) => {
    return increment(map, clean(appointment.unit));
  }, {});

export const countAppointmentsByProvider = (appointments: Partial<Appointment>[]) =>
  appointments.reduce<AppointmentCountMap>((map, appointment) => {
    return increment(map, clean(appointment.providerName));
  }, {});

export const countAppointmentsByTransportCompany = (appointments: Partial<Appointment>[]) =>
  appointments.reduce<AppointmentCountMap>((map, appointment) => {
    return increment(map, clean(appointment.transportCompany));
  }, {});

export const mapToSortedCountRows = (map: AppointmentCountMap) =>
  Object.entries(map)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

export const getAppointmentAnalyticsSummary = (appointments: Partial<Appointment>[]) => ({
  total: appointments.length,
  byStatusGroup: countAppointmentsByStatusGroup(appointments),
  bySpecialty: countAppointmentsBySpecialty(appointments),
  byUnit: countAppointmentsByUnit(appointments),
  byProvider: countAppointmentsByProvider(appointments),
  byTransportCompany: countAppointmentsByTransportCompany(appointments),
});
