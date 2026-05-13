import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { Hono } from 'hono';
import { MIN_PASSWORD_LENGTH } from './auth/passwordPolicy';
import { registerCensusReconcileRoute } from './server/censusReconcile';
import {
  hasAdminAccess,
  hasFacilityAccess,
  hasPrivilegedAdminAccess,
  isProtectedRole,
  normalizeDatabaseUser,
  normalizeRoleIds,
  parseJsonArray,
  safeLower,
  safeString,
  sharesFacilityAccess,
  toBooleanFlag,
  type AuthenticatedUser,
} from './server/sessionAuth';
import { writeAuditLog } from './server/routes/adminRestoreRoutes';
import { registerTransportationRoutes } from './server/routes/transportationRoutes';
import { registerAdminSecurityRoutes } from './server/routes/adminSecurityRoutes';

export interface Env {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Env }>().basePath('/api');

const toNull = (val: unknown) => (val === undefined ? null : val);
const isIsoDate = (value: unknown): boolean => /^\d{4}-\d{2}-\d{2}$/.test(safeString(value).trim());
const isBlank = (value: unknown): boolean => {
  const text = safeString(value).trim();
  return !text || text === '—';
};

const PASSWORD_HASH_SCHEME = 'pbkdf2-sha256';
const PASSWORD_HASH_ITERATIONS = 100_000;
const PASSWORD_HASH_PREFIX = `${PASSWORD_HASH_SCHEME}$${PASSWORD_HASH_ITERATIONS}$`;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function derivePasswordHash(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations: PASSWORD_HASH_ITERATIONS,
    },
    keyMaterial,
    256,
  );

  return new Uint8Array(bits);
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePasswordHash(password, salt);
  return `${PASSWORD_HASH_PREFIX}${bytesToBase64(salt)}$${bytesToBase64(hash)}`;
}

