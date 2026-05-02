import type { Appointment } from "../types";
import { parseDateKeyAsLocalDate } from "./dateHelpers";

export const getAppointmentSortTime = (entry: Partial<Appointment>) => {
  const date = parseDateKeyAsLocalDate(entry.date);
  if (!date) return Number.MAX_SAFE_INTEGER;
  const rawTime = String(entry.time || "00:00");
  const [hours = "0", minutes = "0"] = rawTime.split(":");
  date.setHours(Number(hours) || 0, Number(minutes) || 0, 0, 0);
  return date.getTime();
};
