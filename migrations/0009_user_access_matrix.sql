-- v1.2 Access Matrix
-- Purpose: store module/submodule access per user and facility.

CREATE TABLE IF NOT EXISTS user_access_matrix (
  userId TEXT NOT NULL,
  facilityId TEXT NOT NULL,
  accessKey TEXT NOT NULL,
  allowed INTEGER DEFAULT 1,
  updatedBy TEXT,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (userId, facilityId, accessKey)
);

CREATE INDEX IF NOT EXISTS idx_user_access_matrix_user_facility ON user_access_matrix(userId, facilityId);
CREATE INDEX IF NOT EXISTS idx_user_access_matrix_access_key ON user_access_matrix(accessKey);