function isPasswordHash(value: unknown): boolean {
  return safeString(value).startsWith(PASSWORD_HASH_PREFIX);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

async function verifyPassword(password: string, storedPassword: unknown): Promise<{ ok: boolean; needsUpgrade: boolean }> {
  const stored = safeString(storedPassword);
  if (!stored) return { ok: false, needsUpgrade: false };

  if (!isPasswordHash(stored)) {
    return { ok: stored === password, needsUpgrade: stored === password };
  }

  const parts = stored.split('$');
  if (parts.length !== 4) return { ok: false, needsUpgrade: false };

  const [, iterationsText, saltBase64, hashBase64] = parts;
  if (Number(iterationsText) !== PASSWORD_HASH_ITERATIONS) {
    return { ok: false, needsUpgrade: false };
  }

  try {
    const salt = base64ToBytes(saltBase64);
    const expectedHash = base64ToBytes(hashBase64);
    const actualHash = await derivePasswordHash(password, salt);
    return { ok: timingSafeEqual(actualHash, expectedHash), needsUpgrade: false };
  } catch {
    return { ok: false, needsUpgrade: false };
  }
}

type ValidationIssue = { field: string; message: string; severity: 'warning' | 'error' };

type ValidationResult = {
  ok: boolean;
  issues: ValidationIssue[];
};

const VALID_APPOINTMENT_STATUSES = new Set([
  'Scheduled',
  'Completed',
  'Cancelled',
  'Pending',
  'Hospitalized',
  'Discontinued',
  'Deferred',
  'Rescheduled',
  'Pending Scheduling Review',
]);

function validateRequired(issues: ValidationIssue[], field: string, value: unknown, label: string) {
  if (isBlank(value)) {
    issues.push({ field, message: `${label} is required.`, severity: 'error' });
  }
}

function validateOptionalIsoDate(issues: ValidationIssue[], field: string, value: unknown, label: string) {
  const text = safeString(value).trim();
  if (text && text !== '—' && !isIsoDate(text)) {
    issues.push({ field, message: `${label} should use YYYY-MM-DD format.`, severity: 'error' });
  }
}

function buildValidationResponse(issues: ValidationIssue[]): ValidationResult {
  return {
    ok: issues.every((issue) => issue.severity !== 'error'),
    issues,
  };
}

function validateFacilityPayload(payload: any, mode: 'create' | 'patch'): ValidationResult {
  const issues: ValidationIssue[] = [];
  if (mode === 'create') {
    validateRequired(issues, 'id', payload?.id, 'Facility ID');
    validateRequired(issues, 'name', payload?.name, 'Facility name');
  } else if ('name' in (payload || {})) {
    validateRequired(issues, 'name', payload?.name, 'Facility name');
  }
  return buildValidationResponse(issues);
}

function validateResidentPayload(payload: any, mode: 'create' | 'patch'): ValidationResult {
  const issues: ValidationIssue[] = [];
  if (mode === 'create') {
    validateRequired(issues, 'id', payload?.id, 'Resident ID');
    validateRequired(issues, 'facilityId', payload?.facilityId, 'Facility ID');
    validateRequired(issues, 'name', payload?.name, 'Resident name');
    validateRequired(issues, 'roomNumber', payload?.roomNumber, 'Room number');
  }

  if ('name' in (payload || {})) validateRequired(issues, 'name', payload?.name, 'Resident name');
  if ('roomNumber' in (payload || {})) validateRequired(issues, 'roomNumber', payload?.roomNumber, 'Room number');
  if ('admissionDate' in (payload || {})) validateOptionalIsoDate(issues, 'admissionDate', payload?.admissionDate, 'Admission date');

  return buildValidationResponse(issues);
}

function validateAppointmentPayload(payload: any, mode: 'create' | 'patch'): ValidationResult {
  const issues: ValidationIssue[] = [];
  if (mode === 'create') {
    validateRequired(issues, 'id', payload?.id, 'Appointment ID');
    validateRequired(issues, 'facilityId', payload?.facilityId, 'Facility ID');
    validateRequired(issues, 'residentName', payload?.residentName, 'Resident name');
    validateRequired(issues, 'type', payload?.type, 'Specialty');
  }

  if ('residentName' in (payload || {})) validateRequired(issues, 'residentName', payload?.residentName, 'Resident name');
  if ('date' in (payload || {})) validateOptionalIsoDate(issues, 'date', payload?.date, 'Appointment date');
  if ('type' in (payload || {})) validateRequired(issues, 'type', payload?.type, 'Specialty');
  if ('schedulingDate' in (payload || {})) validateOptionalIsoDate(issues, 'schedulingDate', payload?.schedulingDate, 'Transport scheduling date');
  if ('referralDate' in (payload || {})) validateOptionalIsoDate(issues, 'referralDate', payload?.referralDate, 'Referral date');
  if ('status' in (payload || {}) && payload?.status && !VALID_APPOINTMENT_STATUSES.has(safeString(payload.status))) {
    issues.push({ field: 'status', message: 'Appointment status is not recognized.', severity: 'error' });
  }

  return buildValidationResponse(issues);
}

function rejectIfInvalid(c: any, result: ValidationResult) {
  if (result.ok) return null;
  return c.json({ success: false, error: 'Validation failed', issues: result.issues }, 400);
}

const FACILITY_UPDATE_FIELDS = new Set([
  'name',
  'address',
  'phone',
  'contactPerson',
]);

const RESIDENT_UPDATE_FIELDS = new Set([
  'name',
  'mrn',
  'lastName',
  'firstName',
  'age',
  'floor',
  'unit',
  'roomNumber',
  'sex',
  'admissionDate',
  'allergies',
  'doctor',
  'diagnosis',
  'notes',
  'lastVisit',
  'status',
  'dischargedAt',
  'lastSeenCensusAt',
  'dischargeBatchId',
]);

const APPOINTMENT_UPDATE_FIELDS = new Set([
  'residentId',
  'residentMrn',
  'origin',
  'residentName',
  'unit',
  'roomNumber',
  'providerName',
  'location',
  'contactNumber',
  'schedulingDate',
  'referralDate',
  'status',
  'date',
  'time',
  'pickUpTime',
  'type',
  'description',
  'serviceInHouse',
  'reasonSendOut',
  'transportType',
  'transportCompany',
  'transportCompanyId',
  'transportCompanyPhone',
  'transportCompanyOther',
  'payerForRide',
  'roundTrip',
  'escort',
  'oxygen',
  'notes',
  'weight',
  'height',
  'nurseCompleting',
  'reasonConsultation',
  'transportTypeOther',
  'payerForRideOther',
  'escortDetails',
  'escortPhone',
  'consultReason',
  'ambulating',
  'wheelchair',
  'withLift',
  'recliner',
  'bariatric',
]);

type SafeUpdate = {
  keys: string[];
  setClause: string;
  values: any[];
  rejectedKeys: string[];
};

function buildSafeUpdate(updates: Record<string, any>, allowedFields: Set<string>): SafeUpdate | null {
  const incomingKeys = Object.keys(updates || {});
  const keys = incomingKeys.filter((key) => allowedFields.has(key));
  const rejectedKeys = incomingKeys.filter((key) => !allowedFields.has(key));

  if (keys.length === 0) {
    return null;
  }

  return {
    keys,
    setClause: keys.map((key) => `${key} = ?`).join(', '),
    values: keys.map((key) => toNull(updates[key])),
    rejectedKeys,
  };
}

const USER_UPDATE_FIELDS = new Set([
  'email',
  'fullName',
  'username',
  'role',
  'roleIds',
  'staffId',
  'title',
  'department',
  'payrollNo',
  'status',
  'defaultFacilityId',
  'customPermissions',
  'forcePasswordReset',
  'password',
  'temporaryPassword',
]);

const AUTH_SESSION_COOKIE = 'med_appointment_session';
const SETUP_SESSION_COOKIE = 'med_appointment_setup';
const AUTH_SESSION_TTL_SECONDS = 60 * 60 * 12;
const SETUP_SESSION_TTL_SECONDS = 60 * 30;

type SessionPurpose = 'auth' | 'setup';
type SessionRecord = {
  id: string;
  userId: string;
  purpose: SessionPurpose;
  expiresAt: string;
};

const protectedRoutePrefixes = [
  '/api/facilities',
  '/api/users',
  '/api/staff',
  '/api/residents',
  '/api/appointments',
  '/api/transportation-companies',
  '/api/admin',
  '/api/audit-logs',
  '/api/deleted',
  '/api/restore',
  '/api/soft-delete',
  '/api/census',
  '/api/auth',
];

function isProtectedRoute(path: string): boolean {
  if (path === '/api/login' || path === '/api/setup-password' || path === '/api/health') return false;
  return protectedRoutePrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function getCookieOptions(c: any, maxAge: number) {
  return {
    path: '/',
    httpOnly: true,
    sameSite: 'Strict' as const,
    secure: new URL(c.req.url).protocol === 'https:',
    maxAge,
  };
}

async function loadAssignedFacilityIds(db: D1Database, userId: string): Promise<string[]> {
  try {
    const { results } = await db.prepare('SELECT facilityId FROM user_facilities WHERE userId = ? ORDER BY facilityId ASC').bind(userId).all();
    return (results || []).map((row: any) => safeString(row?.facilityId)).filter(Boolean);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('no such table: user_facilities')) return [];
    throw error;
  }
}

async function loadDatabaseUser(db: D1Database, userId: string): Promise<AuthenticatedUser | null> {
  const row = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first() as any;
  if (!row) return null;
  const assignedFacilityIds = await loadAssignedFacilityIds(db, userId);
  return normalizeDatabaseUser(row, assignedFacilityIds);
}

async function listNormalizedUsers(db: D1Database): Promise<AuthenticatedUser[]> {
  const { results } = await db.prepare('SELECT * FROM users ORDER BY COALESCE(fullName, email, id) ASC').all();
  const facilityRows = await db.prepare('SELECT userId, facilityId FROM user_facilities ORDER BY userId, facilityId').all();
  const facilityMap = new Map<string, string[]>();
  for (const row of (facilityRows.results || []) as any[]) {
    const userId = safeString(row?.userId);
    const facilityId = safeString(row?.facilityId);
    if (!userId || !facilityId) continue;
    const current = facilityMap.get(userId) || [];
    current.push(facilityId);
    facilityMap.set(userId, current);
  }
  return ((results || []) as any[]).map((row) => normalizeDatabaseUser(row, facilityMap.get(safeString(row?.id)) || []));
}

function sanitizeUserResponse(user: AuthenticatedUser) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    username: user.username,
    role: user.role,
    roleIds: user.roleIds,
    staffId: user.staffId,
    title: user.title,
    department: user.department,
    payrollNo: user.payrollNo,
    status: user.status,
    defaultFacilityId: user.defaultFacilityId,
    assignedFacilityIds: user.assignedFacilityIds,
    customPermissions: user.customPermissions,
    forcePasswordReset: user.forcePasswordReset,
    lastLogin: user.lastLogin,
  };
}

