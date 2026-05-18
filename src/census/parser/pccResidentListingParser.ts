import type { ParsedCensusResult, ParsedResident, RawCensusImportInput } from "./censusTypes";
import { detectDuplicates } from "./duplicateDetection";
import { createResidentKey, normalizeDate, normalizeRawCensusText, titleCase } from "./normalizeRawCensusText";
import { detectReportDate } from "./fieldExtractors";

const RESIDENT_ROW_START = /^([A-Z][A-Z' .-]+),\s+([A-Z][A-Z' .-]+)\s+\(([^)]+)\)\s+\d{1,3}\s+\d{1,2}\/\d{1,2}\/\d{2,4}\b/;
const DIAGNOSIS_CODE_PATTERN = /^[A-Z][A-Z0-9]*(?:\.[A-Z0-9]+)?$/;

export function isPccResidentListingFormat(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("resident listing report") &&
    lower.includes("birth date") &&
    lower.includes("location") &&
    lower.includes("primary physician") &&
    lower.includes("primary diagnosis")
  );
}

function normalizePccLines(text: string): string[] {
  return normalizeRawCensusText(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^name\s+age\s+birth date\s+location/i.test(line))
    .filter((line) => !/^resident:\s*/i.test(line))
    .filter((line) => !/^resident listing report/i.test(line));
}

export function normalizePccResidentRows(text: string): string[] {
  const rows: string[] = [];

  for (const line of normalizePccLines(text)) {
    if (RESIDENT_ROW_START.test(line)) {
      rows.push(line);
      continue;
    }

    if (rows.length > 0) {
      rows[rows.length - 1] = `${rows[rows.length - 1]} ${line}`.replace(/\s+/g, " ").trim();
    }
  }

  return rows;
}

function extractLocationParts(location: string): Pick<ParsedResident, "floor" | "unit" | "room" | "bed" | "roomBed"> {
  const match = location.match(/^(.*?)\s*Unit\s+(\d+)\s+(\d{2,4})\s+([A-Z])\b/i);
  if (!match) return {};

  const floor = match[1].trim() || undefined;
  const unit = `Unit ${match[2]}`;
  const room = match[3];
  const bed = match[4].toUpperCase();

  return {
    floor,
    unit,
    room,
    bed,
    roomBed: `${room}-${bed}`,
  };
}

function splitPhysicianDiagnosis(tail: string): { allergies?: string; physician?: string; diagnosis?: string } {
  const tokens = tail.trim().split(/\s+/).filter(Boolean);
  let diagnosis: string | undefined;

  if (tokens.length > 0 && DIAGNOSIS_CODE_PATTERN.test(tokens[tokens.length - 1])) {
    diagnosis = tokens.pop();
  }

  const remaining = tokens.join(" ").trim();
  const physicianPatterns = [
    /\b(Dr\.\s+[A-Z][A-Za-z'.-]+(?:\s+[A-Z][A-Za-z'.-]+)*)$/,
    /\b(Dinesh\s+Sethi)$/i,
    /\b(Nenad\s+Grlic)$/i,
    /\b(Ramin\s+Hodjati)$/i,
  ];

  for (const pattern of physicianPatterns) {
    const match = remaining.match(pattern);
    if (match?.[1]) {
      const physician = match[1].trim();
      const allergies = remaining.slice(0, match.index).trim();
      return { allergies, physician, diagnosis };
    }
  }

  const fallback = remaining.match(/^(.*?)([A-Z][A-Za-z'.-]+\s+[A-Z][A-Za-z'.-]+)$/);
  if (fallback) {
    return {
      allergies: fallback[1].trim(),
      physician: fallback[2].trim(),
      diagnosis,
    };
  }

  return { allergies: remaining, diagnosis };
}

export function parsePccResidentListingRow(row: string): ParsedResident {
  const pattern = /^([A-Z][A-Z' .-]+),\s+([A-Z][A-Z' .-]+)\s+\(([^)]+)\)\s+(\d{1,3})\s+(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?Unit\s+\d+\s+\d{2,4}\s+[A-Z])\s+([MF])\s+(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+)$/i;
  const match = row.match(pattern);

  if (!match) {
    return {
      residentKey: "",
      firstName: "",
      lastName: "",
      fullName: "",
      status: "unknown",
      sourceBlock: row,
      warnings: ["Unable to parse PCC resident row."],
    };
  }

  const lastName = titleCase(match[1].trim());
  const firstName = titleCase(match[2].trim());
  const mrn = match[3].trim();
  const age = match[4].trim();
  const dob = normalizeDate(match[5].trim());
  const location = match[6].trim();
  const sex = match[7].toUpperCase();
  const admitDate = normalizeDate(match[8].trim());
  const tail = match[9].trim();
  const locationParts = extractLocationParts(location);
  const tailParts = splitPhysicianDiagnosis(tail);
  const warnings: string[] = [];

  if (!mrn) warnings.push("Missing MRN.");
  if (!dob) warnings.push("Missing DOB.");
  if (!locationParts.room) warnings.push("Missing room.");
  if (!locationParts.unit) warnings.push("Missing unit.");
  if (!tailParts.physician) warnings.push("Missing primary physician.");

  const resident: ParsedResident = {
    residentKey: "",
    firstName,
    lastName,
    fullName: `${lastName}, ${firstName}`,
    mrn,
    dob,
    age,
    sex,
    floor: locationParts.floor,
    unit: locationParts.unit,
    room: locationParts.room,
    bed: locationParts.bed,
    roomBed: locationParts.roomBed,
    admitDate,
    allergies: tailParts.allergies,
    attendingPhysician: tailParts.physician,
    primaryDiagnosis: tailParts.diagnosis,
    status: "active",
    sourceBlock: row,
    warnings,
  };

  resident.residentKey = createResidentKey(resident);
  return resident;
}

export function parsePccResidentListingText(input: RawCensusImportInput): ParsedCensusResult {
  const normalizedText = normalizeRawCensusText(input.rawText);
  const reportDate = input.reportDate || detectReportDate(normalizedText);
  const rows = normalizePccResidentRows(normalizedText);
  const residents: ParsedResident[] = [];
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const resident = parsePccResidentListingRow(row);
      if (resident.status === "active") residents.push(resident);
    } catch (error) {
      errors.push(`Failed to parse PCC row: ${String(error)}`);
    }
  }

  const duplicates = detectDuplicates(residents);

  return {
    importId: input.importId,
    reportDate,
    parsedAt: new Date().toISOString(),
    residents,
    summary: {
      totalBlocksDetected: rows.length,
      totalResidentsParsed: residents.length,
      activeResidents: residents.length,
      dischargedResidents: 0,
      duplicateResidents: duplicates.length,
      residentsWithWarnings: residents.filter((resident) => resident.warnings.length > 0).length,
      missingMrn: residents.filter((resident) => !resident.mrn).length,
      missingDob: residents.filter((resident) => !resident.dob).length,
      missingRoom: residents.filter((resident) => !resident.room).length,
      missingUnit: residents.filter((resident) => !resident.unit).length,
    },
    duplicates,
    errors,
    warnings: [],
  };
}
