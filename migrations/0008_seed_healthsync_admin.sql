-- 0008_seed_healthsync_admin.sql
-- Purpose:
-- Adds the HealthSync first-login admin account to the existing migration chain.
-- This file is designed to be used AFTER the existing migrations:
-- 0001_initial.sql through 0007_appointment_transport_details.sql.
--
-- IMPORTANT:
-- Delete or do not apply the duplicate file named migrations/0001_init.sql.
-- Keep the original migrations/0001_initial.sql.

INSERT OR IGNORE INTO facilities (
  id,
  name,
  address,
  phone,
  contactPerson
) VALUES (
  'default-facility',
  'Default Facility',
  '',
  '',
  ''
);

INSERT OR IGNORE INTO users (
  id,
  email,
  fullName,
  role,
  password
) VALUES (
  'admin-user',
  'admin@healthsync.local',
  'System Administrator',
  'admin',
  NULL
);

INSERT OR IGNORE INTO user_facilities (
  userId,
  facilityId
) VALUES (
  'admin-user',
  'default-facility'
);

-- Also link the admin account to the older default facility created by 0002_facilities.sql.
INSERT OR IGNORE INTO user_facilities (
  userId,
  facilityId
) VALUES (
  'admin-user',
  'default-id'
);
