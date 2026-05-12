import type { Hono } from "hono";

type WorkerApp = Hono<{ Bindings: { DB: D1Database } }>;

export function registerTransportationRoutes(
  app: WorkerApp,
  toNull: (value: unknown) => unknown,
) {
  app.get("/transportation-companies", async (c) => {
    const facilityId = c.req.query("facilityId");
    if (!facilityId) return c.json({ error: "facilityId is required" }, 400);

    const { results } = await c.env.DB.prepare(`
      SELECT * FROM transportation_companies
      WHERE facilityId = ? AND active != 0
      ORDER BY name ASC
    `).bind(facilityId).all();

    return c.json(results);
  });

  app.post("/transportation-companies", async (c) => {
    const item = (await c.req.json()) as Record<string, unknown>;
    if (!item.facilityId) return c.json({ error: "facilityId is required" }, 400);
    if (!item.id) return c.json({ error: "id is required" }, 400);
    if (!item.name) return c.json({ error: "name is required" }, 400);

    await c.env.DB.prepare(`
      INSERT INTO transportation_companies
      (id, facilityId, name, phone, address, notes, active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      toNull(item.id),
      toNull(item.facilityId),
      toNull(item.name),
      toNull(item.phone || ""),
      toNull(item.address || ""),
      toNull(item.notes || ""),
      item.active === false ? 0 : 1,
    ).run();

    return c.json({ success: true, company: item }, 201);
  });

  app.patch("/transportation-companies/:id", async (c) => {
    const id = c.req.param("id");
    const item = (await c.req.json()) as Record<string, unknown>;
    if (!item.name) return c.json({ error: "name is required" }, 400);

    await c.env.DB.prepare(`
      UPDATE transportation_companies
      SET name = ?, phone = ?, address = ?, notes = ?, active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      toNull(item.name),
      toNull(item.phone || ""),
      toNull(item.address || ""),
      toNull(item.notes || ""),
      item.active === false ? 0 : 1,
      id,
    ).run();

    return c.json({ success: true });
  });

  app.delete("/transportation-companies/:id", async (c) => {
    const id = c.req.param("id");

    await c.env.DB.prepare(`
      UPDATE transportation_companies
      SET active = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(id).run();

    return c.json({ success: true });
  });
}

