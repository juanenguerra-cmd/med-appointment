import type { Appointment } from "../types";

export type AppointmentStatusGroup =
  | "scheduled"
  | "pending"
  | "completed"
  | "cancelled"
  | "rescheduled"
  | "unknown";

const normalize = (value: unknown) => String(value || "").trim().toLowerCase();

export const getAppointmentStatusGroup = (status: unknown): AppointmentStatusGroup => {
  const value = normalize(status);
  if (!value) return "unknown";
  if (value.includes("pending")) return "pending";
  if (value.includes("complete") || value.includes("done")) return "completed";
  if (value.includes("cancel")) return "cancelled";
  if (value.includes("resched")) return "rescheduled";
  if (value.includes("sched")) return "scheduled";
  return "unknown";
};

export const isPendingSchedulingReview = (appointment: Partial<Appointment>) => {
  const status = normalize(appointment.status);
  return status.includes("pending") || status.includes("scheduling review");
};

export const isActiveAppointmentStatus = (status: unknown) => {
  const group = getAppointmentStatusGroup(status);
  return group === "scheduled" || group === "pending" || group === "rescheduled";
};

export const getAppointmentStatusLabel = (status: unknown) => {
  const raw = String(status || "").trim();
  if (raw) return raw;
  return "Unknown";
};

export const getAppointmentStatusBadgeClass = (status: unknown) => {
  const group = getAppointmentStatusGroup(status);
  switch (group) {
    case "scheduled":
      return "bg-sky-50 text-sky-700 ring-sky-100";
    case "pending":
      return "bg-amber-50 text-amber-700 ring-amber-100";
    case "completed":
      return "bg-emerald-50 text-emerald-700 ring-emerald-100";
    case "cancelled":
      return "bg-rose-50 text-rose-700 ring-rose-100";
    case "rescheduled":
      return "bg-violet-50 text-violet-700 ring-violet-100";
    default:
      return "bg-slate-50 text-slate-600 ring-slate-100";
  }
};

export const getAppointmentStatusSortWeight = (status: unknown) => {
  const group = getAppointmentStatusGroup(status);
  switch (group) {
    case "pending":
      return 0;
    case "scheduled":
      return 1;
    case "rescheduled":
      return 2;
    case "completed":
      return 3;
    case "cancelled":
      return 4;
    default:
      return 5;
  }
};
