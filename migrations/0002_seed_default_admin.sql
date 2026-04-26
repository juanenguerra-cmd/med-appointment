INSERT OR IGNORE INTO facilities (id, name) VALUES ('default-facility','Default Facility');

INSERT OR IGNORE INTO users (id, email, fullName, role, password)
VALUES ('admin-user','admin@example.com','System Administrator','admin',NULL);

INSERT OR IGNORE INTO user_facilities (userId, facilityId)
VALUES ('admin-user','default-facility');
