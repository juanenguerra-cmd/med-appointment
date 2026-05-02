import type { Appointment } from "../types";
import {
  appointmentReportColumns,
  appointmentReportColumnLabels,
  toAppointmentReportRows,
  type AppointmentReportRow,
} from "./appointmentReportHelpers";

const escapeCsvValue = (value: unknown) => {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

export const appointmentReportRowsToCsv = (
  rows: AppointmentReportRow[],
  columns: Array<keyof AppointmentReportRow> = appointmentReportColumns,
) => {
  const header = columns.map((column) => escapeCsvValue(appointmentReportColumnLabels[column])).join(",");
  const body = rows.map((row) => columns.map((column) => escapeCsvValue(row[column])).join(","));
  return [header, ...body].join("\n");
};

export const appointmentsToCsv = (
  appointments: Partial<Appointment>[],
  columns: Array<keyof AppointmentReportRow> = appointmentReportColumns,
) => appointmentReportRowsToCsv(toAppointmentReportRows(appointments), columns);

export const createCsvFilename = (baseName = "appointments", date = new Date()) => {
  const stamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const safeBase = baseName.trim().replace(/[^a-z0-9-_]+/gi, "_").replace(/^_+|_+$/g, "") || "appointments";
  return `${safeBase}_${stamp}.csv`;
};

export const createCsvDownloadBlob = (csv: string) =>
  new Blob([csv], { type: "text/csv;charset=utf-8;" });
