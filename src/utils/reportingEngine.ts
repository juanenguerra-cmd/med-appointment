import { Appointment, Resident } from "../types";

export const getToday = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

export const isPast = (date?: string) => Boolean(date && date < getToday());
export const isFuture = (date?: string) => Boolean(date && date > getToday());
export const isToday = (date?: string) => Boolean(date && date === getToday());

export type ReportRow = Record<string, string | number | boolean | null | undefined>;

export const buildSummary = (appointments: Appointment[]) => {
  const summary = {
    total: 0,
    past: 0,
    future: 0,
    today: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    pending: 0,
    missingTransportPhone: 0,
    escortRequired: 0,
  };

  appointments.forEach((a) => {
    summary.total++;

    if (isToday(a.date)) summary.today++;
    if (isPast(a.date)) summary.past++;
    if (isFuture(a.date)) summary.future++;

    if (a.status === "Scheduled") summary.scheduled++;
    else if (a.status === "Completed") summary.completed++;
    else if (a.status === "Cancelled" || a.status === "Discontinued" || a.status === "Deferred") summary.cancelled++;
    else if (a.status === "Pending") summary.pending++;

    if ((a.transportCompany || a.transportCompanyOther) && !a.transportCompanyPhone) summary.missingTransportPhone++;
    if (a.escort === "Yes" || Boolean(a.escortDetails)) summary.escortRequired++;
  });

  return summary;
};

export const buildSpecialtyReport = (appointments: Appointment[]) => {
  const map: Record<string, any> = {};

  appointments.forEach((a) => {
    const key = a.type || "Unknown";
    if (!map[key]) {
      map[key] = {
        label: key,
        total: 0,
        past: 0,
        future: 0,
        scheduled: 0,
        completed: 0,
        cancelled: 0,
      };
    }

    map[key].total++;
    if (isPast(a.date)) map[key].past++;
    if (isFuture(a.date)) map[key].future++;
    if (a.status === "Scheduled") map[key].scheduled++;
    if (a.status === "Completed") map[key].completed++;
    if (a.status === "Cancelled" || a.status === "Discontinued" || a.status === "Deferred") map[key].cancelled++;
  });

  return Object.values(map).sort((a: any, b: any) => b.total - a.total || a.label.localeCompare(b.label));
};

export const buildTransportReport = (appointments: Appointment[]) => {
  const map: Record<string, any> = {};

  appointments.forEach((a) => {
    const key = a.transportCompanyOther || a.transportCompany || "Unassigned";

    if (!map[key]) {
      map[key] = {
        label: key,
        total: 0,
        missingPhone: 0,
        escortRequired: 0,
        scheduled: 0,
        completed: 0,
      };
    }

    map[key].total++;
    if (!a.transportCompanyPhone && key !== "Unassigned") map[key].missingPhone++;
    if (a.escort === "Yes" || Boolean(a.escortDetails)) map[key].escortRequired++;
    if (a.status === "Scheduled") map[key].scheduled++;
    if (a.status === "Completed") map[key].completed++;
  });

  return Object.values(map).sort((a: any, b: any) => b.total - a.total || a.label.localeCompare(b.label));
};

export const buildResidentHistory = (
  appointments: Appointment[],
  residents: Resident[]
) => {
  const map: Record<string, any> = {};

  appointments.forEach((a) => {
    const key = a.residentName || "Unknown Resident";

    if (!map[key]) {
      const res = residents.find((r) => r.name === key);
      const status = String(res?.status || "Active");

      map[key] = {
        name: key,
        unit: res?.unit || a.unit || "",
        room: res?.roomNumber || a.roomNumber || "",
        status,
        total: 0,
        past: 0,
        future: 0,
        lastAppointment: "",
        nextAppointment: "",
      };
    }

    map[key].total++;

    if (isPast(a.date)) {
      map[key].past++;
      if (!map[key].lastAppointment || a.date > map[key].lastAppointment) map[key].lastAppointment = a.date;
    }

    if (isFuture(a.date) || isToday(a.date)) {
      map[key].future++;
      if (!map[key].nextAppointment || a.date < map[key].nextAppointment) map[key].nextAppointment = a.date;
    }
  });

  return Object.values(map).sort((a: any, b: any) => {
    if (a.status !== b.status) return a.status === "Discharged" ? -1 : 1;
    return b.total - a.total || a.name.localeCompare(b.name);
  });
};

export const buildAppointmentDetailRows = (appointments: Appointment[]): ReportRow[] => {
  return appointments.map((a) => ({
    residentName: a.residentName,
    date: a.date,
    time: a.time,
    status: a.status,
    specialty: a.type,
    provider: a.providerName,
    location: a.location,
    transportCompany: a.transportCompanyOther || a.transportCompany || "",
    transportPhone: a.transportCompanyPhone || "",
    escort: a.escortDetails || a.escort || "",
    escortPhone: a.escortPhone || "",
    unit: a.unit,
    roomNumber: a.roomNumber,
  }));
};

export const buildV2ReportBundle = (appointments: Appointment[], residents: Resident[]) => {
  return {
    summary: buildSummary(appointments),
    specialty: buildSpecialtyReport(appointments),
    transport: buildTransportReport(appointments),
    history: buildResidentHistory(appointments, residents),
    details: buildAppointmentDetailRows(appointments),
  };
};

export const rowsToCsv = (rows: ReportRow[]) => {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escapeValue = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeValue(row[header])).join(",")),
  ].join("\n");
};

export const downloadCsv = (filename: string, rows: ReportRow[]) => {
  const csv = rowsToCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
