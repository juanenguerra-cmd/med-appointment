-- User context and access management
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  fullName TEXT,
  role TEXT DEFAULT 'staff', -- 'admin' or 'staff'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_facilities (
  userId TEXT NOT NULL,
  facilityId TEXT NOT NULL,
  PRIMARY KEY (userId, facilityId),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (facilityId) REFERENCES facilities(id) ON DELETE CASCADE
);

-- Note: In a real Cloudflare access or Firebase setup, the email would be verified there.
-- Inserting a default admin user based on the environment metadata if possible, 
-- or just a placeholder for now.
INSERT OR IGNORE INTO users (id, email, fullName, role) 
VALUES ('admin-user-1', 'juan.enguerra.secure@gmail.com', 'Admin User', 'admin');

-- Link admin to default facility
INSERT OR IGNORE INTO user_facilities (userId, facilityId)
VALUES ('admin-user-1', 'default-id');
