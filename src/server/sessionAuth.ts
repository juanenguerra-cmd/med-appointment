const ADMIN_ROLE_IDS = new Set([
  "admin",
  "role-super-admin",
  "role-org-admin",
  "role-facility-admin",
]);

const PRIVILEGED_ADMIN_ROLE_IDS = new Set([
  "role-super-admin",
  "role-org-admin",
]);

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  username: string;
  role: string;
  roleIds: string[];
  status: string;
  title: string;
  department: string;
  staffId: string;
  payrollNo: string;
  defaultFacilityId: string;
  assignedFacilityIds: string[];
  customPermissions: Record<string, unknown>;
  forcePasswordReset: boolean;
  lastLogin: string;
}

export function safeString(value: unknown, fallback = ""): string {
  if (value === undefined || value === null) return fallback;
  return String(value);
}

export function safeLower(value: unknown, fallback = ""): string {
  return safeString(value, fallback).trim().toLowerCase();
}

export function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => safeString(item)).filter(Boolean);
  const text = safeString(value).trim();
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed.map((item) => safeString(item)).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function parseJsonObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  const text = safeString(value).trim();
  if (!text) return {};
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

export function toBooleanFlag(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  const normalized = safeLower(value);
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export function normalizeRoleIds(raw: any): string[] {
  const parsed = parseJsonArray(raw?.roleIds);
  const fromShape = [
    raw?.role,
    raw?.roleId,
    ...(Array.isArray(raw?.roles) ? raw.roles : []),
  ]
    .map((item) => safeString(item))
    .filter(Boolean);
  const unique = Array.from(new Set([...parsed, ...fromShape]));
  if (unique.length > 0) return unique;
  const role = safeString(raw?.role || "staff");
  if (safeLower(role) === "admin") return ["admin", "role-facility-admin"];
  return [role];
}

export function normalizeDatabaseUser(raw: any, assignedFacilityIds: string[] = []): AuthenticatedUser {
  const roleIds = normalizeRoleIds(raw);
  const email = safeString(raw?.email);
  const defaultFacilityId =
    safeString(raw?.defaultFacilityId) ||
    assignedFacilityIds[0] ||
    "";

  return {
    id: safeString(raw?.id),
    email,
    fullName: safeString(raw?.fullName),
    username: safeString(raw?.username) || safeLower(email.split("@")[0]),
    role: safeString(raw?.role || roleIds[0] || "staff"),
    roleIds,
    status: safeLower(raw?.status || "active") || "active",
    title: safeString(raw?.title),
    department: safeString(raw?.department),
    staffId: safeString(raw?.staffId),
    payrollNo: safeString(raw?.payrollNo),
    defaultFacilityId,
    assignedFacilityIds,
    customPermissions: parseJsonObject(raw?.customPermissions),
    forcePasswordReset: toBooleanFlag(raw?.forcePasswordReset),
    lastLogin: safeString(raw?.lastLogin),
  };
}

export function hasAdminAccess(user?: Pick<AuthenticatedUser, "role" | "roleIds"> | null): boolean {
  const roles = [safeString(user?.role), ...(user?.roleIds || [])].filter(Boolean);
  return roles.some((role) => ADMIN_ROLE_IDS.has(role));
}

export function hasPrivilegedAdminAccess(user?: Pick<AuthenticatedUser, "role" | "roleIds"> | null): boolean {
  const roles = [safeString(user?.role), ...(user?.roleIds || [])].filter(Boolean);
  return roles.some((role) => PRIVILEGED_ADMIN_ROLE_IDS.has(role));
}

export function isProtectedRole(roleId: string): boolean {
  return PRIVILEGED_ADMIN_ROLE_IDS.has(roleId);
}

export function hasFacilityAccess(user: Pick<AuthenticatedUser, "role" | "roleIds" | "assignedFacilityIds" | "defaultFacilityId"> | null | undefined, facilityId?: string | null): boolean {
  if (!facilityId) return true;
  if (!user) return false;
  if (hasPrivilegedAdminAccess(user)) return true;
  if (safeLower(user.role) === "admin") {
    if (!user.assignedFacilityIds?.length && !user.defaultFacilityId) return true;
  }
  return Boolean(
    user.defaultFacilityId === facilityId ||
    user.assignedFacilityIds?.includes(facilityId),
  );
}

export function sharesFacilityAccess(
  user: Pick<AuthenticatedUser, "role" | "roleIds" | "assignedFacilityIds" | "defaultFacilityId"> | null | undefined,
  facilityIds: string[],
): boolean {
  if (!facilityIds.length) return true;
  return facilityIds.every((facilityId) => hasFacilityAccess(user, facilityId));
}
