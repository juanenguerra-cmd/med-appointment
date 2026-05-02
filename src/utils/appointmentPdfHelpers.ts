import type { Appointment, Facility } from "../types";
import {
  createAppointmentPrintHeader,
  createAppointmentPrintSummary,
  createAppointmentPrintTable,
  type AppointmentPrintHeader,
} from "./appointmentPrintHelpers";
import type { AppointmentReportRow } from "./appointmentReportHelpers";

export type AppointmentPdfPayload = {
  header: AppointmentPrintHeader;
  summary: {
    totalAppointments: number;
    generatedAt: string;
  };
  table: {
    columns: Array<keyof AppointmentReportRow>;
    labels: string[];
    rows: string[][];
  };
};

export const createAppointmentPdfPayload = ({
  appointments,
  facility,
  title = "Appointment Report",
  dateRange,
  filters = [],
  columns,
}: {
  appointments: Partial<Appointment>[];
  facility?: Partial<Facility> | null;
  title?: string;
  dateRange?: string;
  filters?: string[];
  columns?: Array<keyof AppointmentReportRow>;
}): AppointmentPdfPayload => ({
  header: createAppointmentPrintHeader({
    title,
    facility,
    dateRange,
    filters,
  }),
  summary: createAppointmentPrintSummary(appointments),
  table: createAppointmentPrintTable(appointments, columns),
});

export const createAppointmentPdfFilename = (baseName = "appointment_report", date = new Date()) => {
  const stamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const safeBase = baseName.trim().replace(/[^a-z0-9-_]+/gi, "_").replace(/^_+|_+$/g, "") || "appointment_report";
  return `${safeBase}_${stamp}.pdf`;
};

export const createAppointmentPdfFooter = (pageNumber: number, totalPages?: number) => {
  const pageText = totalPages ? `Page ${pageNumber} of ${totalPages}` : `Page ${pageNumber}`;
  return pageText;
};
