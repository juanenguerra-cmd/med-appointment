import { ParsedCensusResult, ParsedResident, RawCensusImportInput } from "./censusTypes";
import { detectDuplicates } from "./duplicateDetection";
import {
  deriveUnitFromRoom,
  detectReportDate,
  detectResidentStatus,
  extractAdmitDate,
  extractDob,
  extractMrn,
  extractPayer,
  extractPhysician,
  extractResidentName,
  extractRoomBed,
  extractUnit,
  splitResidentBlocks,
} from "./fieldExtractors";
import { createResidentKey, normalizeRawCensusText } from "./normalizeRawCensusText";

export function parseResidentBlock(
  block: string,
  context: { currentUnit?: string; reportDate?: string } = {},
): ParsedResident {
  const warnings: string[] = [];

  const roomBed = extractRoomBed(block);
  const name = extractResidentName(block);
  const mrn = extractMrn(block);
  const dob = extractDob(block);
  const admitDate = extractAdmitDate(block);
  const payerPrimary = extractPayer(block);
  const attendingPhysician = extractPhysician(block);
  const unit = extractUnit(block) || context.currentUnit || deriveUnitFromRoom(roomBed?.room);
  const status = detectResidentStatus(block);

  if (!name.firstName || !name.lastName) warnings.push("Missing resident name.");
  if (!mrn) warnings.push("Missing MRN.");
  if (!dob) warnings.push("Missing DOB.");
  if (!roomBed?.room) warnings.push("Missing room.");
  if (!unit) warnings.push("Missing unit.");

  const resident: ParsedResident = {
    residentKey: "",
    firstName: name.firstName,
    lastName: name.lastName,
    fullName: name.fullName,
    mrn,
    dob,
    unit,
    room: roomBed?.room,
    bed: roomBed?.bed,
    roomBed: roomBed?.roomBed,
    admitDate,
    payerPrimary,
    attendingPhysician,
    status,
    sourceBlock: block,
    warnings,
  };

  resident.residentKey = createResidentKey(resident);
  return resident;
}

export function parseCensusText(input: RawCensusImportInput): ParsedCensusResult {
  const normalizedText = normalizeRawCensusText(input.rawText);
  const reportDate = input.reportDate || detectReportDate(normalizedText);
  const blocks = splitResidentBlocks(normalizedText);
  const residents: ParsedResident[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  let currentUnit: string | undefined;

  for (const block of blocks) {
    const unitFromBlock = extractUnit(block);
    if (unitFromBlock) currentUnit = unitFromBlock;

    try {
      const resident = parseResidentBlock(block, { currentUnit, reportDate });
      if (resident.status === "active") residents.push(resident);
    } catch (error) {
      errors.push(`Failed to parse block: ${String(error)}`);
    }
  }

  const duplicates = detectDuplicates(residents);

  return {
    importId: input.importId,
    reportDate,
    parsedAt: new Date().toISOString(),
    residents,
    summary: {
      totalBlocksDetected: blocks.length,
      totalResidentsParsed: residents.length,
      activeResidents: residents.filter((resident) => resident.status === "active").length,
      dischargedResidents: residents.filter((resident) => resident.status === "discharged").length,
      duplicateResidents: duplicates.length,
      residentsWithWarnings: residents.filter((resident) => resident.warnings.length > 0).length,
      missingMrn: residents.filter((resident) => !resident.mrn).length,
      missingDob: residents.filter((resident) => !resident.dob).length,
      missingRoom: residents.filter((resident) => !resident.room).length,
      missingUnit: residents.filter((resident) => !resident.unit).length,
    },
    duplicates,
    errors,
    warnings,
  };
}
