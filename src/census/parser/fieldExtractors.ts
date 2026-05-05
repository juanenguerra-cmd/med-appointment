import { cleanLineValue, normalizeDate, titleCase } from "./normalizeRawCensusText";

export function detectReportDate(text: string): string | undefined {
  const patterns = [
    /(?:report date|census date|date)\s*[:\-]\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
    /(?:report date|census date|date)\s*[:\-]\s*([A-Za-z]+ \d{1,2}, \d{4})/i,
    /(?:report date|census date|date)\s*[:\-]\s*(\d{4}-\d{2}-\d{2})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return normalizeDate(match[1]);
  }

  return undefined;
}

export function splitResidentBlocks(text: string): string[] {
  return text
    .split(/\n(?=(?:Room\s*)?\d{2,4}[- ]?[A-Z]\b|[A-Z' -]+,\s*[A-Z' -]+|\bResident\b)/i)
    .map((block) => block.trim())
    .filter((block) => block.length > 20);
}

export function extractResidentName(block: string): { firstName: string; lastName: string; fullName: string } {
  const commaName = block.match(/\b([A-Z][A-Z' -]+),\s*([A-Z][A-Z' -]+)\b/);

  if (commaName) {
    const lastName = titleCase(commaName[1]);
    const firstName = titleCase(commaName[2]);
    return { firstName, lastName, fullName: `${lastName}, ${firstName}` };
  }

  const labeled = block.match(/resident\s*[:\-]\s*([A-Za-z' -]+)\s+([A-Za-z' -]+)/i);

  if (labeled) {
    const firstName = titleCase(labeled[1]);
    const lastName = titleCase(labeled[2]);
    return { firstName, lastName, fullName: `${lastName}, ${firstName}` };
  }

  return { firstName: "", lastName: "", fullName: "" };
}

export function extractRoomBed(block: string): { room: string; bed: string; roomBed: string } | undefined {
  const match = block.match(/\b(?:room\s*[:#]?\s*)?(\d{2,4})[- ]?([A-Z])\b/i);
  if (!match) return undefined;

  const room = match[1];
  const bed = match[2].toUpperCase();
  return { room, bed, roomBed: `${room}-${bed}` };
}

export function deriveUnitFromRoom(room?: string): string | undefined {
  if (!room) return undefined;
  if (room.startsWith("2")) return "Unit 2";
  if (room.startsWith("3")) return "Unit 3";
  if (room.startsWith("4")) return "Unit 4";
  return undefined;
}

export function extractUnit(block: string): string | undefined {
  const match = block.match(/\bunit\s*[:\-]?\s*(unit\s*)?(\d|[A-Z])\b/i);
  if (!match) return undefined;

  const value = match[2].toUpperCase();
  return `Unit ${value}`;
}

export function extractMrn(block: string): string | undefined {
  const patterns = [
    /\bMRN\s*[:#]?\s*([A-Za-z0-9-]+)/i,
    /\bMedical Record\s*[:#]?\s*([A-Za-z0-9-]+)/i,
    /\bResident ID\s*[:#]?\s*([A-Za-z0-9-]+)/i,
    /\(([0-9]{4,})\)/,
  ];

  for (const pattern of patterns) {
    const match = block.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  return undefined;
}

export function extractDob(block: string): string | undefined {
  const patterns = [
    /\bDOB\s*[:\-]?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
    /\bDate of Birth\s*[:\-]?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
    /\bDOB\s*[:\-]?\s*(\d{4}-\d{2}-\d{2})/i,
  ];

  for (const pattern of patterns) {
    const match = block.match(pattern);
    if (match?.[1]) return normalizeDate(match[1]);
  }

  return undefined;
}

export function extractAdmitDate(block: string): string | undefined {
  const patterns = [
    /\bAdmit Date\s*[:\-]?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
    /\bAdmission Date\s*[:\-]?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
    /\bAdmitted\s*[:\-]?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
  ];

  for (const pattern of patterns) {
    const match = block.match(pattern);
    if (match?.[1]) return normalizeDate(match[1]);
  }

  return undefined;
}

export function extractPayer(block: string): string | undefined {
  const patterns = [
    /\bPayor\s*[:\-]?\s*([A-Za-z0-9 /-]+)/i,
    /\bPayer\s*[:\-]?\s*([A-Za-z0-9 /-]+)/i,
    /\bInsurance\s*[:\-]?\s*([A-Za-z0-9 /-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = block.match(pattern);
    if (match?.[1]) return cleanLineValue(match[1]);
  }

  const knownPayers = ["Medicare A", "Medicare B", "Medicaid", "Private Pay", "HMO", "Managed Care", "Hospice"];
  return knownPayers.find((payer) => block.toLowerCase().includes(payer.toLowerCase()));
}

export function extractPhysician(block: string): string | undefined {
  const patterns = [
    /\bPhysician\s*[:\-]?\s*([A-Za-z.,' -]+)/i,
    /\bAttending\s*[:\-]?\s*([A-Za-z.,' -]+)/i,
    /\bDoctor\s*[:\-]?\s*([A-Za-z.,' -]+)/i,
    /\bMD\s*[:\-]?\s*([A-Za-z.,' -]+)/i,
  ];

  for (const pattern of patterns) {
    const match = block.match(pattern);
    if (match?.[1]) return cleanLineValue(match[1]);
  }

  return undefined;
}

export function detectResidentStatus(block: string): "active" | "discharged" | "unknown" {
  const lower = block.toLowerCase();

  if (lower.includes("discharged") || lower.includes("dc date") || lower.includes("d/c")) return "discharged";
  if (lower.includes("active") || lower.includes("occupied") || lower.includes("current")) return "active";
  if (extractRoomBed(block) && extractResidentName(block).fullName) return "active";
  return "unknown";
}
