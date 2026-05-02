import type { Appointment } from "../types";
import { parseDateKeyAsLocalDate } from "./dateHelpers";
import { getAppointmentStatusGroup } from "./appointmentStatusHelpers";

export type AppointmentFilterOptions = {
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  specialty?: string;
  unit?: string;
  transportCompany?: string;
  providerName?: string;
};

const clean = (value: unknown) => String(value || "").trim();
const lower = (value: unknown) => clean(value).toLowerCase();
const isAll = (value: unknown) => {
  const text = lower(value);
  return !text || text === "all" || text === "any";
};

export const appointmentSearchText = (appointment: Partial<Appointment>) => [
  appointment.residentName,
  appointment.residentMrn,
  appointment.providerName,
  appointment.location,
  appointment.type,
  appointment.description,
  appointment.status,
  appointment.unit,
  appointment.roomNumber,
  appointment.transportCompany,
  appointment.notes,
].map((value) => clean(value)).filter(Boolean).join(" ").toLowerCase();

export const isAppointmentWithinDateRange = (
  appointment: Partial<Appointment>,
  startDate?: string,
  endDate?: string,
) => {
  const appointmentDate = parseDateKeyAsLocalDate(appointment.date);
  if (!appointmentDate) return false;

  const start = parseDateKeyAsLocalDate(startDate);
  const end = parseDateKeyAsLocalDate(endDate);

  if (start && appointmentDate < start) return false;
  if (end && appointmentDate > end) return false;
  return true;
};

export const appointmentMatchesFilters = (
  appointment: Partial<Appointment>,
  filters: AppointmentFilterOptions = {},
) => {
  const search = lower(filters.search);
  if (search && !appointmentSearchText(appointment).includes(search)) return false;

  if ((filters.startDate || filters.endDate) && !isAppointmentWithinDateRange(appointment, filters.startDate, filters.endDate)) {
    return false;
  }

  if (!isAll(filters.status)) {
    const filterStatus = lower(filters.status);
    const appointmentStatus = lower(appointment.status);
    const appointmentStatusGroup = getAppointmentStatusGroup(appointment.status);
    if (appointmentStatus !== filterStatus && appointmentStatusGroup !== filterStatus) return false;
  }

  if (!isAll(filters.specialty) && lower(appointment.type) !== lower(filters.specialty)) return false;
  if (!isAll(filters.unit) && lower(appointment.unit) !== lower(filters.unit)) return false;
  if (!isAll(filters.transportCompany) && lower(appointment.transportCompany) !== lower(filters.transportCompany)) return false;
  if (!isAll(filters.providerName) && lower(appointment.providerName) !== lower(filters.providerName)) return false;

  return true;
};

export const filterAppointments = (
  appointments: Partial<Appointment>[],
  filters: AppointmentFilterOptions = {},
) => appointments.filter((appointment) => appointmentMatchesFilters(appointment, filters));
