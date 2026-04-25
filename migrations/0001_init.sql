CREATE TABLE IF NOT EXISTS facilities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  contactPerson TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  fullName TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  password TEXT,
  lastLogin TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_facilities (
  userId TEXT NOT NULL,
  facilityId TEXT NOT NULL,
  PRIMARY KEY (userId, facilityId),
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (facilityId) REFERENCES facilities(id)
);

CREATE TABLE IF NOT EXISTS residents (
  id TEXT PRIMARY KEY,
  facilityId TEXT NOT NULL,
  name TEXT,
  mrn TEXT,
  lastName TEXT,
  firstName TEXT,
  age TEXT,
  floor TEXT,
  unit TEXT,
  roomNumber TEXT,
  sex TEXT,
  admissionDate TEXT,
  allergies TEXT,
  doctor TEXT,
  diagnosis TEXT,
  notes TEXT,
  lastVisit TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  facilityId TEXT NOT NULL,
  origin TEXT,
  residentName TEXT,
  unit TEXT,
  roomNumber TEXT,
  providerName TEXT,
  location TEXT,
  contactNumber TEXT,
  schedulingDate TEXT,
  referralDate TEXT,
  status TEXT,
  date TEXT,
  time TEXT,
  pickUpTime TEXT,
  type TEXT,
  description TEXT,
  serviceInHouse TEXT,
  reasonSendOut TEXT,
  transportType TEXT,
  transportTypeOther TEXT,
  transportCompany TEXT,
  payerForRide TEXT,
  payerForRideOther TEXT,
  roundTrip TEXT,
  escort TEXT,
  escortDetails TEXT,
  oxygen INTEGER,
  notes TEXT,
  weight TEXT,
  height TEXT,
  nurseCompleting TEXT,
  reasonConsultation TEXT,
  consultReason TEXT,
  ambulating INTEGER,
  wheelchair INTEGER,
  withLift INTEGER,
  recliner INTEGER,
  bariatric INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_residents_facilityId
ON residents (facilityId);

CREATE INDEX IF NOT EXISTS idx_appointments_facilityId
ON appointments (facilityId);

CREATE INDEX IF NOT EXISTS idx_appointments_date
ON appointments (date);

CREATE INDEX IF NOT EXISTS idx_appointments_status
ON appointments (status);

INSERT OR IGNORE INTO facilities (
  id, name, address, phone, contactPerson
) VALUES (
  'default-facility',
  'Default Facility',
  '',
  '',
  ''
);

INSERT OR IGNORE INTO users (
  id, email, fullName, role, password
) VALUES (
  'admin-user',
  'admin@healthsync.local',
  'System Administrator',
  'admin',
  NULL
);

INSERT OR IGNORE INTO user_facilities (
  userId, facilityId
) VALUES (
  'admin-user',
  'default-facility'
);
