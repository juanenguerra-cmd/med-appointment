import type { Appointment, Facility } from "../types";
import {
  appointmentReportColumnLabels,
  appointmentReportColumns,
  toAppointmentReportRows,
  type AppointmentReportRow,
} from "./appointmentReportHelpers";

export type AppointmentPrintHeader = {
  title: string;
  facilityName: string;
  generatedAt: string;
  dateRange?: string;
  filters?: string[];
};

const clean = (value: unknown, fallback = "—") => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

export const formatPrintGeneratedAt = (date = new Date()) =>
  date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export const createAppointmentPrintHeader = ({
  title = "Appointment Report",
  facility,
  generatedAt = new Date(),
  dateRange,
  filters = [],
}: {
  title?: string;
  facility?: Partial<Facility> | null;
  generatedAt?: Date;
  dateRange?: string;
  filters?: string[];
}): AppointmentPrintHeader => ({
  title,
  facilityName: clean(facility?.name, "Facility not selected"),
  generatedAt: formatPrintGeneratedAt(generatedAt),
  dateRange,
  filters: filters.filter(Boolean),
});

export const createAppointmentPrintRows = (appointments: Partial<Appointment>[]) =>
  toAppointmentReportRows(appointments);

export const createAppointmentPrintTable = (
  appointments: Partial<Appointment>[],
  columns: Array<keyof AppointmentReportRow> = appointmentReportColumns,
) => ({
  columns,
  labels: columns.map((column) => appointmentReportColumnLabels[column]),
  rows: createAppointmentPrintRows(appointments).map((row) => columns.map((column) => row[column])),
});

export const createAppointmentPrintSummary = (appointments: Partial<Appointment>[]) => ({
  totalAppointments: appointments.length,
  generatedAt: formatPrintGeneratedAt(),
});
