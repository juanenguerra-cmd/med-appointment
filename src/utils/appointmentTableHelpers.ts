import type { Appointment } from "../types";
import {
  formatAppointmentDateTime,
  getAppointmentProviderLabel,
  getAppointmentResidentLabel,
  getAppointmentTransportLabel,
} from "./appointmentDisplayHelpers";
import {
  getAppointmentStatusBadgeClass,
  getAppointmentStatusLabel,
} from "./appointmentStatusHelpers";
import {
  filterAppointments,
  type AppointmentFilterOptions,
} from "./appointmentFilterHelpers";
import {
  sortAppointments,
  type AppointmentSortMode,
} from "./appointmentSortHelpers";

export type AppointmentTableRow = {
  id: string;
  dateTime: string;
  resident: string;
  specialty: string;
  providerLocation: string;
  status: string;
  statusBadgeClass: string;
  transport: string;
  original: Partial<Appointment>;
};

const clean = (value: unknown, fallback = "—") => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

export const toAppointmentTableRow = (appointment: Partial<Appointment>): AppointmentTableRow => ({
  id: clean(appointment.id, `${appointment.residentName || "appointment"}-${appointment.date || "date"}-${appointment.time || "time"}`),
  dateTime: formatAppointmentDateTime(appointment),
  resident: getAppointmentResidentLabel(appointment),
  specialty: clean(appointment.type),
  providerLocation: getAppointmentProviderLabel(appointment),
  status: getAppointmentStatusLabel(appointment.status),
  statusBadgeClass: getAppointmentStatusBadgeClass(appointment.status),
  transport: getAppointmentTransportLabel(appointment),
  original: appointment,
});

export const toAppointmentTableRows = (appointments: Partial<Appointment>[]) =>
  appointments.map(toAppointmentTableRow);

export const buildAppointmentTableRows = (
  appointments: Partial<Appointment>[],
  filters: AppointmentFilterOptions = {},
  sortMode: AppointmentSortMode = "date-asc",
) => toAppointmentTableRows(sortAppointments(filterAppointments(appointments, filters), sortMode));
