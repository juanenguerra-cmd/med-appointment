# HealthSync Medical Appointment Tracker

## Current Architecture

- React + Vite frontend
- Cloudflare Worker backend (Hono)
- Cloudflare D1 database
- LocalStorage used only for session and cached modules

## Key Capabilities

- Facility-based access control
- User login and role management (prototype)
- Resident census import and parsing
- Appointment tracking and reporting
- PDF export tools

## Important Notes

- This build now uses D1 for facilities, users, residents, and appointments
- Doctors and records remain stored locally (temporary)
- Authentication is for prototype/testing only (not production secure)

## Run Locally

```bash
npm install
npm run dev
```

## Build & Deploy

```bash
npm run build
npm run deploy
```

## Version

### v0.2.0-D1-Prototype

- Migrated core data (facilities, users, residents, appointments) to D1
- Added Worker API backend
- Added facility-based filtering and permissions
- Census import now updates facility-based resident registry
- Appointments now persist via backend

### Known Limitations

- Passwords are not securely hashed
- Doctors/records not yet in D1
- Census replacement does not yet mark discharged residents

