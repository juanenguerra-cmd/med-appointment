ALTER TABLE users ADD COLUMN username TEXT;
ALTER TABLE users ADD COLUMN roleIds TEXT;
ALTER TABLE users ADD COLUMN staffId TEXT;
ALTER TABLE users ADD COLUMN title TEXT;
ALTER TABLE users ADD COLUMN department TEXT;
ALTER TABLE users ADD COLUMN payrollNo TEXT;
ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active';
ALTER TABLE users ADD COLUMN defaultFacilityId TEXT;
ALTER TABLE users ADD COLUMN customPermissions TEXT;
ALTER TABLE users ADD COLUMN forcePasswordReset INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN deactivatedAt TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_default_facility ON users(defaultFacilityId);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  purpose TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_purpose ON auth_sessions(userId, purpose);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expiry ON auth_sessions(expiresAt);
