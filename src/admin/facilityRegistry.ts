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

function facilityDedupeKey(facility: FacilityRegistryRecord) {
  const id = facility.id.trim().toLowerCase();
  if (id) return `id:${id}`;
  const code = String(facility.code || "").trim().toLowerCase();
  if (code) return `code:${code}`;
  return `name:${facility.name.trim().toLowerCase().replace(/\s+/g, " ")}`;
}

export function dedupeFacilities(facilities: FacilityRegistryRecord[]) {
  const map = new Map<string, FacilityRegistryRecord>();
  facilities.forEach((facility) => {
    if (String(facility.status || "active").toLowerCase() === "inactive") return;
    const key = facilityDedupeKey(facility);
    const existing = map.get(key);
    map.set(key, existing ? { ...existing, ...facility, id: existing.id || facility.id, name: facility.name || existing.name } : facility);
  });
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export const SEEDED_FACILITY_REGISTRY = dedupeFacilities(normalizeFacilityList({ facilities: DEFAULT_FACILITIES }));

export function mergeWithSeededFacilities(apiFacilities: unknown) {
  return dedupeFacilities([...SEEDED_FACILITY_REGISTRY, ...normalizeFacilityList(apiFacilities)]);
}
