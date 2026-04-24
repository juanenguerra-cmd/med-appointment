import { Hono } from 'hono';

export interface Env {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Env }>().basePath('/api');

// Helper to convert undefined to null for D1
const toNull = (val: any) => (val === undefined ? null : val);

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
  await c.env.DB.prepare(`
    INSERT INTO facilities (id, name, address, phone, contactPerson)
    VALUES (?, ?, ?, ?, ?)
  `).bind(toNull(fac.id), toNull(fac.name), toNull(fac.address), toNull(fac.phone), toNull(fac.contactPerson)).run();
  return c.json({ success: true, facility: fac }, 201);
});

app.patch('/facilities/:id', async (c) => {
  const id = c.req.param('id');
  const updates = await c.req.json() as any;
  const keys = Object.keys(updates);
  const setQuery = keys.map(k => `${k} = ?`).join(', ');
  const values = keys.map(k => toNull(updates[k]));
  
  await c.env.DB.prepare(`UPDATE facilities SET ${setQuery} WHERE id = ?`)
    .bind(...values, id)
    .run();
  return c.json({ success: true });
});

app.delete('/facilities/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare("DELETE FROM facilities WHERE id = ?").bind(id).run();
  return new Response(null, { status: 204 });
});

// Users and Permissions API
app.get('/users', async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM users ORDER BY fullName ASC").all();
  return c.json(results);
});

app.post('/users', async (c) => {
  const user = await c.req.json() as any;
  await c.env.DB.prepare(`
    INSERT INTO users (id, email, fullName, role)
    VALUES (?, ?, ?, ?)
  `).bind(toNull(user.id), toNull(user.email), toNull(user.fullName), toNull(user.role)).run();
  return c.json({ success: true, user }, 201);
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

  await c.env.DB.prepare(`
    INSERT INTO residents (id, name, mrn, lastName, firstName, age, floor, unit, roomNumber, sex, admissionDate, allergies, doctor, diagnosis, notes, lastVisit, facilityId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    toNull(res.id), toNull(res.name), toNull(res.mrn), toNull(res.lastName), toNull(res.firstName), toNull(res.age), toNull(res.floor), toNull(res.unit), toNull(res.roomNumber), toNull(res.sex),
    toNull(res.admissionDate), toNull(res.allergies), toNull(res.doctor), toNull(res.diagnosis), toNull(res.notes), toNull(res.lastVisit), toNull(res.facilityId)
  ).run();
  return c.json({ success: true, resident: res }, 201);
});

app.patch('/residents/:id', async (c) => {
  const id = c.req.param('id');
  const updates = await c.req.json() as any;
  const keys = Object.keys(updates);
  if (keys.length === 0) return c.json({ error: 'No fields' }, 400);

  const setClause = keys.map(k => `${k} = ?`).join(", ");
  const values = [...keys.map(k => toNull(updates[k])), id];

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
  const facilityId = c.req.query('facilityId');
  if (!facilityId) return c.json({ error: 'facilityId is required' }, 400);

  const { results } = await c.env.DB.prepare("SELECT * FROM appointments WHERE facilityId = ? ORDER BY date DESC, time DESC").bind(facilityId).all();
  return c.json(results);
});

app.post('/appointments', async (c) => {
  const apt = await c.req.json() as any;
  if (!apt.facilityId) return c.json({ error: 'facilityId is required' }, 400);

  await c.env.DB.prepare(`
    INSERT INTO appointments (
      id, origin, residentName, unit, roomNumber, providerName, location, 
      contactNumber, schedulingDate, referralDate, dueDate, status, date, 
      time, pickUpTime, type, description, serviceInHouse, reasonSendOut, 
      transportType, transportCompany, payerForRide, roundTrip, escort, oxygen, notes, facilityId
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    toNull(apt.id), toNull(apt.origin), toNull(apt.residentName), toNull(apt.unit), toNull(apt.roomNumber), toNull(apt.providerName),
    toNull(apt.location), toNull(apt.contactNumber), toNull(apt.schedulingDate), toNull(apt.referralDate), toNull(apt.dueDate),
    toNull(apt.status), toNull(apt.date), toNull(apt.time), toNull(apt.pickUpTime), toNull(apt.type), toNull(apt.description),
    toNull(apt.serviceInHouse), toNull(apt.reasonSendOut), toNull(apt.transportType), toNull(apt.transportCompany),
    toNull(apt.payerForRide), toNull(apt.roundTrip), toNull(apt.escort), toNull(apt.oxygen), toNull(apt.notes), toNull(apt.facilityId)
  ).run();
  return c.json({ success: true, appointment: apt }, 201);
});

app.patch('/appointments/:id', async (c) => {
  const id = c.req.param('id');
  const updates = await c.req.json() as any;
  const keys = Object.keys(updates);
  if (keys.length === 0) return c.json({ error: 'No fields' }, 400);

  const setClause = keys.map(k => `${k} = ?`).join(", ");
  const values = [...keys.map(k => toNull(updates[k])), id];

  await c.env.DB.prepare(`UPDATE appointments SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(...values).run();
  return c.json({ success: true });
});

app.delete('/appointments/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare("DELETE FROM appointments WHERE id = ?").bind(id).run();
  return new Response(null, { status: 204 });
});

export default app;
