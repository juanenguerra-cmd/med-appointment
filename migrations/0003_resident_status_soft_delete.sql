-- v1.1 STEP 1: Resident Status Safety Migration
-- Purpose: Introduce soft-discharge (no deletion) model for residents

ALTER TABLE residents ADD COLUMN status TEXT DEFAULT 'active';
ALTER TABLE residents ADD COLUMN dischargedAt TEXT;
ALTER TABLE residents ADD COLUMN lastSeenCensusAt TEXT;
ALTER TABLE residents ADD COLUMN dischargeBatchId TEXT;

-- Backfill existing records
UPDATE residents SET status = 'active' WHERE status IS NULL;
