import type { Appointment } from "../types";
import {
  getAppointmentModalSafetyMessages,
  getAppointmentModalSafetySummary,
} from "./appointmentModalSafetyHelpers";
import type { AppointmentDuplicateCheckOptions } from "./appointmentDuplicateHelpers";
import type { AppointmentModalWorkflowState } from "./appointmentModalWorkflowHelpers";

export type AppointmentDraftField = keyof Appointment | string;

export const updateAppointmentDraftField = (
  draft: Partial<Appointment>,
  field: AppointmentDraftField,
  value: unknown,
): Partial<Appointment> => ({
  ...draft,
  [field]: value,
});

export const updateAppointmentDraftFields = (
  draft: Partial<Appointment>,
  updates: Record<string, unknown>,
): Partial<Appointment> => ({
  ...draft,
  ...updates,
});

export const updateAppointmentModalWorkflowField = (
  state: AppointmentModalWorkflowState,
  field: AppointmentDraftField,
  value: unknown,
  existingAppointments: Partial<Appointment>[] = [],
  duplicateOptions: AppointmentDuplicateCheckOptions = {},
): AppointmentModalWorkflowState => {
  const draft = updateAppointmentDraftField(state.draft, field, value);
  const safetySummary = getAppointmentModalSafetySummary(draft, existingAppointments, duplicateOptions);

  return {
    ...state,
    draft,
    safetySummary,
    safetyMessages: getAppointmentModalSafetyMessages(safetySummary),
  };
};

export const updateAppointmentModalWorkflowFields = (
  state: AppointmentModalWorkflowState,
  updates: Record<string, unknown>,
  existingAppointments: Partial<Appointment>[] = [],
  duplicateOptions: AppointmentDuplicateCheckOptions = {},
): AppointmentModalWorkflowState => {
  const draft = updateAppointmentDraftFields(state.draft, updates);
  const safetySummary = getAppointmentModalSafetySummary(draft, existingAppointments, duplicateOptions);

  return {
    ...state,
    draft,
    safetySummary,
    safetyMessages: getAppointmentModalSafetyMessages(safetySummary),
  };
};
