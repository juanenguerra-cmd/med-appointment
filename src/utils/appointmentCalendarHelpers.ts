import type { Appointment } from "../types";
import { sortAppointments } from "./appointmentSortHelpers";

export type AppointmentCalendarDay = {
  dateKey: string;
  label: string;
  appointments: Partial<Appointment>[];
  count: number;
};

const clean = (value: unknown, fallback = "Unscheduled") => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

export const getAppointmentDateKey = (appointment: Partial<Appointment>) => clean(appointment.date);

export const formatCalendarDayLabel = (dateKey: string) => {
  if (!dateKey || dateKey === "Unscheduled") return "Unscheduled";
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) return dateKey;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

export const groupAppointmentsByDate = (appointments: Partial<Appointment>[]) => {
  const grouped = appointments.reduce<Record<string, Partial<Appointment>[]>>((map, appointment) => {
    const dateKey = getAppointmentDateKey(appointment);
    if (!map[dateKey]) map[dateKey] = [];
    map[dateKey].push(appointment);
    return map;
  }, {});

  return Object.entries(grouped)
    .map(([dateKey, entries]) => ({
      dateKey,
      label: formatCalendarDayLabel(dateKey),
      appointments: sortAppointments(entries, "date-asc"),
      count: entries.length,
    }))
    .sort((a, b) => {
      if (a.dateKey === "Unscheduled") return 1;
      if (b.dateKey === "Unscheduled") return -1;
      return a.dateKey.localeCompare(b.dateKey);
    });
};

export const getAppointmentsForDate = (appointments: Partial<Appointment>[], dateKey: string) =>
  sortAppointments(appointments.filter((appointment) => getAppointmentDateKey(appointment) === dateKey), "date-asc");

export const getCalendarSummary = (appointments: Partial<Appointment>[]) => {
  const days = groupAppointmentsByDate(appointments);
  return {
    totalAppointments: appointments.length,
    totalDays: days.length,
    days,
  };
};
