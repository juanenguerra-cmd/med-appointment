import type { Hono } from "hono";
import { hasAdminAccess, hasFacilityAccess, type AuthenticatedUser } from "../sessionAuth";

type WorkerApp = Hono<{ Bindings: { DB: D1Database } }>;

type AuditOptions = {
  facilityId?: string;
  actorId?: string;
  action: string;
  entity: string;
  entityId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
};

const safeString = (value: unknown): string => {
  if (value === undefined || value === null) return "";
  return String(value);
};

async function writeAuditLog(db: D1Database, options: AuditOptions) {
  await db
    .prepare(`
      INSERT INTO audit_logs (id, facilityId, actorId, action, entity, entityId, summary, metadata, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
    .bind(
      crypto.randomUUID(),
      options.facilityId || null,
      options.actorId || null,
      options.action,
      options.entity,
      options.entityId || null,
      options.summary,
      options.metadata ? JSON.stringify(options.metadata) : null,
    )
    .run();
}

export function registerAdminRestoreRoutes(app: WorkerApp) {
  app.get("/audit-logs", async (c) => {
    const authUser = c.get("authUser") as AuthenticatedUser | undefined;
    const facilityId = safeString(c.req.query("facilityId"));
    const entity = safeString(c.req.query("entity"));
    const limit = Math.min(Number(c.req.query("limit") || 100) || 100, 500);
    if (!authUser || !hasAdminAccess(authUser)) return c.json({ success: false, error: "Admin access required" }, 403);
    if (facilityId && !hasFacilityAccess(authUser, facilityId)) return c.json({ success: false, error: "Facility access denied" }, 403);

    const where: string[] = [];
    const values: string[] = [];
    if (facilityId) {
      where.push("facilityId = ?");
      values.push(facilityId);
    }
    if (entity) {
      where.push("entity = ?");
      values.push(entity);
    }

    const sql = `
      SELECT * FROM audit_logs
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY createdAt DESC
      LIMIT ?
    `;
    const { results } = await c.env.DB.prepare(sql).bind(...values, limit).all();
    return c.json(results);
  });

  app.get("/deleted/residents", async (c) => {
    const authUser = c.get("authUser") as AuthenticatedUser | undefined;
    const facilityId = safeString(c.req.query("facilityId"));
    if (!facilityId) return c.json({ success: false, error: "facilityId is required" }, 400);
    if (!authUser || !hasAdminAccess(authUser)) return c.json({ success: false, error: "Admin access required" }, 403);
    if (!hasFacilityAccess(authUser, facilityId)) return c.json({ success: false, error: "Facility access denied" }, 403);

    const { results } = await c.env.DB
      .prepare(`
        SELECT * FROM residents
        WHERE facilityId = ? AND LOWER(COALESCE(status, '')) IN ('discharged', 'inactive')
        ORDER BY dischargedAt DESC, name ASC
      `)
      .bind(facilityId)
      .all();
    return c.json(results);
  });

  app.get("/deleted/appointments", async (c) => {
    const authUser = c.get("authUser") as AuthenticatedUser | undefined;
    const facilityId = safeString(c.req.query("facilityId"));
    if (!facilityId) return c.json({ success: false, error: "facilityId is required" }, 400);
    if (!authUser || !hasAdminAccess(authUser)) return c.json({ success: false, error: "Admin access required" }, 403);
    if (!hasFacilityAccess(authUser, facilityId)) return c.json({ success: false, error: "Facility access denied" }, 403);

    const { results } = await c.env.DB
      .prepare(`
        SELECT * FROM appointments
        WHERE facilityId = ? AND deletedAt IS NOT NULL
        ORDER BY deletedAt DESC, residentName ASC
      `)
      .bind(facilityId)
      .all();
    return c.json(results);
  });

  app.post("/soft-delete/appointments/:id", async (c) => {
    const authUser = c.get("authUser") as AuthenticatedUser | undefined;
    const id = c.req.param("id");
    const body = (await c.req.json().catch(() => ({}))) as { note?: string };
    if (!authUser) return c.json({ success: false, error: "Authentication required" }, 401);
    const appointment = (await c.env.DB.prepare("SELECT * FROM appointments WHERE id = ?").bind(id).first()) as any;
    if (!appointment) return c.json({ success: false, error: "Appointment not found" }, 404);
    if (!hasFacilityAccess(authUser, safeString(appointment.facilityId))) return c.json({ success: false, error: "Facility access denied" }, 403);

    const deletedAt = new Date().toISOString();
    const previousStatus = safeString(appointment.status) || "Scheduled";
    await c.env.DB
      .prepare(`
        UPDATE appointments
        SET deletedAt = ?,
            deletedBy = ?,
            previousStatus = ?,
            status = 'Discontinued',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(deletedAt, authUser.id || null, previousStatus, id)
      .run();

    await writeAuditLog(c.env.DB, {
      facilityId: safeString(appointment.facilityId),
      actorId: authUser.id,
      action: "delete",
      entity: "appointment",
      entityId: id,
      summary: `Appointment moved to deleted records for ${safeString(appointment.residentName) || "resident"}`,
      metadata: { note: body.note || "", previousStatus, deletedAt },
    });

    return c.json({ success: true, deletedAt });
  });

  app.post("/restore/residents/:id", async (c) => {
    const authUser = c.get("authUser") as AuthenticatedUser | undefined;
    const id = c.req.param("id");
    const body = (await c.req.json().catch(() => ({}))) as { note?: string };
    if (!authUser) return c.json({ success: false, error: "Authentication required" }, 401);
    const resident = (await c.env.DB.prepare("SELECT * FROM residents WHERE id = ?").bind(id).first()) as any;
    if (!resident) return c.json({ success: false, error: "Resident not found" }, 404);
    if (!hasFacilityAccess(authUser, safeString(resident.facilityId))) return c.json({ success: false, error: "Facility access denied" }, 403);

    await c.env.DB
      .prepare(`
        UPDATE residents
        SET status = 'Active', dischargedAt = NULL, dischargeBatchId = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(id)
      .run();

    await writeAuditLog(c.env.DB, {
      facilityId: safeString(resident.facilityId),
      actorId: authUser.id,
      action: "restore",
      entity: "resident",
      entityId: id,
      summary: `Resident restored: ${safeString(resident.name) || id}`,
      metadata: { note: body.note || "", previousStatus: resident.status || "" },
    });

    return c.json({ success: true });
  });

  app.post("/restore/appointments/:id", async (c) => {
    const authUser = c.get("authUser") as AuthenticatedUser | undefined;
    const id = c.req.param("id");
    const body = (await c.req.json().catch(() => ({}))) as { note?: string };
    if (!authUser) return c.json({ success: false, error: "Authentication required" }, 401);
    const appointment = (await c.env.DB.prepare("SELECT * FROM appointments WHERE id = ?").bind(id).first()) as any;
    if (!appointment) return c.json({ success: false, error: "Appointment not found" }, 404);
    if (!hasFacilityAccess(authUser, safeString(appointment.facilityId))) return c.json({ success: false, error: "Facility access denied" }, 403);

    const restoredStatus = safeString(appointment.previousStatus) || "Scheduled";
    await c.env.DB
      .prepare(`
        UPDATE appointments
        SET deletedAt = NULL,
            deletedBy = NULL,
            restoredAt = CURRENT_TIMESTAMP,
            restoredBy = ?,
            status = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(authUser.id || null, restoredStatus, id)
      .run();

    await writeAuditLog(c.env.DB, {
      facilityId: safeString(appointment.facilityId),
      actorId: authUser.id,
      action: "restore",
      entity: "appointment",
      entityId: id,
      summary: `Appointment restored for ${safeString(appointment.residentName) || "resident"}`,
      metadata: { note: body.note || "", restoredStatus },
    });

    return c.json({ success: true });
  });
}

export { writeAuditLog };
