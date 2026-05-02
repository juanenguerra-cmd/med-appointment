import type { Appointment, Resident } from "../types";
import {
  applyResidentToAppointmentDraft,
  createDuplicateAppointmentDraft,
  createEditAppointmentDraft,
  createNewAppointmentDraft,
} from "./appointmentDraftHelpers";
import {
  getAppointmentModalSafetySummary,
  getAppointmentModalSafetyMessages,
} from "./appointmentModalSafetyHelpers";
import type { AppointmentDuplicateCheckOptions } from "./appointmentDuplicateHelpers";

export type AppointmentModalMode = "new" | "edit" | "duplicate";

export type AppointmentModalWorkflowState = {
  mode: AppointmentModalMode;
  draft: Partial<Appointment>;
  safetySummary: ReturnType<typeof getAppointmentModalSafetySummary>;
  safetyMessages: string[];
};

export const createAppointmentModalDraft = (
  mode: AppointmentModalMode,
  appointment?: Appointment | null,
): Partial<Appointment> => {
  if (mode === "edit" && appointment) return createEditAppointmentDraft(appointment);
  if (mode === "duplicate" && appointment) return createDuplicateAppointmentDraft(appointment);
  return createNewAppointmentDraft();
};

export const createAppointmentModalWorkflowState = ({
  mode,
  appointment,
  existingAppointments = [],
  duplicateOptions = {},
}: {
  mode: AppointmentModalMode;
  appointment?: Appointment | null;
  existingAppointments?: Partial<Appointment>[];
  duplicateOptions?: AppointmentDuplicateCheckOptions;
}): AppointmentModalWorkflowState => {
  const draft = createAppointmentModalDraft(mode, appointment);
  const safetySummary = getAppointmentModalSafetySummary(draft, existingAppointments, duplicateOptions);

  return {
    mode,
    draft,
    safetySummary,
    safetyMessages: getAppointmentModalSafetyMessages(safetySummary),
  };
};

export const applyResidentToAppointmentModalWorkflowState = (
  state: AppointmentModalWorkflowState,
  resident: Resident,
  existingAppointments: Partial<Appointment>[] = [],
  duplicateOptions: AppointmentDuplicateCheckOptions = {},
): AppointmentModalWorkflowState => {
  const draft = applyResidentToAppointmentDraft(state.draft, resident);
  const safetySummary = getAppointmentModalSafetySummary(draft, existingAppointments, duplicateOptions);

  return {
    ...state,
    draft,
    safetySummary,
    safetyMessages: getAppointmentModalSafetyMessages(safetySummary),
  };
};
