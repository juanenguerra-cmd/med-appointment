import { Appointment } from '../types';

export type AppointmentReadinessIssue = {
  field: string;
  label: string;
};

export type AppointmentIntelligence = {
  today: Appointment[];
  tomorrow: Appointment[];
  overdue: Appointment[];
  missed: Appointment[];
  transportNotReady: Array<{
    appointment: Appointment;
    issues: AppointmentReadinessIssue[];
  }>;
};

const CLOSED_STATUSES = new Set(['completed', 'cancelled', 'discontinued']);

export function safeAppointmentText(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

export function safeAppointmentLower(value: unknown): string {
  return safeAppointmentText(value).toLowerCase();
}

export function getLocalDateString(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function addDaysToLocalDate(days: number, date = new Date()): string {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return getLocalDateString(next);
}

export function isClosedAppointment(appointment: Appointment): boolean {
  return CLOSED_STATUSES.has(safeAppointmentLower(appointment.status));
}

export function isOverdueAppointment(appointment: Appointment, today = getLocalDateString()): boolean {
  const appointmentDate = safeAppointmentText(appointment.date);
  if (!appointmentDate) return false;
  return appointmentDate < today && !isClosedAppointment(appointment);
}

export function isMissedAppointment(appointment: Appointment, today = getLocalDateString()): boolean {
  return isOverdueAppointment(appointment, today) && safeAppointmentLower(appointment.status) === 'scheduled';
}

export function getTransportReadinessIssues(appointment: Appointment): AppointmentReadinessIssue[] {
  const issues: AppointmentReadinessIssue[] = [];

  if (!safeAppointmentText(appointment.pickUpTime)) {
    issues.push({ field: 'pickUpTime', label: 'Pickup time missing' });
  }

  if (!safeAppointmentText(appointment.transportType)) {
    issues.push({ field: 'transportType', label: 'Transport type missing' });
  }

  if (!safeAppointmentText(appointment.escort)) {
    issues.push({ field: 'escort', label: 'Escort status missing' });
  }

  if (!safeAppointmentText(appointment.location)) {
    issues.push({ field: 'location', label: 'Location missing' });
  }

  if (!safeAppointmentText(appointment.contactNumber)) {
    issues.push({ field: 'contactNumber', label: 'Contact number missing' });
  }

  return issues;
}

export function isTransportReady(appointment: Appointment): boolean {
  return getTransportReadinessIssues(appointment).length === 0;
}

export function buildAppointmentIntelligence(appointments: Appointment[], referenceDate = new Date()): AppointmentIntelligence {
  const today = getLocalDateString(referenceDate);
  const tomorrow = addDaysToLocalDate(1, referenceDate);

  const sorted = [...appointments].sort((a, b) => {
    const dateCompare = safeAppointmentText(a.date).localeCompare(safeAppointmentText(b.date));
    if (dateCompare !== 0) return dateCompare;
    return safeAppointmentText(a.time).localeCompare(safeAppointmentText(b.time));
  });

  return {
    today: sorted.filter((appointment) => safeAppointmentText(appointment.date) === today && !isClosedAppointment(appointment)),
    tomorrow: sorted.filter((appointment) => safeAppointmentText(appointment.date) === tomorrow && !isClosedAppointment(appointment)),
    overdue: sorted.filter((appointment) => isOverdueAppointment(appointment, today)),
    missed: sorted.filter((appointment) => isMissedAppointment(appointment, today)),
    transportNotReady: sorted
      .filter((appointment) => !isClosedAppointment(appointment))
      .map((appointment) => ({ appointment, issues: getTransportReadinessIssues(appointment) }))
      .filter((entry) => entry.issues.length > 0),
  };
}
