import type { Appointment } from "../types";
import {
  formatAppointmentDate,
  formatAppointmentTime,
  getAppointmentProviderLabel,
  getAppointmentResidentLabel,
  getAppointmentTransportLabel,
} from "./appointmentDisplayHelpers";
import { getAppointmentStatusLabel } from "./appointmentStatusHelpers";

export type AppointmentReportRow = {
  date: string;
  time: string;
  resident: string;
  unit: string;
  room: string;
  specialty: string;
  providerLocation: string;
  status: string;
  transport: string;
  notes: string;
};

const clean = (value: unknown, fallback = "—") => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

export const toAppointmentReportRow = (appointment: Partial<Appointment>): AppointmentReportRow => ({
  date: formatAppointmentDate(appointment.date),
  time: formatAppointmentTime(appointment.time),
  resident: getAppointmentResidentLabel(appointment),
  unit: clean(appointment.unit),
  room: clean(appointment.roomNumber),
  specialty: clean(appointment.type),
  providerLocation: getAppointmentProviderLabel(appointment),
  status: getAppointmentStatusLabel(appointment.status),
  transport: getAppointmentTransportLabel(appointment),
  notes: clean(appointment.notes, ""),
});

export const toAppointmentReportRows = (appointments: Partial<Appointment>[]) =>
  appointments.map(toAppointmentReportRow);

export const appointmentReportColumns: Array<keyof AppointmentReportRow> = [
  "date",
  "time",
  "resident",
  "unit",
  "room",
  "specialty",
  "providerLocation",
  "status",
  "transport",
  "notes",
];

export const appointmentReportColumnLabels: Record<keyof AppointmentReportRow, string> = {
  date: "Date",
  time: "Time",
  resident: "Resident",
  unit: "Unit",
  room: "Room",
  specialty: "Specialty",
  providerLocation: "Provider / Location",
  status: "Status",
  transport: "Transportation",
  notes: "Notes",
};
