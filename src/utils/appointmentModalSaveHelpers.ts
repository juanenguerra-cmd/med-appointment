import type { Appointment } from "../types";
import {
  getAppointmentModalSafetyMessages,
  getAppointmentModalSafetySummary,
} from "./appointmentModalSafetyHelpers";
import type { AppointmentDuplicateCheckOptions } from "./appointmentDuplicateHelpers";
import type { AppointmentModalMode } from "./appointmentModalWorkflowHelpers";

export type AppointmentModalSavePayload = {
  mode: AppointmentModalMode;
  appointment: Partial<Appointment>;
  canSave: boolean;
  safetyMessages: string[];
  duplicateCount: number;
  validationErrorCount: number;
  validationWarningCount: number;
};

const clean = (value: unknown) => String(value ?? "").trim();

export const normalizeAppointmentDraftForSave = (draft: Partial<Appointment>): Partial<Appointment> => {
  const normalized: Partial<Appointment> = { ...draft };

  Object.entries(normalized).forEach(([key, value]) => {
    if (typeof value === "string") {
      (normalized as Record<string, unknown>)[key] = value.trim();
    }
  });

  return {
    ...normalized,
    status: clean(normalized.status) || "Scheduled",
  };
};

export const createAppointmentModalSavePayload = ({
  mode,
  draft,
  existingAppointments = [],
  duplicateOptions = {},
}: {
  mode: AppointmentModalMode;
  draft: Partial<Appointment>;
  existingAppointments?: Partial<Appointment>[];
  duplicateOptions?: AppointmentDuplicateCheckOptions;
}): AppointmentModalSavePayload => {
  const appointment = normalizeAppointmentDraftForSave(draft);
  const safetySummary = getAppointmentModalSafetySummary(appointment, existingAppointments, duplicateOptions);

  return {
    mode,
    appointment,
    canSave: safetySummary.canSave,
    safetyMessages: getAppointmentModalSafetyMessages(safetySummary),
    duplicateCount: safetySummary.duplicateCount,
    validationErrorCount: safetySummary.validationSummary.errors,
    validationWarningCount: safetySummary.validationSummary.warnings,
  };
};

export const shouldBlockAppointmentSave = (payload: AppointmentModalSavePayload) => !payload.canSave;
