import type { Resident } from "../../types";
import type { ParsedResident } from "./censusTypes";

function ageFromDate(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const monthDiff = now.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) age -= 1;
  return String(age);
}

export function parsedResidentToResidentPreview(
  item: ParsedResident,
  facilityId: string,
  seenAt?: string,
): Omit<Resident, "id"> {
  return {
    facilityId,
    name: item.fullName || `${item.lastName}, ${item.firstName}`.trim(),
    lastName: item.lastName,
    firstName: item.firstName,
    mrn: item.mrn || "",
    age: item.age || ageFromDate(item.dob),
    floor: item.floor || "—",
    unit: item.unit || "",
    roomNumber: item.roomBed || item.room || "",
    sex: item.sex || "",
    admissionDate: item.admitDate || "",
    allergies: item.allergies || "",
    doctor: item.attendingPhysician || "",
    diagnosis: item.primaryDiagnosis || "",
    status: item.status === "discharged" ? "Discharged" : "Active",
    lastSeenCensusAt: seenAt,
  };
}

export function parsedResidentsToResidentPreview(
  items: ParsedResident[],
  facilityId: string,
  seenAt?: string,
): Omit<Resident, "id">[] {
  return items.map((item) => parsedResidentToResidentPreview(item, facilityId, seenAt));
}
