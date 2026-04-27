# HealthSync Medical Appointment Tracker

![Version](https://img.shields.io/badge/version-v1.0.0--LOCKED-blue)
![Status](https://img.shields.io/badge/status-Production%20Baseline-green)

A production-ready healthcare appointment, resident census, audit, and reporting tracker designed for long-term care operations.

---

## Developed By

**Juan Enguerra, RN**

This tracker was developed and built by **Juan Enguerra** to support real-world clinical and operational workflows in long-term care, including appointment coordination, resident census management, transport planning, audit tracking, and compliance-ready reporting.

---

## Current Locked Version

**v1.0.0 — Production Baseline (LOCKED)**  
**Lock Date:** April 26, 2026

This version is locked as the official production baseline. Core workflows for appointments, residents, census handling, validation, audit tracking, reporting, and production readiness review are considered stable for use.

Future enhancements should be developed as a new working version and should not directly modify this locked baseline without creating a new version history entry.

---

## Current Architecture

- React + Vite frontend
- Cloudflare Worker backend using Hono
- Cloudflare D1 database
- LocalStorage used for session, runtime errors, and local audit logs
- Client-side and server-side validation before database writes
- D1-efficient write flow with dirty-checking and partial updates

---

## Key Capabilities

- Facility-based access control
- User login and role management
- Resident census import and parsing
- Resident registry management
- Appointment creation, editing, deletion, filtering, and reporting
- PDF export tools for appointment and transport workflows
- Runtime error protection through a React Error Boundary
- Frontend validation before save
- Server-side validation before D1 write
- Write boundary guard to reduce unnecessary database writes
- Local audit logging for appointments, residents, and census workflows
- Audit Viewer with filters, summary cards, and CSV export
- Production Checklist dashboard with readiness indicators and CSV export

---

## Production Baseline Summary — v1.0.0 LOCKED

This release establishes the tracker as a stable production baseline with the following workflow improvements:

- Added system-wide crash protection to prevent blank screens during runtime errors
- Added local runtime error logging for troubleshooting
- Added validation before saving appointments, residents, and facilities
- Added backend validation to reject invalid data before Cloudflare D1 writes
- Added dirty-checking so unchanged records are not written again
- Added partial update behavior so only changed fields are sent to the API
- Added audit tracking for appointment create/update/delete actions
- Added audit tracking for resident create/update/delete actions
- Added audit tracking for census import and census replacement workflows
- Added Audit Viewer with search, filters, dashboard cards, and CSV export
- Added Production Checklist dashboard for go-live review
- Improved resident/census handling to reduce duplicate and corrupted records

---

## Important Notes

- Audit logs are currently stored locally in the browser to avoid extra D1 reads/writes
- Runtime error logs are stored locally in the browser for troubleshooting
- First-time users may need to be created manually or seeded in D1 before login
- Doctors and records remain stored locally at this stage
- Authentication should be further hardened before broad multi-user production rollout

---

## Run Locally

```bash
npm install
npm run dev
```

Vite frontend:

```text
http://localhost:3000
```

Wrangler Worker API:

```text
http://localhost:3001
```

Health check:

```text
/api/health
```

Expected result:

```json
{
  "status": "ok",
  "database": "Connected"
}
```

---

## Build & Deploy

```bash
npm run build
npm run deploy
```

---

## First-Time Admin Setup

If no user exists in the local D1 database, create an admin user:

```bash
npx wrangler d1 execute DB --local --command "INSERT INTO users (id, email, fullName, role, password) VALUES ('admin-001', 'admin@healthsync.local', 'System Administrator', 'admin', NULL);"
```

Then log in with:

```text
admin@healthsync.local
```

The app should prompt for first-time password creation.

---

## Version History

### v1.0.0 — Production Baseline (LOCKED)

- Locked the current tracker as the official production baseline
- Added runtime crash protection and local error logging
- Added frontend and backend validation for safer data entry
- Added D1-efficient write guards and dirty-checking
- Added audit logging for appointments, residents, and census workflows
- Added Audit Viewer with dashboard cards and CSV export
- Added Production Checklist dashboard for go-live review
- Added project ownership attribution to Juan Enguerra

### v0.2.0-D1-Prototype

- Migrated core data for facilities, users, residents, and appointments to D1
- Added Worker API backend
- Added facility-based filtering and permissions
- Census import updates facility-based resident registry
- Appointments persist through backend API

---

## Known Limitations

- Local audit logs are browser-specific and do not yet sync across devices
- Passwords are not securely hashed yet
- Doctors and records are not yet persisted in D1
- Census replacement does not yet fully automate discharge/inactive status workflows

