import { DEFAULT_FACILITIES } from "./defaultFacilities";

const HIDDEN_FACILITY_KEYS_STORAGE = "medAppointment.hiddenFacilityKeys.v1";

export type DefaultFacility = {
  id: string;
  organization_id: string;
  organizationId: string;
  name: string;
  short_name: string;
  shortName: string;
  code: string;
  address: string;
  phone: string;
  administrator: string | null;
  don: string | null;
  adon: string | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
  createdAt: string;
  updatedAt: string;
};

export type FacilityRegistryRecord = {
  id: string;
  name: string;
  shortName?: string;
  code?: string;
  address?: string;
  phone?: string;
  administrator?: string | null;
  don?: string | null;
  adon?: string | null;
  status?: string;
};

export function normalizeFacilityRecord(facility: any): FacilityRegistryRecord | null {
  const id = String(facility?.id || "").trim();
  const name = String(facility?.name || facility?.shortName || facility?.short_name || facility?.code || "").trim();
  if (!id || !name) return null;
  return {
    id,
    name,
    shortName: facility?.short_name || facility?.shortName || "",
    code: facility?.code || "",
    address: facility?.address || "",
    phone: facility?.phone || "",
    administrator: facility?.administrator || null,
    don: facility?.don || null,
    adon: facility?.adon || null,
    status: facility?.status || "active",
  };
}

export function normalizeFacilityList(payload: unknown): FacilityRegistryRecord[] {
  const list = Array.isArray(payload) ? payload : (payload as any)?.facilities;
  if (!Array.isArray(list)) return [];
  return list
    .map(normalizeFacilityRecord)
    .filter((facility): facility is FacilityRegistryRecord => Boolean(facility))
    .filter((facility) => String(facility.status || "active").toLowerCase() !== "inactive");
}

const normalizeText = (value: unknown) => String(value || "").trim().toLowerCase().replace(/\s+/g, " ");

const canonicalFacilityName = (value: unknown) => {
  let text = normalizeText(value)
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  text = text
    .replace(/\bnursing\b/g, " ")
    .replace(/\brehabilitation\b/g, " ")
    .replace(/\brehab\b/g, " ")
    .replace(/\bcenter\b/g, " ")
    .replace(/\bcentre\b/g, " ")
    .replace(/\bcare\b/g, " ")
    .replace(/\bfor\b/g, " ")
    .replace(/\band\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const knownNameAliases: Record<string, string> = {
    "east neck": "east-neck",
    "peninsula": "peninsula",
    "carillon": "carillon",
    "downtown brooklyn": "downtown-brooklyn",
    "downtown bk": "downtown-brooklyn",
    "fordham": "fordham",
    "isabella": "isabella",
    "long beach": "long-beach",
    "margaret tietz": "margaret-tietz",
    "morningside": "morningside",
    "saints joachim anne": "saints-joachim-anne",
    "saints j a": "saints-joachim-anne",
    "sea crest": "sea-crest",
    "shore view": "shore-view",
    "upper east side": "upper-east-side",
    "west village": "west-village",
    "workmen s circle multicare": "workmens-circle",
    "workmen s circle": "workmens-circle",
  };

  return knownNameAliases[text] || text;
};

const canonicalFacilityCode = (value: unknown) => normalizeText(value).replace(/[^a-z0-9]+/g, "");

function facilityIdentityKeys(facility: FacilityRegistryRecord) {
  return [
    facility.id ? `id:${normalizeText(facility.id)}` : "",
    facility.code ? `code:${canonicalFacilityCode(facility.code)}` : "",
    facility.name ? `name:${canonicalFacilityName(facility.name)}` : "",
    facility.shortName ? `short:${canonicalFacilityName(facility.shortName)}` : "",
  ].filter(Boolean);
}

function readHiddenFacilityKeys() {
  try {
    const raw = localStorage.getItem(HIDDEN_FACILITY_KEYS_STORAGE);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((key) => typeof key === "string") : []);
  } catch {
    return new Set<string>();
  }
}

function writeHiddenFacilityKeys(keys: Set<string>) {
  try {
    localStorage.setItem(HIDDEN_FACILITY_KEYS_STORAGE, JSON.stringify(Array.from(keys)));
  } catch {
    // localStorage may be unavailable in private browsing; UI state will still update for the current session.
  }
}

export function hideFacilityFromRegistry(facility: FacilityRegistryRecord) {
  const hiddenKeys = readHiddenFacilityKeys();
  facilityIdentityKeys(facility).forEach((key) => hiddenKeys.add(key));
  writeHiddenFacilityKeys(hiddenKeys);
}

export function restoreHiddenFacilityToRegistry(facility: FacilityRegistryRecord) {
  const hiddenKeys = readHiddenFacilityKeys();
  facilityIdentityKeys(facility).forEach((key) => hiddenKeys.delete(key));
  writeHiddenFacilityKeys(hiddenKeys);
}

export function isFacilityHidden(facility: FacilityRegistryRecord) {
  const hiddenKeys = readHiddenFacilityKeys();
  return facilityIdentityKeys(facility).some((key) => hiddenKeys.has(key));
}

export function applyHiddenFacilityFilter(facilities: FacilityRegistryRecord[]) {
  return facilities.filter((facility) => !isFacilityHidden(facility));
}

/**
 * Dedupes facilities while preserving the first occurrence.
 *
 * Existing/API facilities must be passed before seeded defaults so old facility
 * IDs remain visible and old appointment/resident records stay reachable.
 */
export function dedupeFacilities(facilities: FacilityRegistryRecord[]) {
  const kept: FacilityRegistryRecord[] = [];
  const seenKeys = new Set<string>();

  facilities.forEach((facility) => {
    if (String(facility.status || "active").toLowerCase() === "inactive") return;
    if (isFacilityHidden(facility)) return;

    const keys = facilityIdentityKeys(facility);
    if (!keys.length) return;

    const isDuplicate = keys.some((key) => seenKeys.has(key));
    if (isDuplicate) return;

    kept.push(facility);
    keys.forEach((key) => seenKeys.add(key));
  });

  return kept;
}

export const SEEDED_FACILITY_REGISTRY = dedupeFacilities(normalizeFacilityList({ facilities: DEFAULT_FACILITIES }));

export function mergeWithSeededFacilities(apiFacilities: unknown) {
  const existingFacilities = normalizeFacilityList(apiFacilities);
  if (!existingFacilities.length) return SEEDED_FACILITY_REGISTRY;
  return dedupeFacilities([...existingFacilities, ...normalizeFacilityList({ facilities: DEFAULT_FACILITIES })]);
}
