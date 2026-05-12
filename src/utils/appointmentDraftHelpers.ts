import type { Appointment, Resident } from "../types";
import { MEDICAL_SPECIALTIES } from "../constants/medicalSpecialties";
import { createDefaultAppointmentDraft } from "../constants/appointmentDefaults";

const KNOWN_UNITS = [
  "Unit A",
  "Unit B",
  "Unit 1",
  "Unit 2",
  "Unit 3",
  "Unit 4",
  "Rehab",
];

export const createNewAppointmentDraft = () => createDefaultAppointmentDraft();

export const createDuplicateAppointmentDraft = (appointment: Appointment): Partial<Appointment> => {
  const { id, ...draft } = appointment;
  return {
    ...draft,
    status: "Scheduled",
  };
};

export const createEditAppointmentDraft = (appointment: Appointment): Partial<Appointment> => ({
  ...appointment,
});

export const isOtherSpecialty = (specialty?: string) => {
  const value = String(specialty || "").trim();
  return value !== "" && !(MEDICAL_SPECIALTIES as readonly string[]).includes(value);
};

export const resolveResidentUnit = (resident: Resident, fallbackUnit = "") => {
  const unitStr = String(resident.unit || "").trim();
  const exactMatch = KNOWN_UNITS.find((unit) => unit.toLowerCase() === unitStr.toLowerCase());
  if (exactMatch) return exactMatch;

  const lower = unitStr.toLowerCase();
  if (lower.includes("unit a")) return "Unit A";
  if (lower.includes("unit b")) return "Unit B";
  if (lower.includes("rehab")) return "Rehab";
  if (lower.includes("unit 1")) return "Unit 1";
  if (lower.includes("unit 2")) return "Unit 2";
  if (lower.includes("unit 3")) return "Unit 3";
  if (lower.includes("unit 4")) return "Unit 4";

  if (resident.unit && resident.unit !== "—") return resident.unit;
  if (resident.floor && resident.floor !== "—") return resident.floor;
  return fallbackUnit;
};

export const applyResidentToAppointmentDraft = (
  currentDraft: Partial<Appointment>,
  resident: Resident,
): Partial<Appointment> => {
  const finalUnit = resolveResidentUnit(resident, currentDraft.unit || "");

  return {
    ...currentDraft,
    residentId: resident.id,
    residentMrn: resident.mrn,
    residentName: resident.name,
    roomNumber: resident.roomNumber,
    unit: finalUnit,
    notes: `MRN: ${resident.mrn} | Physician: ${resident.doctor} | Age: ${resident.age}`,
  };
};
