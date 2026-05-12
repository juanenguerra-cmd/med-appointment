import type { Hono } from "hono";

type WorkerApp = Hono<{ Bindings: { DB: D1Database } }>;

const safeString = (value: unknown): string => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

async function writeAccessAudit(db: D1Database, params: {
  facilityId: string;
  actorId?: string;
  targetUserId: string;
  accessKeys: string[];
}) {
  try {
    await db.prepare(`
      INSERT INTO audit_logs (id, facilityId, actorId, action, entity, entityId, summary, metadata, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      crypto.randomUUID(),
      params.facilityId,
      params.actorId || null,
      "update",
      "user_access_matrix",
      params.targetUserId,
      "User access matrix updated",
      JSON.stringify({ accessCount: params.accessKeys.length, accessKeys: params.accessKeys }),
    ).run();
  } catch {
    // Audit logging should not block saving the access matrix.
  }
}

export function registerUserAccessMatrixRoutes(app: WorkerApp) {
  app.get("/user-access-matrix", async (c) => {
    const userId = safeString(c.req.query("userId"));
    const facilityId = safeString(c.req.query("facilityId"));
    if (!userId || !facilityId) {
      return c.json({ success: false, error: "userId and facilityId are required" }, 400);
    }

    const { results } = await c.env.DB.prepare(`
      SELECT accessKey
      FROM user_access_matrix
      WHERE userId = ? AND facilityId = ? AND allowed = 1
      ORDER BY accessKey ASC
    `).bind(userId, facilityId).all();

    return c.json({
      success: true,
      userId,
      facilityId,
      accessKeys: results.map((row: any) => safeString(row.accessKey)).filter(Boolean),
    });
  });

  app.put("/user-access-matrix", async (c) => {
    const body = await c.req.json() as {
      userId?: string;
      facilityId?: string;
      accessKeys?: unknown[];
      updatedBy?: string;
    };

    const userId = safeString(body.userId);
    const facilityId = safeString(body.facilityId);
    const updatedBy = safeString(body.updatedBy);
    const accessKeys = Array.from(new Set((Array.isArray(body.accessKeys) ? body.accessKeys : [])
      .map((key) => safeString(key))
      .filter(Boolean)));

    if (!userId || !facilityId) {
      return c.json({ success: false, error: "userId and facilityId are required" }, 400);
    }

    const statements = [
      c.env.DB.prepare("DELETE FROM user_access_matrix WHERE userId = ? AND facilityId = ?").bind(userId, facilityId),
      ...accessKeys.map((accessKey) => c.env.DB.prepare(`
        INSERT INTO user_access_matrix (userId, facilityId, accessKey, allowed, updatedBy, updatedAt)
        VALUES (?, ?, ?, 1, ?, CURRENT_TIMESTAMP)
      `).bind(userId, facilityId, accessKey, updatedBy || null)),
    ];

    await c.env.DB.batch(statements);
    await writeAccessAudit(c.env.DB, { facilityId, actorId: updatedBy, targetUserId: userId, accessKeys });

    return c.json({ success: true, userId, facilityId, accessKeys });
  });
}
