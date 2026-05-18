export type CensusImportSourceType = "paste" | "txt" | "csv" | "pdf_text" | "manual";

export interface RawCensusImportInput {
  importId: string;
  sourceType: CensusImportSourceType;
  rawText: string;
  importedAt: string;
  importedBy?: string;
  facilityId?: string;
  reportDate?: string;
}

export interface ParsedResident {
  residentKey: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  mrn?: string;
  dob?: string;
  age?: string;
  sex?: string;
  floor?: string;
  unit?: string;
  room?: string;
  bed?: string;
  roomBed?: string;
  admitDate?: string;
  payerPrimary?: string;
  payerSecondary?: string;
  allergies?: string;
  attendingPhysician?: string;
  primaryDiagnosis?: string;
  status: "active" | "discharged" | "unknown";
  sourceBlock: string;
  warnings: string[];
}

export interface ParsedResidentDuplicate {
  residentKey: string;
  residents: ParsedResident[];
  reason: "same_mrn" | "same_name_dob" | "same_room_bed" | "possible_name_match";
}

export interface ParsedCensusResult {
  importId: string;
  reportDate?: string;
  parsedAt: string;
  residents: ParsedResident[];
  summary: {
    totalBlocksDetected: number;
    totalResidentsParsed: number;
    activeResidents: number;
    dischargedResidents: number;
    duplicateResidents: number;
    residentsWithWarnings: number;
    missingMrn: number;
    missingDob: number;
    missingRoom: number;
    missingUnit: number;
  };
  duplicates: ParsedResidentDuplicate[];
  errors: string[];
  warnings: string[];
}

export interface CleanCensusRow {
  residentName: string;
  unit: string;
  room: string;
  bed: string;
  mrn: string;
  dob: string;
  admitDate: string;
  payer: string;
  physician: string;
  status: string;
  warnings: string[];
}

export interface ExistingResidentForCensusCompare {
  residentKey: string;
  firstName: string;
  lastName: string;
  fullName: string;
  mrn?: string;
  dob?: string;
  unit?: string;
  room?: string;
  bed?: string;
  status: "active" | "discharged" | "inactive";
}

export interface ResidentRoomTransfer {
  residentKey: string;
  residentName: string;
  previousUnit?: string;
  previousRoom?: string;
  previousBed?: string;
  newUnit?: string;
  newRoom?: string;
  newBed?: string;
  effectiveDate?: string;
}

export interface CensusReconciliationResult {
  importId: string;
  reportDate?: string;
  activeResidents: ParsedResident[];
  newAdmissions: ParsedResident[];
  roomTransfers: ResidentRoomTransfer[];
  possibleDischarges: ExistingResidentForCensusCompare[];
  unchangedResidents: ParsedResident[];
  duplicates: ParsedResidentDuplicate[];
  warnings: string[];
}

export interface CensusImportBatch {
  importId: string;
  importedAt: string;
  importedBy?: string;
  facilityId?: string;
  reportDate?: string;
  rawTextHash?: string;
  totalParsed: number;
  totalImported: number;
  newAdmissions: number;
  roomTransfers: number;
  possibleDischarges: number;
  duplicates: number;
  warnings: number;
}
