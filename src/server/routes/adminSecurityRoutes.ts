import type { Hono } from "hono";
import { registerAdminRestoreRoutes } from "./adminRestoreRoutes";
import { hasAdminAccess, hasFacilityAccess, type AuthenticatedUser } from "../sessionAuth";

type WorkerApp = Hono<{ Bindings: { DB: D1Database } }>;

const safeString = (value: unknown): string => {
  if (value === undefined || value === null) return "";
  return String(value);
};

export function registerAdminSecurityRoutes(app: WorkerApp) {
  registerAdminRestoreRoutes(app);

  app.post("/admin/screenshot-authorize", async (c) => {
    const authUser = c.get("authUser") as AuthenticatedUser | undefined;
    const body = (await c.req.json()) as {
      facilityId?: string;
      consentProvided?: boolean;
    };

    const facilityId = safeString(body?.facilityId);
    if (!facilityId) return c.json({ success: false, error: "facilityId is required" }, 400);
    if (!body?.consentProvided) return c.json({ success: false, error: "consent is required" }, 400);

    if (!authUser || !hasAdminAccess(authUser)) {
      return c.json({ success: false, error: "Admin access required" }, 403);
    }
    if (!hasFacilityAccess(authUser, facilityId)) return c.json({ success: false, error: "Facility access denied" }, 403);

    return c.json({ success: true, authorized: true });
  });

  app.post("/admin/screenshot-audit", async (c) => {
    const authUser = c.get("authUser") as AuthenticatedUser | undefined;
    const body = (await c.req.json()) as {
      facilityId?: string;
      summary?: string;
    };

    const facilityId = safeString(body?.facilityId);
    const summary = safeString(body?.summary) || "Screenshot action";
    if (!facilityId) return c.json({ success: false, error: "facilityId is required" }, 400);

    if (!authUser || !hasAdminAccess(authUser)) {
      return c.json({ success: false, error: "Admin access required" }, 403);
    }
    if (!hasFacilityAccess(authUser, facilityId)) return c.json({ success: false, error: "Facility access denied" }, 403);

    console.info("Screenshot audit event", {
      actorId: authUser.id,
      facilityId,
      summary,
      timestamp: new Date().toISOString(),
    });

    return c.json({ success: true });
  });
}
