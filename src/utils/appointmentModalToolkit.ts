export {
  createNewAppointmentDraft,
  createDuplicateAppointmentDraft,
  createEditAppointmentDraft,
  isOtherSpecialty,
  resolveResidentUnit,
  applyResidentToAppointmentDraft,
} from "./appointmentDraftHelpers";

export {
  appointmentMatchesResident,
  filterAppointmentsForResident,
} from "./residentAppointmentMatching";

export { getAppointmentSortTime } from "./scheduleTime";

export {
  getAppointmentStatusGroup,
  isPendingSchedulingReview,
  isActiveAppointmentStatus,
  getAppointmentStatusLabel,
  getAppointmentStatusBadgeClass,
  getAppointmentStatusSortWeight,
} from "./appointmentStatusHelpers";

export type { AppointmentStatusGroup } from "./appointmentStatusHelpers";

export {
  appointmentSearchText,
  isAppointmentWithinDateRange,
  appointmentMatchesFilters,
  filterAppointments,
} from "./appointmentFilterHelpers";

export type { AppointmentFilterOptions } from "./appointmentFilterHelpers";

export {
  compareAppointmentsByDateAsc,
  compareAppointmentsByDateDesc,
  compareAppointmentsByStatusPriority,
  sortAppointments,
} from "./appointmentSortHelpers";

export type { AppointmentSortMode } from "./appointmentSortHelpers";

export {
  formatAppointmentDate,
  formatAppointmentTime,
  formatAppointmentDateTime,
  getAppointmentResidentLabel,
  getAppointmentProviderLabel,
  getAppointmentTransportLabel,
  getAppointmentSummaryLine,
} from "./appointmentDisplayHelpers";

export {
  toAppointmentReportRow,
  toAppointmentReportRows,
  appointmentReportColumns,
  appointmentReportColumnLabels,
} from "./appointmentReportHelpers";

export type { AppointmentReportRow } from "./appointmentReportHelpers";

export {
  countAppointmentsByStatusGroup,
  countAppointmentsBySpecialty,
  countAppointmentsByUnit,
  countAppointmentsByProvider,
  countAppointmentsByTransportCompany,
  mapToSortedCountRows,
  getAppointmentAnalyticsSummary,
} from "./appointmentAnalyticsHelpers";

export type { AppointmentCountMap } from "./appointmentAnalyticsHelpers";

export {
  toAppointmentTableRow,
  toAppointmentTableRows,
  buildAppointmentTableRows,
} from "./appointmentTableHelpers";

export type { AppointmentTableRow } from "./appointmentTableHelpers";

export {
  getAppointmentDateKey,
  formatCalendarDayLabel,
  groupAppointmentsByDate,
  getAppointmentsForDate,
  getCalendarSummary,
} from "./appointmentCalendarHelpers";

export type { AppointmentCalendarDay } from "./appointmentCalendarHelpers";
