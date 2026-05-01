-- v2.2.2: D1 Schema Alignment Cleanup
-- Purpose: align the D1 database shape with the current Worker API while avoiding overlap
-- with existing migrations:
--   0003_resident_status_soft_delete.sql
--   0004_appointment_resident_identity.sql
--   0006_user_passwords.sql
--   0007_appointment_transport_details.sql
--
-- Important: this migration intentionally DOES NOT add columns already owned by those files.

-- Shared facility registry used to scope residents, appointments, users, and transportation directory records.
CREATE TABLE IF NOT EXISTS facilities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  contactPerson TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Application users.
-- Password and lastLogin are intentionally added by 0006_user_passwords.sql.
-- Password hashing/session hardening should be handled in a separate security migration/workflow update.
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  fullName TEXT,
  role TEXT DEFAULT 'staff',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_facilities (
  userId TEXT NOT NULL,
  facilityId TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (userId, facilityId)
);

-- Shared transportation directory used by the appointment modal and transport outputs.
CREATE TABLE IF NOT EXISTS transportation_companies (
  id TEXT PRIMARY KEY,
  facilityId TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  notes TEXT,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add missing resident field expected by the current facility-scoped Worker routes.
-- Resident status/discharge fields are intentionally handled by 0003_resident_status_soft_delete.sql.
ALTER TABLE residents ADD COLUMN facilityId TEXT;

-- Add missing appointment fields expected by the current Worker, appointment modal, report builder, and PDF outputs.
-- residentId/residentMrn are intentionally handled by 0004_appointment_resident_identity.sql.
-- transportTypeOther/payerForRideOther/escortDetails are intentionally handled by 0007_appointment_transport_details.sql.
ALTER TABLE appointments ADD COLUMN facilityId TEXT;
ALTER TABLE appointments ADD COLUMN transportCompanyId TEXT;
ALTER TABLE appointments ADD COLUMN transportCompanyPhone TEXT;
ALTER TABLE appointments ADD COLUMN transportCompanyOther TEXT;
ALTER TABLE appointments ADD COLUMN escortPhone TEXT;
ALTER TABLE appointments ADD COLUMN weight TEXT;
ALTER TABLE appointments ADD COLUMN height TEXT;
ALTER TABLE appointments ADD COLUMN nurseCompleting TEXT;
ALTER TABLE appointments ADD COLUMN reasonConsultation TEXT;
ALTER TABLE appointments ADD COLUMN consultReason TEXT;
ALTER TABLE appointments ADD COLUMN ambulating INTEGER DEFAULT 0;
ALTER TABLE appointments ADD COLUMN wheelchair INTEGER DEFAULT 0;
ALTER TABLE appointments ADD COLUMN withLift INTEGER DEFAULT 0;
ALTER TABLE appointments ADD COLUMN recliner INTEGER DEFAULT 0;
ALTER TABLE appointments ADD COLUMN bariatric INTEGER DEFAULT 0;

-- Safety indexes for the current facility-scoped workflows.
CREATE INDEX IF NOT EXISTS idx_residents_facility ON residents(facilityId);
CREATE INDEX IF NOT EXISTS idx_residents_status ON residents(status);
CREATE INDEX IF NOT EXISTS idx_residents_facility_status ON residents(facilityId, status);
CREATE INDEX IF NOT EXISTS idx_appointments_facility ON appointments(facilityId);
CREATE INDEX IF NOT EXISTS idx_appointments_facility_date ON appointments(facilityId, date);
CREATE INDEX IF NOT EXISTS idx_appointments_resident_identity ON appointments(residentId, residentMrn);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_transportation_companies_facility ON transportation_companies(facilityId, active);
CREATE INDEX IF NOT EXISTS idx_user_facilities_user ON user_facilities(userId);
CREATE INDEX IF NOT EXISTS idx_user_facilities_facility ON user_facilities(facilityId);