async function createSession(db: D1Database, userId: string, purpose: SessionPurpose, ttlSeconds: number): Promise<SessionRecord> {
  await ensureAuthSessionSchema(db);
  const session: SessionRecord = {
    id: crypto.randomUUID(),
    userId,
    purpose,
    expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
  };
  await db.prepare(`
    INSERT INTO auth_sessions (id, userId, purpose, expiresAt, createdAt)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).bind(session.id, session.userId, session.purpose, session.expiresAt).run();
  return session;
}

async function deleteSession(db: D1Database, sessionId?: string | null) {
  const value = safeString(sessionId).trim();
  if (!value) return;
  await ensureAuthSessionSchema(db);
  await db.prepare('DELETE FROM auth_sessions WHERE id = ?').bind(value).run();
}

async function readSession(c: any, purpose: SessionPurpose): Promise<{ session: SessionRecord; user: AuthenticatedUser } | null> {
  await ensureAuthSessionSchema(c.env.DB);
  const cookieName = purpose === 'auth' ? AUTH_SESSION_COOKIE : SETUP_SESSION_COOKIE;
  const sessionId = safeString(getCookie(c, cookieName)).trim();
  if (!sessionId) return null;

  const row = await c.env.DB.prepare(`
    SELECT id, userId, purpose, expiresAt
    FROM auth_sessions
    WHERE id = ? AND purpose = ?
  `).bind(sessionId, purpose).first() as SessionRecord | null;

  if (!row) {
    deleteCookie(c, cookieName, getCookieOptions(c, 0));
    return null;
  }

  if (new Date(row.expiresAt).getTime() <= Date.now()) {
    await deleteSession(c.env.DB, row.id);
    deleteCookie(c, cookieName, getCookieOptions(c, 0));
    return null;
  }

  const user = await loadDatabaseUser(c.env.DB, row.userId);
  if (!user || safeLower(user.status) === 'inactive') {
    await deleteSession(c.env.DB, row.id);
    deleteCookie(c, cookieName, getCookieOptions(c, 0));
    return null;
  }

  return { session: row, user };
}

async function ensureAuthSessionSchema(db: D1Database) {
  await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS auth_sessions (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        purpose TEXT NOT NULL,
        expiresAt TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_purpose ON auth_sessions(userId, purpose)'),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_auth_sessions_expiry ON auth_sessions(expiresAt)'),
  ]);
}

function requireAuthUser(c: any): AuthenticatedUser {
  const authUser = c.get('authUser') as AuthenticatedUser | undefined;
  if (!authUser) {
    throw new Error('Authenticated user context is missing.');
  }
  return authUser;
}

function assertAdmin(c: any, user = requireAuthUser(c)) {
  if (!hasAdminAccess(user)) {
    return c.json({ success: false, error: 'Admin access required' }, 403);
  }
  return null;
}

function assertFacilityAccess(c: any, facilityId?: string | null, user = requireAuthUser(c)) {
  if (!hasFacilityAccess(user, facilityId)) {
    return c.json({ success: false, error: 'Facility access denied' }, 403);
  }
  return null;
}

async function getResidentFacilityId(db: D1Database, id: string): Promise<string> {
  const row = await db.prepare('SELECT facilityId FROM residents WHERE id = ?').bind(id).first() as { facilityId?: string } | null;
  return safeString(row?.facilityId);
}

async function getAppointmentFacilityId(db: D1Database, id: string): Promise<string> {
  const row = await db.prepare('SELECT facilityId FROM appointments WHERE id = ?').bind(id).first() as { facilityId?: string } | null;
  return safeString(row?.facilityId);
}

function getNormalizedRoleIds(payload: any): string[] {
  const roleIds = normalizeRoleIds(payload).map((roleId) => safeString(roleId)).filter(Boolean);
  return Array.from(new Set(roleIds));
}

function getUserPasswordInput(payload: any): string {
  return safeString(payload?.temporaryPassword || payload?.password).trim();
}

async function replaceUserFacilities(db: D1Database, userId: string, facilityIds: string[]) {
  const statements: D1PreparedStatement[] = [
    db.prepare('DELETE FROM user_facilities WHERE userId = ?').bind(userId),
  ];
  for (const facilityId of facilityIds) {
    statements.push(db.prepare('INSERT INTO user_facilities (userId, facilityId) VALUES (?, ?)').bind(userId, facilityId));
  }
  await db.batch(statements);
}

async function persistUserRecord(
  c: any,
  payload: any,
  mode: 'create' | 'update',
  requestedUserId?: string,
) {
  const actor = requireAuthUser(c);
  const adminResponse = assertAdmin(c, actor);
  if (adminResponse) return adminResponse;

  const userId = safeString(requestedUserId || payload?.id).trim() || crypto.randomUUID();
  const existingUser = mode === 'update' ? await loadDatabaseUser(c.env.DB, userId) : null;
  if (mode === 'update' && !existingUser) {
    return c.json({ success: false, error: 'User not found' }, 404);
  }

  const email = safeLower(payload?.email ?? existingUser?.email);
  const fullName = safeString(payload?.fullName ?? existingUser?.fullName).trim();
  const username = safeLower((payload?.username ?? existingUser?.username) || email.split('@')[0]);
  const assignedFacilityIds = Array.from(new Set(
    (
      parseJsonArray(payload?.assignedFacilityIds).length
        ? parseJsonArray(payload?.assignedFacilityIds)
        : existingUser?.assignedFacilityIds || []
    ).filter(Boolean),
  ));
  if (assignedFacilityIds.length === 0 && actor.defaultFacilityId) {
    assignedFacilityIds.push(actor.defaultFacilityId);
  }
  const defaultFacilityId =
    safeString(payload?.defaultFacilityId ?? existingUser?.defaultFacilityId).trim() ||
    assignedFacilityIds[0] ||
    actor.defaultFacilityId;
  const roleIds = Array.from(new Set(
    (
      getNormalizedRoleIds(payload).length
        ? getNormalizedRoleIds(payload)
        : existingUser?.roleIds || []
    ).filter(Boolean),
  ));
  const primaryRole = safeString((payload?.role ?? existingUser?.role ?? roleIds[0]) || 'staff');
  const status = safeLower((payload?.status ?? existingUser?.status) || 'active') || 'active';

  if (!email || !fullName || !username) {
    return c.json({ success: false, error: 'email, fullName, and username are required' }, 400);
  }
  if (assignedFacilityIds.length === 0 || !defaultFacilityId) {
    return c.json({ success: false, error: 'At least one assigned facility and a defaultFacilityId are required' }, 400);
  }
  if (!sharesFacilityAccess(actor, assignedFacilityIds)) {
    return c.json({ success: false, error: 'Cannot assign users outside your facility scope' }, 403);
  }
  if (!assignedFacilityIds.includes(defaultFacilityId)) {
    return c.json({ success: false, error: 'defaultFacilityId must be one of assignedFacilityIds' }, 400);
  }
  if (roleIds.some((roleId) => isProtectedRole(roleId)) && !hasPrivilegedAdminAccess(actor)) {
    return c.json({ success: false, error: 'Only org or super admins may assign protected roles' }, 403);
  }

  const passwordInput = getUserPasswordInput(payload);
  const passwordHash = passwordInput ? await hashPassword(passwordInput) : null;
  const customPermissionsValue =
    payload?.customPermissions !== undefined
      ? payload.customPermissions
      : existingUser?.customPermissions;
  const customPermissions = customPermissionsValue && typeof customPermissionsValue === 'object'
    ? JSON.stringify(customPermissionsValue)
    : null;
  const forcePasswordReset = payload?.forcePasswordReset === undefined
    ? (existingUser?.forcePasswordReset ? 1 : 0)
    : (toBooleanFlag(payload.forcePasswordReset) ? 1 : 0);
  const deactivatedAt = status === 'inactive' ? new Date().toISOString() : null;

  if (mode === 'create') {
    await c.env.DB.prepare(`
      INSERT INTO users (
        id, email, fullName, username, role, roleIds, staffId, title, department, payrollNo,
        status, defaultFacilityId, customPermissions, forcePasswordReset, password, deactivatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      email,
      fullName,
      username,
      primaryRole,
      JSON.stringify(roleIds),
      toNull(payload?.staffId ?? existingUser?.staffId),
      toNull(payload?.title ?? existingUser?.title),
      toNull(payload?.department ?? existingUser?.department),
      toNull(payload?.payrollNo ?? existingUser?.payrollNo),
      status,
      defaultFacilityId,
      customPermissions,
      forcePasswordReset,
      passwordHash,
      toNull(deactivatedAt),
    ).run();
  } else {
    const safeUpdate = buildSafeUpdate({
      email,
      fullName,
      username,
      role: primaryRole,
      roleIds: JSON.stringify(roleIds),
      staffId: payload?.staffId ?? existingUser?.staffId,
      title: payload?.title ?? existingUser?.title,
      department: payload?.department ?? existingUser?.department,
      payrollNo: payload?.payrollNo ?? existingUser?.payrollNo,
      status,
      defaultFacilityId,
      customPermissions,
      forcePasswordReset,
      deactivatedAt,
      ...(passwordHash ? { password: passwordHash } : {}),
    }, new Set([...USER_UPDATE_FIELDS, 'deactivatedAt']));

    if (!safeUpdate) {
      return c.json({ success: false, error: 'No valid user fields to update' }, 400);
    }

    await c.env.DB.prepare(`UPDATE users SET ${safeUpdate.setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .bind(...safeUpdate.values, userId)
      .run();
  }

  await replaceUserFacilities(c.env.DB, userId, assignedFacilityIds);
  const stored = await loadDatabaseUser(c.env.DB, userId);
  await writeAuditLog(c.env.DB, {
    facilityId: defaultFacilityId,
    actorId: actor.id,
    action: mode === 'create' ? 'create' : 'update',
    entity: 'user',
    entityId: userId,
    summary: mode === 'create' ? `User created: ${fullName}` : `User updated: ${fullName}`,
    metadata: {
      assignedFacilityIds,
      roleIds,
      status,
    },
  });
  return c.json({ success: true, user: stored ? sanitizeUserResponse(stored) : null }, mode === 'create' ? 201 : 200);
}

// Middleware to check for DB binding
app.use('*', async (c, next) => {
  if (!c.env.DB) {
    console.error("D1 DB binding is missing. Check wrangler.toml and dev setup.");
    return c.json({ 
      success: false, 
      error: "Database configuration error. Please check backend bindings." 
    }, 500);
  }
  if (isProtectedRoute(c.req.path)) {
    const auth = await readSession(c, 'auth');
    if (!auth) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }
    (c as any).set('authUser', auth.user);
    (c as any).set('authSession', auth.session);
  } else if (c.req.path === '/api/setup-password') {
    const setup = await readSession(c, 'setup');
    if (!setup) {
      return c.json({ success: false, error: 'Password setup session is missing or expired' }, 401);
    }
    (c as any).set('setupSession', setup.session);
    (c as any).set('setupUser', setup.user);
  }
  await next();
});

// Global error handler to always return JSON
app.onError((err, c) => {
  console.error("Hono error:", err);
  return c.json({ success: false, error: err.message || 'Internal Server Error' }, 500);
});

// Basic health check
app.get('/health', async (c) => {
  const dbCheck = await c.env.DB.prepare("SELECT 1 as ok").first();
  return c.json({
    status: 'ok',
    time: new Date().toISOString(),
    database: dbCheck?.ok === 1 ? 'Connected' : 'Disconnected'
  });
});

app.get('/auth/session', async (c) => {
  const user = requireAuthUser(c);
  return c.json({ success: true, user: sanitizeUserResponse(user) });
});

app.post('/auth/logout', async (c) => {
  const authSession = (c as any).get('authSession') as SessionRecord | undefined;
  await deleteSession(c.env.DB, authSession?.id);
  deleteCookie(c, AUTH_SESSION_COOKIE, getCookieOptions(c, 0));
  return c.json({ success: true });
});

// Facilities API
app.get('/facilities', async (c) => {
  const authUser = requireAuthUser(c);
  if (hasPrivilegedAdminAccess(authUser) || (safeLower(authUser.role) === 'admin' && authUser.assignedFacilityIds.length === 0 && !authUser.defaultFacilityId)) {
    const { results } = await c.env.DB.prepare('SELECT * FROM facilities ORDER BY name ASC').all();
    return c.json(results);
  }

  const scopeIds = Array.from(new Set([...authUser.assignedFacilityIds, authUser.defaultFacilityId].filter(Boolean)));
  if (scopeIds.length === 0) return c.json([]);
  const placeholders = scopeIds.map(() => '?').join(', ');
  const { results } = await c.env.DB.prepare(`
    SELECT * FROM facilities
    WHERE id IN (${placeholders})
    ORDER BY name ASC
  `).bind(...scopeIds).all();
  return c.json(results);
});

app.post('/facilities', async (c) => {
  const adminResponse = assertAdmin(c);
  if (adminResponse) return adminResponse;
  const fac = await c.req.json() as any;
  const validationResponse = rejectIfInvalid(c, validateFacilityPayload(fac, 'create'));
  if (validationResponse) return validationResponse;

  await c.env.DB.prepare(`
    INSERT INTO facilities (id, name, address, phone, contactPerson)
    VALUES (?, ?, ?, ?, ?)
  `).bind(toNull(fac.id), toNull(fac.name), toNull(fac.address), toNull(fac.phone), toNull(fac.contactPerson)).run();
  return c.json({ success: true, facility: fac }, 201);
});

app.patch('/facilities/:id', async (c) => {
  const adminResponse = assertAdmin(c);
  if (adminResponse) return adminResponse;
  const id = c.req.param('id');
  const accessResponse = assertFacilityAccess(c, id);
  if (accessResponse) return accessResponse;
  const updates = await c.req.json() as any;
  const safeUpdate = buildSafeUpdate(updates, FACILITY_UPDATE_FIELDS);

  if (!safeUpdate) {
    return c.json({ success: false, error: 'No valid facility fields to update' }, 400);
  }

  const validationPayload = Object.fromEntries(safeUpdate.keys.map((key) => [key, updates[key]]));
  const validationResponse = rejectIfInvalid(c, validateFacilityPayload(validationPayload, 'patch'));
  if (validationResponse) return validationResponse;
  
  await c.env.DB.prepare(`UPDATE facilities SET ${safeUpdate.setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .bind(...safeUpdate.values, id)
    .run();
  return c.json({ success: true, rejectedFields: safeUpdate.rejectedKeys });
});

app.post('/facilities/update', async (c) => {
  const adminResponse = assertAdmin(c);
  if (adminResponse) return adminResponse;
  const body = await c.req.json() as any;
  const id = safeString(body?.id).trim();
  if (!id) return c.json({ success: false, error: 'Facility id is required' }, 400);
  const accessResponse = assertFacilityAccess(c, id);
  if (accessResponse) return accessResponse;
  const safeUpdate = buildSafeUpdate(body, FACILITY_UPDATE_FIELDS);
  if (!safeUpdate) return c.json({ success: false, error: 'No valid facility fields to update' }, 400);
  const validationPayload = Object.fromEntries(safeUpdate.keys.map((key) => [key, body[key]]));
  const validationResponse = rejectIfInvalid(c, validateFacilityPayload(validationPayload, 'patch'));
  if (validationResponse) return validationResponse;

  await c.env.DB.prepare(`UPDATE facilities SET ${safeUpdate.setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .bind(...safeUpdate.values, id)
    .run();
  return c.json({ success: true, rejectedFields: safeUpdate.rejectedKeys });
});

app.delete('/facilities/:id', async (c) => {
  const adminResponse = assertAdmin(c);
  if (adminResponse) return adminResponse;
  const id = c.req.param('id');
  const accessResponse = assertFacilityAccess(c, id);
  if (accessResponse) return accessResponse;
  await c.env.DB.prepare("DELETE FROM facilities WHERE id = ?").bind(id).run();
  return new Response(null, { status: 204 });
});

// Users and Permissions API
app.get('/users', async (c) => {
  const authUser = requireAuthUser(c);
  const adminResponse = assertAdmin(c, authUser);
  if (adminResponse) return adminResponse;
  const users = await listNormalizedUsers(c.env.DB);
  const visibleUsers = hasPrivilegedAdminAccess(authUser) || safeLower(authUser.role) === 'admin' && authUser.assignedFacilityIds.length === 0
    ? users
    : users.filter((user) => user.assignedFacilityIds.some((facilityId) => hasFacilityAccess(authUser, facilityId)));
  return c.json({ users: visibleUsers.map(sanitizeUserResponse) });
});

app.post('/login', async (c) => {
  await ensureAuthSessionSchema(c.env.DB);
  const { email, password } = await c.req.json() as any;
  const user = await c.env.DB.prepare("SELECT * FROM users WHERE LOWER(email) = ?").bind(safeLower(email)).first() as any;
  
  if (!user) {
    return c.json({ success: false, error: "User not found" }, 404);
  }

  const normalizedUser = await loadDatabaseUser(c.env.DB, safeString(user.id));
  if (!normalizedUser || safeLower(normalizedUser.status) === 'inactive') {
    return c.json({ success: false, error: 'User account is inactive' }, 403);
  }

  // If password is not set yet, they need to create one (first time login)
  if (!user.password) {
    const setupSession = await createSession(c.env.DB, user.id, 'setup', SETUP_SESSION_TTL_SECONDS);
    setCookie(c, SETUP_SESSION_COOKIE, setupSession.id, getCookieOptions(c, SETUP_SESSION_TTL_SECONDS));
    deleteCookie(c, AUTH_SESSION_COOKIE, getCookieOptions(c, 0));
    return c.json({ success: false, needsPasswordSetup: true, userId: user.id }, 200);
  }

  const passwordCheck = await verifyPassword(safeString(password), user.password);
  if (!passwordCheck.ok) {
    return c.json({ success: false, error: "Invalid password" }, 401);
  }

  if (passwordCheck.needsUpgrade) {
    const upgradedHash = await hashPassword(safeString(password));
    await c.env.DB.prepare("UPDATE users SET password = ?, lastLogin = CURRENT_TIMESTAMP WHERE id = ?").bind(upgradedHash, user.id).run();
  } else {
    await c.env.DB.prepare("UPDATE users SET lastLogin = CURRENT_TIMESTAMP WHERE id = ?").bind(user.id).run();
  }

  await c.env.DB.prepare("DELETE FROM auth_sessions WHERE userId = ? AND purpose = 'auth'").bind(user.id).run();
  const session = await createSession(c.env.DB, user.id, 'auth', AUTH_SESSION_TTL_SECONDS);
  setCookie(c, AUTH_SESSION_COOKIE, session.id, getCookieOptions(c, AUTH_SESSION_TTL_SECONDS));
  deleteCookie(c, SETUP_SESSION_COOKIE, getCookieOptions(c, 0));
  const refreshedUser = await loadDatabaseUser(c.env.DB, user.id);
  return c.json({ success: true, user: refreshedUser ? sanitizeUserResponse(refreshedUser) : null });
});

app.post('/setup-password', async (c) => {
  await ensureAuthSessionSchema(c.env.DB);
  const setupSession = (c as any).get('setupSession') as SessionRecord | undefined;
  const setupUser = (c as any).get('setupUser') as AuthenticatedUser | undefined;
  const { password } = await c.req.json() as any;
  if (!setupSession || !setupUser) {
    return c.json({ success: false, error: 'Password setup session is missing or expired' }, 401);
  }
  if (safeString(password).trim().length < MIN_PASSWORD_LENGTH) {
    return c.json({ success: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` }, 400);
  }
  const passwordHash = await hashPassword(safeString(password));
  await c.env.DB.prepare("UPDATE users SET password = ?, lastLogin = CURRENT_TIMESTAMP, forcePasswordReset = 0 WHERE id = ?").bind(passwordHash, setupUser.id).run();
  await deleteSession(c.env.DB, setupSession.id);
  deleteCookie(c, SETUP_SESSION_COOKIE, getCookieOptions(c, 0));
  await c.env.DB.prepare("DELETE FROM auth_sessions WHERE userId = ? AND purpose = 'auth'").bind(setupUser.id).run();
  const authSession = await createSession(c.env.DB, setupUser.id, 'auth', AUTH_SESSION_TTL_SECONDS);
  setCookie(c, AUTH_SESSION_COOKIE, authSession.id, getCookieOptions(c, AUTH_SESSION_TTL_SECONDS));
  const user = await loadDatabaseUser(c.env.DB, setupUser.id);
  return c.json({ success: true, user: user ? sanitizeUserResponse(user) : null });
});

