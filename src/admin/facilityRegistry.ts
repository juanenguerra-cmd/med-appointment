import { DEFAULT_FACILITIES } from "./defaultFacilities";

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

function facilityIdentityKeys(facility: FacilityRegistryRecord) {
  return [
    facility.id ? `id:${normalizeText(facility.id)}` : "",
    facility.code ? `code:${normalizeText(facility.code)}` : "",
    facility.name ? `name:${normalizeText(facility.name)}` : "",
  ].filter(Boolean);
}

/**
 * Dedupes facilities while preserving the first occurrence.
 *
 * This is intentional because existing appointment/resident data may already be
 * linked to the first facility ID shown in the app. Later duplicates from API
 * overlays or legacy sources are ignored when they match by ID, code, or name.
 */
export function dedupeFacilities(facilities: FacilityRegistryRecord[]) {
  const kept: FacilityRegistryRecord[] = [];
  const seenKeys = new Set<string>();

  facilities.forEach((facility) => {
    if (String(facility.status || "active").toLowerCase() === "inactive") return;

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
  return dedupeFacilities([...SEEDED_FACILITY_REGISTRY, ...normalizeFacilityList(apiFacilities)]);
}
