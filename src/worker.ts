import { Hono } from 'hono';
import { registerTransportationRoutes } from './server/routes/transportationRoutes';
import { registerAdminSecurityRoutes } from './server/routes/adminSecurityRoutes';

export interface Env {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Env }>().basePath('/api');

// Helper to convert undefined to null for D1
const toNull = (val: unknown) => (val === undefined ? null : val);

const safeString = (value: unknown, fallback = ''): string => {
  if (value === undefined || value === null) return fallback;
  return String(value);
};

const safeLower = (value: unknown): string => safeString(value).trim().toLowerCase();
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

// Middleware to check for DB binding
app.use('*', async (c, next) => {
  if (!c.env.DB) {
    console.error("D1 DB binding is missing. Check wrangler.toml and dev setup.");
    return c.json({ 
      success: false, 
      error: "Database configuration error. Please check backend bindings." 
    }, 500);
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

// Facilities API
app.get('/facilities', async (c) => {
  const userId = c.req.query('userId');
  if (userId) {
    // Return facilities the user has access to
    const { results } = await c.env.DB.prepare(`
      SELECT f.* FROM facilities f
      JOIN user_facilities uf ON f.id = uf.facilityId
      WHERE uf.userId = ?
      ORDER BY f.name ASC
    `).bind(userId).all();
    return c.json(results);
  }
  const { results } = await c.env.DB.prepare("SELECT * FROM facilities ORDER BY name ASC").all();
  return c.json(results);
});

app.post('/facilities', async (c) => {
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
  const id = c.req.param('id');
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

app.delete('/facilities/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare("DELETE FROM facilities WHERE id = ?").bind(id).run();
  return new Response(null, { status: 204 });
});

// Users and Permissions API
app.get('/users', async (c) => {
  const { results } = await c.env.DB.prepare("SELECT id, email, fullName, role, lastLogin FROM users ORDER BY fullName ASC").all();
  return c.json(results);
});

app.post('/login', async (c) => {
  const { email, password } = await c.req.json() as any;
  const user = await c.env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first() as any;
  
  if (!user) {
    return c.json({ success: false, error: "User not found" }, 404);
  }

  // If password is not set yet, they need to create one (first time login)
  if (!user.password) {
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

  const { password: _, ...safeUser } = user;
  return c.json({ success: true, user: safeUser });
});

app.post('/setup-password', async (c) => {
  const { userId, password } = await c.req.json() as any;
  const passwordHash = await hashPassword(safeString(password));
  await c.env.DB.prepare("UPDATE users SET password = ?, lastLogin = CURRENT_TIMESTAMP WHERE id = ?").bind(passwordHash, userId).run();
  
  const user = await c.env.DB.prepare("SELECT id, email, fullName, role, lastLogin FROM users WHERE id = ?").bind(userId).first();
  return c.json({ success: true, user });
});

app.post('/users', async (c) => {
  const user = await c.req.json() as any;
  const passwordValue = user.password ? await hashPassword(safeString(user.password)) : null;

  await c.env.DB.prepare(`
    INSERT INTO users (id, email, fullName, role, password)
    VALUES (?, ?, ?, ?, ?)
  `).bind(toNull(user.id), toNull(user.email), toNull(user.fullName), toNull(user.role), passwordValue).run();
  
  const { password: _, ...safeUser } = user;
  return c.json({ success: true, user: safeUser }, 201);
});

app.put('/users/:id', async (c) => {
  const userId = c.req.param('id');
  const user = await c.req.json() as any;
  
  if (user.password !== undefined) {
    if (user.password === null) {
      await c.env.DB.prepare(`
        UPDATE users SET email = ?, fullName = ?, role = ?, password = NULL WHERE id = ?
      `).bind(toNull(user.email), toNull(user.fullName), toNull(user.role), userId).run();
    } else {
      const passwordHash = await hashPassword(safeString(user.password));
      await c.env.DB.prepare(`
        UPDATE users SET email = ?, fullName = ?, role = ?, password = ? WHERE id = ?
      `).bind(toNull(user.email), toNull(user.fullName), toNull(user.role), passwordHash, userId).run();
    }
  } else {
    await c.env.DB.prepare(`
      UPDATE users SET email = ?, fullName = ?, role = ? WHERE id = ?
    `).bind(toNull(user.email), toNull(user.fullName), toNull(user.role), userId).run();
  }

  return c.json({ success: true });
});

app.get('/users/:id/facilities', async (c) => {
  const userId = c.req.param('id');
  const { results } = await c.env.DB.prepare(`
    SELECT facilityId FROM user_facilities WHERE userId = ?
  `).bind(userId).all();
  return c.json(results.map((r: any) => r.facilityId));
});

app.post('/users/:id/facilities', async (c) => {
  const userId = c.req.param('id');
  const { facilityIds } = await c.req.json() as any;
  
  // Batch updates for permissions
  const statements = [
    c.env.DB.prepare("DELETE FROM user_facilities WHERE userId = ?").bind(userId)
  ];
  
  for (const fId of facilityIds) {
    statements.push(c.env.DB.prepare("INSERT INTO user_facilities (userId, facilityId) VALUES (?, ?)").bind(userId, fId));
  }
  
  await c.env.DB.batch(statements);
  return c.json({ success: true });
});

// Residents API
app.get('/residents', async (c) => {
  const facilityId = c.req.query('facilityId');
  if (!facilityId) return c.json({ error: 'facilityId is required' }, 400);
  
  const { results } = await c.env.DB.prepare("SELECT * FROM residents WHERE facilityId = ? ORDER BY name ASC").bind(facilityId).all();
  return c.json(results);
});

app.post('/residents', async (c) => {
  const res = await c.req.json() as any;
  if (!res.facilityId) return c.json({ error: 'facilityId is required' }, 400);
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
  await c.env.DB.prepare("DELETE FROM residents WHERE id = ?").bind(id).run();
  return new Response(null, { status: 204 });
});

// Appointments API
app.get('/appointments', async (c) => {
  const facilityId = c.req.query('facilityId');
  if (!facilityId) return c.json({ error: 'facilityId is required' }, 400);

  const { results } = await c.env.DB.prepare("SELECT * FROM appointments WHERE facilityId = ? ORDER BY date DESC, time DESC").bind(facilityId).all();
  return c.json(results);
});

app.post('/appointments', async (c) => {
  const apt = await c.req.json() as any;
  if (!apt.facilityId) return c.json({ error: 'facilityId is required' }, 400);
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
  await c.env.DB.prepare("DELETE FROM appointments WHERE id = ?").bind(id).run();
  return new Response(null, { status: 204 });
});


registerTransportationRoutes(app, toNull);
registerAdminSecurityRoutes(app);

export default app;
