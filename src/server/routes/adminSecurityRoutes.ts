import type { Hono } from "hono";
import { registerAdminRestoreRoutes } from "./adminRestoreRoutes";
import { registerUserAccessMatrixRoutes } from "./userAccessMatrixRoutes";

type WorkerApp = Hono<{ Bindings: { DB: D1Database } }>;

const safeString = (value: unknown): string => {
  if (value === undefined || value === null) return "";
  return String(value);
};

async function isAdminActor(db: D1Database, actorId: string): Promise<boolean> {
  if (!actorId) return false;
  const row = (await db
    .prepare("SELECT role FROM users WHERE id = ?")
    .bind(actorId)
    .first()) as { role?: string } | null;
  return safeString(row?.role).trim().toLowerCase() === "admin";
}

export function registerAdminSecurityRoutes(app: WorkerApp) {
  registerAdminRestoreRoutes(app);
  registerUserAccessMatrixRoutes(app);

  app.post("/admin/screenshot-authorize", async (c) => {
    const body = (await c.req.json()) as {
      actorId?: string;
      facilityId?: string;
      consentProvided?: boolean;
    };

    const actorId = safeString(body?.actorId);
    const facilityId = safeString(body?.facilityId);
    if (!actorId || !facilityId) return c.json({ success: false, error: "actorId and facilityId are required" }, 400);
    if (!body?.consentProvided) return c.json({ success: false, error: "consent is required" }, 400);

    if (!(await isAdminActor(c.env.DB, actorId))) {
      return c.json({ success: false, error: "Admin access required" }, 403);
    }

    return c.json({ success: true, authorized: true });
  });

  app.post("/admin/screenshot-audit", async (c) => {
    const body = (await c.req.json()) as {
      actorId?: string;
      facilityId?: string;
      summary?: string;
    };

    const actorId = safeString(body?.actorId);
    const facilityId = safeString(body?.facilityId);
    const summary = safeString(body?.summary) || "Screenshot action";
    if (!actorId || !facilityId) return c.json({ success: false, error: "actorId and facilityId are required" }, 400);

    if (!(await isAdminActor(c.env.DB, actorId))) {
      return c.json({ success: false, error: "Admin access required" }, 403);
    }

    console.info("Screenshot audit event", {
      actorId,
      facilityId,
      summary,
      timestamp: new Date().toISOString(),
    });

    return c.json({ success: true });
  });
}
