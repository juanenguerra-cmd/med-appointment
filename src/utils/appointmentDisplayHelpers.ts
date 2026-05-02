import type { Appointment } from "../types";
import { parseDateKeyAsLocalDate } from "./dateHelpers";
import { getAppointmentStatusLabel } from "./appointmentStatusHelpers";

const clean = (value: unknown, fallback = "—") => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

export const formatAppointmentDate = (dateValue?: string) => {
  const date = parseDateKeyAsLocalDate(dateValue);
  if (!date) return clean(dateValue);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

export const formatAppointmentTime = (timeValue?: string) => clean(timeValue);

export const formatAppointmentDateTime = (appointment: Partial<Appointment>) => {
  const date = formatAppointmentDate(appointment.date);
  const time = formatAppointmentTime(appointment.time);
  if (date === "—" && time === "—") return "—";
  if (date === "—") return time;
  if (time === "—") return date;
  return `${date} at ${time}`;
};

export const getAppointmentResidentLabel = (appointment: Partial<Appointment>) => {
  const name = clean(appointment.residentName);
  const room = clean(appointment.roomNumber, "");
  const unit = clean(appointment.unit, "");
  const mrn = clean((appointment as any).residentMrn, "");
  const location = [unit, room].filter(Boolean).join(" / ");
  const parts = [name, location ? `(${location})` : "", mrn ? `MRN: ${mrn}` : ""].filter(Boolean);
  return parts.join(" ");
};

export const getAppointmentProviderLabel = (appointment: Partial<Appointment>) => {
  const provider = clean(appointment.providerName);
  const location = clean(appointment.location, "");
  if (provider === "—") return location || "—";
  return location ? `${provider} — ${location}` : provider;
};

export const getAppointmentTransportLabel = (appointment: Partial<Appointment>) => {
  const company = clean(appointment.transportCompany, "");
  const type = clean(appointment.transportType, "");
  const pickup = clean(appointment.pickUpTime, "");
  const pieces = [company, type, pickup ? `Pickup: ${pickup}` : ""].filter(Boolean);
  return pieces.length ? pieces.join(" • ") : "—";
};

export const getAppointmentSummaryLine = (appointment: Partial<Appointment>) => {
  const status = getAppointmentStatusLabel(appointment.status);
  const specialty = clean(appointment.type);
  const dateTime = formatAppointmentDateTime(appointment);
  return `${status} • ${specialty} • ${dateTime}`;
};
