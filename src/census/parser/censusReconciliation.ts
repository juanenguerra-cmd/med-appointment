import {
  CensusReconciliationResult,
  ExistingResidentForCensusCompare,
  ParsedCensusResult,
  ParsedResident,
  ResidentRoomTransfer,
} from "./censusTypes";

export function reconcileCensusImport(
  parsed: ParsedCensusResult,
  existingResidents: ExistingResidentForCensusCompare[],
): CensusReconciliationResult {
  const existingByKey = new Map(existingResidents.map((resident) => [resident.residentKey, resident]));
  const parsedByKey = new Map(parsed.residents.map((resident) => [resident.residentKey, resident]));

  const activeResidents = parsed.residents.filter((resident) => resident.status === "active");
  const newAdmissions: ParsedResident[] = [];
  const unchangedResidents: ParsedResident[] = [];
  const roomTransfers: ResidentRoomTransfer[] = [];

  for (const resident of activeResidents) {
    const existing = existingByKey.get(resident.residentKey);

    if (!existing) {
      newAdmissions.push(resident);
      continue;
    }

    const roomChanged = existing.room !== resident.room || existing.bed !== resident.bed || existing.unit !== resident.unit;

    if (roomChanged) {
      roomTransfers.push({
        residentKey: resident.residentKey,
        residentName: resident.fullName,
        previousUnit: existing.unit,
        previousRoom: existing.room,
        previousBed: existing.bed,
        newUnit: resident.unit,
        newRoom: resident.room,
        newBed: resident.bed,
        effectiveDate: parsed.reportDate,
      });
      continue;
    }

    unchangedResidents.push(resident);
  }

  const possibleDischarges = existingResidents.filter(
    (existing) => existing.status === "active" && !parsedByKey.has(existing.residentKey),
  );

  return {
    importId: parsed.importId,
    reportDate: parsed.reportDate,
    activeResidents,
    newAdmissions,
    roomTransfers,
    possibleDischarges,
    unchangedResidents,
    duplicates: parsed.duplicates,
    warnings: parsed.warnings,
  };
}
