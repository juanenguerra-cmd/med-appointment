import { CleanCensusRow, ParsedResident } from "./censusTypes";

export function toCleanCensusRows(residents: ParsedResident[]): CleanCensusRow[] {
  return residents
    .map((resident) => ({
      residentName: resident.fullName || `${resident.lastName}, ${resident.firstName}`,
      unit: resident.unit || "",
      room: resident.room || "",
      bed: resident.bed || "",
      mrn: resident.mrn || "",
      dob: resident.dob || "",
      admitDate: resident.admitDate || "",
      payer: resident.payerPrimary || "",
      physician: resident.attendingPhysician || "",
      status: resident.status,
      warnings: resident.warnings,
    }))
    .sort((a, b) => {
      const unitCompare = a.unit.localeCompare(b.unit);
      if (unitCompare !== 0) return unitCompare;

      const roomCompare = a.room.localeCompare(b.room, undefined, { numeric: true });
      if (roomCompare !== 0) return roomCompare;

      return a.bed.localeCompare(b.bed);
    });
}
