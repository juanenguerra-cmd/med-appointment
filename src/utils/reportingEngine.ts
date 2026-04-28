import { Appointment, Resident } from "../types";

export const getToday = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

export const isPast = (date?: string) => date && date < getToday();
export const isFuture = (date?: string) => date && date > getToday();

export const buildSummary = (appointments: Appointment[]) => {
  let summary = {
    total: 0,
    past: 0,
    future: 0,
    today: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
  };

  const today = getToday();

  appointments.forEach((a) => {
    summary.total++;

    if (a.date === today) summary.today++;
    if (isPast(a.date)) summary.past++;
    if (isFuture(a.date)) summary.future++;

    if (a.status === "Scheduled") summary.scheduled++;
    else if (a.status === "Completed") summary.completed++;
    else if (a.status === "Cancelled") summary.cancelled++;
  });

  return summary;
};

export const buildSpecialtyReport = (appointments: Appointment[]) => {
  const map: Record<string, number> = {};

  appointments.forEach((a) => {
    const key = a.type || "Unknown";
    map[key] = (map[key] || 0) + 1;
  });

  return Object.entries(map).map(([label, total]) => ({
    label,
    total,
  }));
};

export const buildTransportReport = (appointments: Appointment[]) => {
  const map: Record<string, number> = {};

  appointments.forEach((a) => {
    const key =
      a.transportCompanyOther ||
      a.transportCompany ||
      "Unassigned";

    map[key] = (map[key] || 0) + 1;
  });

  return Object.entries(map).map(([label, total]) => ({
    label,
    total,
  }));
};

export const buildResidentHistory = (
  appointments: Appointment[],
  residents: Resident[]
) => {
  const map: Record<string, any> = {};

  appointments.forEach((a) => {
    const key = a.residentName;

    if (!map[key]) {
      const res = residents.find((r) => r.name === key);

      map[key] = {
        name: key,
        unit: res?.unit || "",
        room: res?.roomNumber || "",
        total: 0,
        past: 0,
        future: 0,
      };
    }

    map[key].total++;

    if (isPast(a.date)) map[key].past++;
    if (isFuture(a.date)) map[key].future++;
  });

  return Object.values(map);
};