app.post('/users', async (c) => {
  const user = await c.req.json() as any;
  return persistUserRecord(c, user, 'create');
});

app.put('/users/:id', async (c) => {
  const userId = c.req.param('id');
  const user = await c.req.json() as any;
  return persistUserRecord(c, user, 'update', userId);
});

app.post('/users/update', async (c) => {
  const body = await c.req.json() as any;
  const userId = safeString(body?.id).trim();
  if (!userId) return c.json({ success: false, error: 'User id is required' }, 400);
  return persistUserRecord(c, body, 'update', userId);
});

app.post('/auth/reset-password', async (c) => {
  await ensureAuthSessionSchema(c.env.DB);
  const authUser = requireAuthUser(c);
  const adminResponse = assertAdmin(c, authUser);
  if (adminResponse) return adminResponse;
  const body = await c.req.json() as any;
  const userId = safeString(body?.userId).trim();
  const temporaryPassword = safeString(body?.temporaryPassword).trim();
  if (!userId || temporaryPassword.length < MIN_PASSWORD_LENGTH) {
    return c.json({ success: false, error: `userId and a ${MIN_PASSWORD_LENGTH}+ character temporaryPassword are required` }, 400);
  }
  const target = await loadDatabaseUser(c.env.DB, userId);
  if (!target) return c.json({ success: false, error: 'User not found' }, 404);
  if (!sharesFacilityAccess(authUser, target.assignedFacilityIds)) {
    return c.json({ success: false, error: 'Cannot reset a user outside your facility scope' }, 403);
  }
  const passwordHash = await hashPassword(temporaryPassword);
  await c.env.DB.prepare(`
    UPDATE users
    SET password = ?, forcePasswordReset = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(passwordHash, 1, userId).run();
  await c.env.DB.prepare("DELETE FROM auth_sessions WHERE userId = ? AND purpose = 'auth'").bind(userId).run();
  await writeAuditLog(c.env.DB, {
    facilityId: target.defaultFacilityId,
    actorId: authUser.id,
    action: 'reset-password',
    entity: 'user',
    entityId: userId,
    summary: `Temporary password reset for ${target.fullName || target.email || userId}`,
    metadata: { forcePasswordReset: true },
  });
  return c.json({ success: true });
});

app.post('/users/deactivate', async (c) => {
  await ensureAuthSessionSchema(c.env.DB);
  const authUser = requireAuthUser(c);
  const adminResponse = assertAdmin(c, authUser);
  if (adminResponse) return adminResponse;
  const body = await c.req.json() as any;
  const userId = safeString(body?.userId).trim();
  if (!userId) return c.json({ success: false, error: 'userId is required' }, 400);
  if (safeString(body?.confirmationText).trim().toUpperCase() !== 'DEACTIVATE') {
    return c.json({ success: false, error: 'Type DEACTIVATE to confirm user deactivation' }, 400);
  }
  const target = await loadDatabaseUser(c.env.DB, userId);
  if (!target) return c.json({ success: false, error: 'User not found' }, 404);
  if (!sharesFacilityAccess(authUser, target.assignedFacilityIds)) {
    return c.json({ success: false, error: 'Cannot deactivate a user outside your facility scope' }, 403);
  }
  await c.env.DB.prepare(`
    UPDATE users
    SET status = 'inactive', deactivatedAt = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(new Date().toISOString(), userId).run();
  await c.env.DB.prepare("DELETE FROM auth_sessions WHERE userId = ?").bind(userId).run();
  await writeAuditLog(c.env.DB, {
    facilityId: target.defaultFacilityId,
    actorId: authUser.id,
    action: 'deactivate',
    entity: 'user',
    entityId: userId,
    summary: `User deactivated: ${target.fullName || target.email || userId}`,
  });
  return c.json({ success: true });
});

app.get('/staff', async (c) => {
  const authUser = requireAuthUser(c);
  const adminResponse = assertAdmin(c, authUser);
  if (adminResponse) return adminResponse;
  const facilityId = safeString(c.req.query('facilityId')).trim();
  if (!facilityId) return c.json({ success: false, error: 'facilityId is required' }, 400);
  const accessResponse = assertFacilityAccess(c, facilityId, authUser);
  if (accessResponse) return accessResponse;
  const users = await listNormalizedUsers(c.env.DB);
  const staff = users
    .filter((user) => safeLower(user.status) === 'active' && user.assignedFacilityIds.includes(facilityId))
    .map((user) => ({
      id: user.staffId || user.id,
      fullName: user.fullName,
      email: user.email,
      title: user.title,
      department: user.department,
      facilityId,
    }));
  return c.json({ staff });
});

app.get('/users/:id/facilities', async (c) => {
  const authUser = requireAuthUser(c);
  const userId = c.req.param('id');
  const targetUser = await loadDatabaseUser(c.env.DB, userId);
  if (!targetUser) return c.json({ success: false, error: 'User not found' }, 404);
  if (authUser.id !== userId && !hasAdminAccess(authUser)) {
    return c.json({ success: false, error: 'Admin access required' }, 403);
  }
  if (!sharesFacilityAccess(authUser, targetUser.assignedFacilityIds)) {
    return c.json({ success: false, error: 'Cannot view facilities outside your scope' }, 403);
  }
  return c.json(targetUser.assignedFacilityIds);
});

app.post('/users/:id/facilities', async (c) => {
  const authUser = requireAuthUser(c);
  const adminResponse = assertAdmin(c, authUser);
  if (adminResponse) return adminResponse;
  const userId = c.req.param('id');
  const { facilityIds } = await c.req.json() as any;
  const normalizedFacilityIds = parseJsonArray(facilityIds);
  if (!sharesFacilityAccess(authUser, normalizedFacilityIds)) {
    return c.json({ success: false, error: 'Cannot assign facilities outside your scope' }, 403);
  }
  await replaceUserFacilities(c.env.DB, userId, normalizedFacilityIds);
  return c.json({ success: true });
});

// Residents API
app.get('/residents', async (c) => {
  const facilityId = c.req.query('facilityId');
  if (!facilityId) return c.json({ error: 'facilityId is required' }, 400);
  const accessResponse = assertFacilityAccess(c, facilityId);
  if (accessResponse) return accessResponse;
  
  const { results } = await c.env.DB.prepare("SELECT * FROM residents WHERE facilityId = ? ORDER BY name ASC").bind(facilityId).all();
  return c.json(results);
});

app.post('/residents', async (c) => {
  const res = await c.req.json() as any;
  if (!res.facilityId) return c.json({ error: 'facilityId is required' }, 400);
  const accessResponse = assertFacilityAccess(c, res.facilityId);
  if (accessResponse) return accessResponse;
  const validationResponse = rejectIfInvalid(c, validateResidentPayload(res, 'create'));
  if (validationResponse) return validationResponse;

  await c.env.DB.prepare(`
    INSERT INTO residents (id, name, mrn, lastName, firstName, age, floor, unit, roomNumber, sex, admissionDate, allergies, doctor, diagnosis, notes, lastVisit, status, dischargedAt, lastSeenCensusAt, facilityId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    toNull(res.id), toNull(res.name), toNull(res.mrn), toNull(res.lastName), toNull(res.firstName), toNull(res.age), toNull(res.floor), toNull(res.unit), toNull(res.roomNumber), toNull(res.sex),
    toNull(res.admissionDate), toNull(res.allergies), toNull(res.doctor), toNull(res.diagnosis), toNull(res.notes), toNull(res.lastVisit), toNull(res.status || 'Active'), toNull(res.dischargedAt), toNull(res.lastSeenCensusAt), toNull(res.facilityId)
  ).run();
  return c.json({ success: true, resident: res }, 201);
});

app.patch('/residents/:id', async (c) => {
  const id = c.req.param('id');
  const facilityId = await getResidentFacilityId(c.env.DB, id);
  if (!facilityId) return c.json({ success: false, error: 'Resident not found' }, 404);
  const accessResponse = assertFacilityAccess(c, facilityId);
  if (accessResponse) return accessResponse;
  const updates = await c.req.json() as any;
  const safeUpdate = buildSafeUpdate(updates, RESIDENT_UPDATE_FIELDS);

  if (!safeUpdate) {
    return c.json({ success: false, error: 'No valid resident fields to update' }, 400);
  }

  const validationPayload = Object.fromEntries(safeUpdate.keys.map((key) => [key, updates[key]]));
  const validationResponse = rejectIfInvalid(c, validateResidentPayload(validationPayload, 'patch'));
  if (validationResponse) return validationResponse;

  await c.env.DB.prepare(`UPDATE residents SET ${safeUpdate.setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .bind(...safeUpdate.values, id)
    .run();
  return c.json({ success: true, rejectedFields: safeUpdate.rejectedKeys });
});

app.delete('/residents/:id', async (c) => {
  const id = c.req.param('id');
  const facilityId = await getResidentFacilityId(c.env.DB, id);
  if (!facilityId) return c.json({ success: false, error: 'Resident not found' }, 404);
  const accessResponse = assertFacilityAccess(c, facilityId);
  if (accessResponse) return accessResponse;
  await c.env.DB.prepare("DELETE FROM residents WHERE id = ?").bind(id).run();
  return new Response(null, { status: 204 });
});

// Appointments API
app.get('/appointments', async (c) => {
  const facilityId = c.req.query('facilityId');
  if (!facilityId) return c.json({ error: 'facilityId is required' }, 400);
  const accessResponse = assertFacilityAccess(c, facilityId);
  if (accessResponse) return accessResponse;

  const { results } = await c.env.DB.prepare("SELECT * FROM appointments WHERE facilityId = ? ORDER BY date DESC, time DESC").bind(facilityId).all();
  return c.json(results);
});

app.post('/appointments', async (c) => {
  const apt = await c.req.json() as any;
  if (!apt.facilityId) return c.json({ error: 'facilityId is required' }, 400);
  const accessResponse = assertFacilityAccess(c, apt.facilityId);
  if (accessResponse) return accessResponse;
  const validationResponse = rejectIfInvalid(c, validateAppointmentPayload(apt, 'create'));
  if (validationResponse) return validationResponse;

  await c.env.DB.prepare(`
    INSERT INTO appointments (
      id, residentId, residentMrn, origin, residentName, unit, roomNumber, providerName, location, 
      contactNumber, schedulingDate, referralDate, status, date, 
      time, pickUpTime, type, description, serviceInHouse, reasonSendOut, 
      transportType, transportCompany, transportCompanyId, transportCompanyPhone, transportCompanyOther, payerForRide, roundTrip, escort, escortPhone, oxygen, notes, facilityId,
      weight, height, nurseCompleting, reasonConsultation, transportTypeOther, payerForRideOther, escortDetails, consultReason,
      ambulating, wheelchair, withLift, recliner, bariatric
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    toNull(apt.id), toNull(apt.residentId), toNull(apt.residentMrn), toNull(apt.origin), toNull(apt.residentName), toNull(apt.unit), toNull(apt.roomNumber), toNull(apt.providerName),
    toNull(apt.location), toNull(apt.contactNumber), toNull(apt.schedulingDate), toNull(apt.referralDate),
    toNull(apt.status || 'Pending Scheduling Review'), toNull(apt.date), toNull(apt.time), toNull(apt.pickUpTime), toNull(apt.type), toNull(apt.description),
    toNull(apt.serviceInHouse), toNull(apt.reasonSendOut), toNull(apt.transportType), toNull(apt.transportCompany),
    toNull(apt.transportCompanyId), toNull(apt.transportCompanyPhone), toNull(apt.transportCompanyOther),
    toNull(apt.payerForRide), toNull(apt.roundTrip), toNull(apt.escort), toNull(apt.escortPhone), toNull(apt.oxygen), toNull(apt.notes), toNull(apt.facilityId),
    toNull(apt.weight), toNull(apt.height), toNull(apt.nurseCompleting), toNull(apt.reasonConsultation),
    toNull(apt.transportTypeOther), toNull(apt.payerForRideOther), toNull(apt.escortDetails), toNull(apt.consultReason),
    toNull(apt.ambulating), toNull(apt.wheelchair), toNull(apt.withLift), toNull(apt.recliner), toNull(apt.bariatric)
  ).run();
  return c.json({ success: true, appointment: apt }, 201);
});

app.patch('/appointments/:id', async (c) => {
  const id = c.req.param('id');
  const facilityId = await getAppointmentFacilityId(c.env.DB, id);
  if (!facilityId) return c.json({ success: false, error: 'Appointment not found' }, 404);
  const accessResponse = assertFacilityAccess(c, facilityId);
  if (accessResponse) return accessResponse;
  const updates = await c.req.json() as any;
  const safeUpdate = buildSafeUpdate(updates, APPOINTMENT_UPDATE_FIELDS);

  if (!safeUpdate) {
    return c.json({ success: false, error: 'No valid appointment fields to update' }, 400);
  }

  const validationPayload = Object.fromEntries(safeUpdate.keys.map((key) => [key, updates[key]]));
  const validationResponse = rejectIfInvalid(c, validateAppointmentPayload(validationPayload, 'patch'));
  if (validationResponse) return validationResponse;

  await c.env.DB.prepare(`UPDATE appointments SET ${safeUpdate.setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .bind(...safeUpdate.values, id)
    .run();
  return c.json({ success: true, rejectedFields: safeUpdate.rejectedKeys });
});

app.delete('/appointments/:id', async (c) => {
  const id = c.req.param('id');
  const facilityId = await getAppointmentFacilityId(c.env.DB, id);
  if (!facilityId) return c.json({ success: false, error: 'Appointment not found' }, 404);
  const accessResponse = assertFacilityAccess(c, facilityId);
  if (accessResponse) return accessResponse;
  await c.env.DB.prepare("DELETE FROM appointments WHERE id = ?").bind(id).run();
  return new Response(null, { status: 204 });
});


registerTransportationRoutes(app, toNull);
registerCensusReconcileRoute(app);
registerAdminSecurityRoutes(app);

export default app;
