import type { Appointment } from "../types";
import {
  findPotentialDuplicateAppointments,
  type AppointmentDuplicateCheckOptions,
} from "./appointmentDuplicateHelpers";
import {
  summarizeAppointmentValidation,
  validateAppointment,
  type AppointmentValidationIssue,
} from "./appointmentValidationHelpers";

export type AppointmentModalSafetySummary = {
  validationIssues: AppointmentValidationIssue[];
  validationSummary: ReturnType<typeof summarizeAppointmentValidation>;
  duplicateAppointments: Partial<Appointment>[];
  duplicateCount: number;
  hasDuplicates: boolean;
  canSave: boolean;
};

export const getAppointmentModalSafetySummary = (
  appointment: Partial<Appointment>,
  existingAppointments: Partial<Appointment>[] = [],
  duplicateOptions: AppointmentDuplicateCheckOptions = {},
): AppointmentModalSafetySummary => {
  const validationIssues = validateAppointment(appointment);
  const validationSummary = summarizeAppointmentValidation(validationIssues);
  const duplicateAppointments = findPotentialDuplicateAppointments(
    appointment,
    existingAppointments,
    duplicateOptions,
  );

  return {
    validationIssues,
    validationSummary,
    duplicateAppointments,
    duplicateCount: duplicateAppointments.length,
    hasDuplicates: duplicateAppointments.length > 0,
    canSave: validationSummary.canSave,
  };
};

export const getAppointmentModalSafetyMessages = (summary: AppointmentModalSafetySummary) => {
  const messages: string[] = [];

  if (summary.validationSummary.errors > 0) {
    messages.push(`${summary.validationSummary.errors} required item(s) need attention before saving.`);
  }

  if (summary.validationSummary.warnings > 0) {
    messages.push(`${summary.validationSummary.warnings} warning(s) should be reviewed.`);
  }

  if (summary.hasDuplicates) {
    messages.push(`${summary.duplicateCount} possible duplicate appointment(s) found.`);
  }

  return messages;
};
