import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Database Setup (Simulation of Cloudflare D1 / SQL)
const dbPath = path.join(process.cwd(), "health.db");
const db = new Database(dbPath);

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS residents (
    id TEXT PRIMARY KEY,
    name TEXT,
    mrn TEXT,
    lastName TEXT,
    firstName TEXT,
    age TEXT,
    floor TEXT,
    unit TEXT,
    roomNumber TEXT,
    sex TEXT,
    admissionDate TEXT,
    allergies TEXT,
    doctor TEXT,
    diagnosis TEXT,
    notes TEXT,
    lastVisit TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    origin TEXT,
    residentName TEXT,
    unit TEXT,
    roomNumber TEXT,
    providerName TEXT,
    location TEXT,
    contactNumber TEXT,
    schedulingDate TEXT,
    referralDate TEXT,
    dueDate TEXT,
    status TEXT,
    date TEXT,
    time TEXT,
    pickUpTime TEXT,
    type TEXT,
    description TEXT,
    serviceInHouse TEXT,
    reasonSendOut TEXT,
    transportType TEXT,
    transportCompany TEXT,
    payerForRide TEXT,
    roundTrip TEXT,
    escort TEXT,
    oxygen TEXT,
    notes TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

app.use(express.json());

// --- API ROUTES ---

// Residents
app.get("/api/residents", (req, res) => {
  const residents = db.prepare("SELECT * FROM residents").all();
  res.json(residents);
});

app.post("/api/residents", (req, res) => {
  const resident = req.body;
  const stmt = db.prepare(`
    INSERT INTO residents (id, name, mrn, lastName, firstName, age, floor, unit, roomNumber, sex, admissionDate, allergies, doctor, diagnosis, notes, lastVisit)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    resident.id, resident.name, resident.mrn, resident.lastName, resident.firstName, 
    resident.age, resident.floor, resident.unit, resident.roomNumber, resident.sex, 
    resident.admissionDate, resident.allergies, resident.doctor, resident.diagnosis, 
    resident.notes, resident.lastVisit
  );
  res.status(201).json(resident);
});

// PARTIAL UPDATE (Non-wasting)
app.patch("/api/residents/:id", (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const keys = Object.keys(updates);
  if (keys.length === 0) return res.status(400).json({ error: "No fields provided" });

  const setClause = keys.map(key => `${key} = ?`).join(", ");
  const values = [...Object.values(updates), id];

  const stmt = db.prepare(`UPDATE residents SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
  stmt.run(...values);
  
  res.json({ success: true, updatedFields: keys });
});

app.delete("/api/residents/:id", (req, res) => {
  db.prepare("DELETE FROM residents WHERE id = ?").run(req.params.id);
  res.status(204).send();
});

// Appointments
app.get("/api/appointments", (req, res) => {
  const appointments = db.prepare("SELECT * FROM appointments").all();
  res.json(appointments);
});

app.post("/api/appointments", (req, res) => {
  const apt = req.body;
  const stmt = db.prepare(`
    INSERT INTO appointments (
      id, origin, residentName, unit, roomNumber, providerName, location, 
      contactNumber, schedulingDate, referralDate, dueDate, status, date, 
      time, pickUpTime, type, description, serviceInHouse, reasonSendOut, 
      transportType, transportCompany, payerForRide, roundTrip, escort, oxygen, notes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    apt.id, apt.origin, apt.residentName, apt.unit, apt.roomNumber, apt.providerName, 
    apt.location, apt.contactNumber, apt.schedulingDate, apt.referralDate, apt.dueDate, 
    apt.status, apt.date, apt.time, apt.pickUpTime, apt.type, apt.description, 
    apt.serviceInHouse, apt.reasonSendOut, apt.transportType, apt.transportCompany, 
    apt.payerForRide, apt.roundTrip, apt.escort, apt.oxygen, apt.notes
  );
  res.status(201).json(apt);
});

app.patch("/api/appointments/:id", (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const keys = Object.keys(updates);
  if (keys.length === 0) return res.status(400).json({ error: "No fields provided" });

  const setClause = keys.map(key => `${key} = ?`).join(", ");
  const values = [...Object.values(updates), id];

  const stmt = db.prepare(`UPDATE appointments SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
  stmt.run(...values);
  
  res.json({ success: true, updatedFields: keys });
});

app.delete("/api/appointments/:id", (req, res) => {
  db.prepare("DELETE FROM appointments WHERE id = ?").run(req.params.id);
  res.status(204).send();
});

// --- VITE MIDDLEWARE ---
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
