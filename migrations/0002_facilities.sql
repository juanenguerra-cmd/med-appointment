-- Add facilities support
CREATE TABLE IF NOT EXISTS facilities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  contactPerson TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add facilityId to residents and appointments
ALTER TABLE residents ADD COLUMN facilityId TEXT;
ALTER TABLE appointments ADD COLUMN facilityId TEXT;

CREATE INDEX IF NOT EXISTS idx_residents_facility ON residents(facilityId);
CREATE INDEX IF NOT EXISTS idx_appointments_facility ON appointments(facilityId);

-- Insert a default facility if none exists
INSERT OR IGNORE INTO facilities (id, name, address, phone) 
VALUES ('default-id', 'Main Facility', '123 Primary Way, Health City', '555-0100');

-- Link existing data to default facility
UPDATE residents SET facilityId = 'default-id' WHERE facilityId IS NULL;
UPDATE appointments SET facilityId = 'default-id' WHERE facilityId IS NULL;
