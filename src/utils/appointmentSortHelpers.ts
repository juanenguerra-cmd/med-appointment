import type { Appointment } from "../types";
import { getAppointmentSortTime } from "./scheduleTime";
import { getAppointmentStatusSortWeight } from "./appointmentStatusHelpers";

export type AppointmentSortMode =
  | "date-asc"
  | "date-desc"
  | "status-priority"
  | "resident-asc"
  | "specialty-asc"
  | "provider-asc";

const textValue = (value: unknown) => String(value || "").trim().toLowerCase();

export const compareAppointmentsByDateAsc = (a: Partial<Appointment>, b: Partial<Appointment>) => {
  const dateCompare = getAppointmentSortTime(a) - getAppointmentSortTime(b);
  if (dateCompare !== 0) return dateCompare;
  return textValue(a.residentName).localeCompare(textValue(b.residentName));
};

export const compareAppointmentsByDateDesc = (a: Partial<Appointment>, b: Partial<Appointment>) => {
  const dateCompare = getAppointmentSortTime(b) - getAppointmentSortTime(a);
  if (dateCompare !== 0) return dateCompare;
  return textValue(a.residentName).localeCompare(textValue(b.residentName));
};

export const compareAppointmentsByStatusPriority = (a: Partial<Appointment>, b: Partial<Appointment>) => {
  const statusCompare = getAppointmentStatusSortWeight(a.status) - getAppointmentStatusSortWeight(b.status);
  if (statusCompare !== 0) return statusCompare;
  return compareAppointmentsByDateAsc(a, b);
};

export const sortAppointments = (
  appointments: Partial<Appointment>[],
  sortMode: AppointmentSortMode = "date-asc",
) => appointments.slice().sort((a, b) => {
  switch (sortMode) {
    case "date-desc":
      return compareAppointmentsByDateDesc(a, b);
    case "status-priority":
      return compareAppointmentsByStatusPriority(a, b);
    case "resident-asc": {
      const compare = textValue(a.residentName).localeCompare(textValue(b.residentName));
      return compare || compareAppointmentsByDateAsc(a, b);
    }
    case "specialty-asc": {
      const compare = textValue(a.type).localeCompare(textValue(b.type));
      return compare || compareAppointmentsByDateAsc(a, b);
    }
    case "provider-asc": {
      const compare = textValue(a.providerName).localeCompare(textValue(b.providerName));
      return compare || compareAppointmentsByDateAsc(a, b);
    }
    case "date-asc":
    default:
      return compareAppointmentsByDateAsc(a, b);
  }
});
