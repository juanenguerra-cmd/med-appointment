import { Hono } from 'hono';

export interface Env {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Env }>().basePath('/api');

// Basic health check
app.get('/health', async (c) => {
  const dbCheck = await c.env.DB.prepare("SELECT 1 as ok").first();
  return c.json({
    status: 'ok',
    time: new Date().toISOString(),
    database: dbCheck?.ok === 1 ? 'Connected' : 'Disconnected'
  });
});

// Residents API
app.get('/residents', async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM residents ORDER BY name ASC").all();
  return c.json(results);
});

app.post('/residents', async (c) => {
  const res = await c.req.json() as any;
  await c.env.DB.prepare(`
    INSERT INTO residents (id, name, mrn, lastName, firstName, age, floor, unit, roomNumber, sex, admissionDate, allergies, doctor, diagnosis, notes, lastVisit)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    res.id, res.name, res.mrn, res.lastName, res.firstName, res.age, res.floor, res.unit, res.roomNumber, res.sex,
    res.admissionDate, res.allergies, res.doctor, res.diagnosis, res.notes, res.lastVisit
  ).run();
  return c.json({ success: true, resident: res }, 201);
});

app.patch('/residents/:id', async (c) => {
  const id = c.req.param('id');
  const updates = await c.req.json() as any;
  const keys = Object.keys(updates);
  if (keys.length === 0) return c.json({ error: 'No fields' }, 400);

  const setClause = keys.map(k => `${k} = ?`).join(", ");
  const values = [...Object.values(updates), id];

  await c.env.DB.prepare(`UPDATE residents SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(...values).run();
  return c.json({ success: true });
});

app.delete('/residents/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare("DELETE FROM residents WHERE id = ?").bind(id).run();
  return new Response(null, { status: 204 });
});

// Appointments API
app.get('/appointments', async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM appointments ORDER BY date DESC, time DESC").all();
  return c.json(results);
});

app.post('/appointments', async (c) => {
  const apt = await c.req.json() as any;
  await c.env.DB.prepare(`
    INSERT INTO appointments (
      id, origin, residentName, unit, roomNumber, providerName, location, 
      contactNumber, schedulingDate, referralDate, dueDate, status, date, 
      time, pickUpTime, type, description, serviceInHouse, reasonSendOut, 
      transportType, transportCompany, payerForRide, roundTrip, escort, oxygen, notes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    apt.id, apt.origin, apt.residentName, apt.unit, apt.roomNumber, apt.providerName,
    apt.location, apt.contactNumber, apt.schedulingDate, apt.referralDate, apt.dueDate,
    apt.status, apt.date, apt.time, apt.pickUpTime, apt.type, apt.description,
    apt.serviceInHouse, apt.reasonSendOut, apt.transportType, apt.transportCompany,
    apt.payerForRide, apt.roundTrip, apt.escort, apt.oxygen, apt.notes
  ).run();
  return c.json({ success: true, appointment: apt }, 201);
});

app.patch('/appointments/:id', async (c) => {
  const id = c.req.param('id');
  const updates = await c.req.json() as any;
  const keys = Object.keys(updates);
  if (keys.length === 0) return c.json({ error: 'No fields' }, 400);

  const setClause = keys.map(k => `${k} = ?`).join(", ");
  const values = [...Object.values(updates), id];

  await c.env.DB.prepare(`UPDATE appointments SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(...values).run();
  return c.json({ success: true });
});

app.delete('/appointments/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare("DELETE FROM appointments WHERE id = ?").bind(id).run();
  return new Response(null, { status: 204 });
});

export default app;
