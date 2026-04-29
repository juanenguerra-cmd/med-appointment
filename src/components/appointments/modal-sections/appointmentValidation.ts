import type { Appointment } from "../../../types";

export type AppointmentValidationResult = {
  isValid: boolean;
  errors: string[];
};

const hasValue = (value: unknown) => String(value ?? "").trim().length > 0;

export function validateAppointmentDraft(
  appointment: Partial<Appointment>,
): AppointmentValidationResult {
  const errors: string[] = [];

  if (!hasValue(appointment.residentName)) {
    errors.push("Resident name is required.");
  }

  if (!hasValue(appointment.type)) {
    errors.push("Appointment specialty is required.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
