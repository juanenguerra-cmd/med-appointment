export function normalizeRawCensusText(rawText: string): string {
  return rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function normalizeDate(value?: string | null): string | undefined {
  if (!value) return undefined;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  return date.toISOString().slice(0, 10);
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function cleanLineValue(value: string): string {
  return value
    .split("\n")[0]
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function createResidentKey(resident: {
  mrn?: string;
  firstName?: string;
  lastName?: string;
  dob?: string;
}): string {
  if (resident.mrn) return `mrn:${resident.mrn.trim()}`;

  const last = resident.lastName?.toLowerCase().trim() || "unknown_last";
  const first = resident.firstName?.toLowerCase().trim() || "unknown_first";
  const dob = resident.dob || "unknown_dob";

  return `name_dob:${last}|${first}|${dob}`;
}
