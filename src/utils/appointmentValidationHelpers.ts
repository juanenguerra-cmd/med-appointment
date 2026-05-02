import type { Appointment } from "../types";

export type AppointmentValidationIssue = {
  field: keyof Appointment | string;
  message: string;
  severity: "error" | "warning";
};

const clean = (value: unknown) => String(value ?? "").trim();

const hasValue = (value: unknown) => clean(value).length > 0;

export const validateAppointmentRequiredFields = (appointment: Partial<Appointment>): AppointmentValidationIssue[] => {
  const issues: AppointmentValidationIssue[] = [];

  if (!hasValue(appointment.residentName)) {
    issues.push({ field: "residentName", message: "Resident name is required.", severity: "error" });
  }

  if (!hasValue(appointment.type)) {
    issues.push({ field: "type", message: "Specialty/type is required.", severity: "error" });
  }

  if (!hasValue(appointment.status)) {
    issues.push({ field: "status", message: "Appointment status is required.", severity: "error" });
  }

  return issues;
};

export const validateAppointmentScheduleFields = (appointment: Partial<Appointment>): AppointmentValidationIssue[] => {
  const issues: AppointmentValidationIssue[] = [];
  const status = clean(appointment.status).toLowerCase();
  const pendingScheduling = status.includes("pending") || status.includes("scheduling review");

  if (!pendingScheduling && !hasValue(appointment.date)) {
    issues.push({ field: "date", message: "Appointment date is missing.", severity: "warning" });
  }

  if (!pendingScheduling && !hasValue(appointment.time)) {
    issues.push({ field: "time", message: "Appointment time is missing.", severity: "warning" });
  }

  if (hasValue(appointment.date) && !/^\d{4}-\d{2}-\d{2}/.test(clean(appointment.date))) {
    issues.push({ field: "date", message: "Appointment date should use YYYY-MM-DD format.", severity: "warning" });
  }

  return issues;
};

export const validateAppointmentTransportFields = (appointment: Partial<Appointment>): AppointmentValidationIssue[] => {
  const issues: AppointmentValidationIssue[] = [];
  const transportType = clean(appointment.transportType);
  const transportCompany = clean(appointment.transportCompany);

  if (transportType && !transportCompany) {
    issues.push({ field: "transportCompany", message: "Transportation type is selected but company is missing.", severity: "warning" });
  }

  if (transportCompany && !transportType) {
    issues.push({ field: "transportType", message: "Transportation company is selected but type is missing.", severity: "warning" });
  }

  return issues;
};

export const validateAppointment = (appointment: Partial<Appointment>): AppointmentValidationIssue[] => [
  ...validateAppointmentRequiredFields(appointment),
  ...validateAppointmentScheduleFields(appointment),
  ...validateAppointmentTransportFields(appointment),
];

export const hasAppointmentValidationErrors = (issues: AppointmentValidationIssue[]) =>
  issues.some((issue) => issue.severity === "error");

export const summarizeAppointmentValidation = (issues: AppointmentValidationIssue[]) => ({
  total: issues.length,
  errors: issues.filter((issue) => issue.severity === "error").length,
  warnings: issues.filter((issue) => issue.severity === "warning").length,
  canSave: !hasAppointmentValidationErrors(issues),
});
