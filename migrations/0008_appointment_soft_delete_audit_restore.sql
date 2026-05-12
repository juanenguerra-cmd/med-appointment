-- v1.1 Safety Patch: Appointment Soft Delete + Audit/Restore Support
-- Purpose: preserve appointment history and provide admin restore/audit workflows.

ALTER TABLE appointments ADD COLUMN deletedAt TEXT;
ALTER TABLE appointments ADD COLUMN deletedBy TEXT;
ALTER TABLE appointments ADD COLUMN restoredAt TEXT;
ALTER TABLE appointments ADD COLUMN restoredBy TEXT;
ALTER TABLE appointments ADD COLUMN previousStatus TEXT;

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  facilityId TEXT,
  actorId TEXT,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entityId TEXT,
  summary TEXT,
  metadata TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_appointments_facility_deleted ON appointments(facilityId, deletedAt);
CREATE INDEX IF NOT EXISTS idx_audit_logs_facility_created ON audit_logs(facilityId, createdAt);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity, entityId);
