import { ParsedResident, ParsedResidentDuplicate } from "./censusTypes";

export function detectDuplicates(residents: ParsedResident[]): ParsedResidentDuplicate[] {
  const byKey = new Map<string, ParsedResident[]>();

  for (const resident of residents) {
    const list = byKey.get(resident.residentKey) || [];
    list.push(resident);
    byKey.set(resident.residentKey, list);
  }

  const duplicates: ParsedResidentDuplicate[] = [];

  for (const [residentKey, list] of byKey.entries()) {
    if (list.length > 1) {
      duplicates.push({
        residentKey,
        residents: list,
        reason: residentKey.startsWith("mrn:") ? "same_mrn" : "same_name_dob",
      });
    }
  }

  return duplicates;
}
