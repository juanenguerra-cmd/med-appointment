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
  PRIMARY KEY (userId, facilityId)
);

CREATE TABLE IF NOT EXISTS residents (
  id TEXT PRIMARY KEY,
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
  status TEXT DEFAULT 'Active',
  dischargedAt TEXT,
  lastSeenCensusAt TEXT,
  facilityId TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
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
  transportCompany TEXT,
  payerForRide TEXT,
  roundTrip TEXT,
  escort TEXT,
  oxygen TEXT,
  notes TEXT,
  facilityId TEXT NOT NULL,
  weight TEXT,
  height TEXT,
  nurseCompleting TEXT,
  reasonConsultation TEXT,
  transportTypeOther TEXT,
  payerForRideOther TEXT,
  escortDetails TEXT,
  consultReason TEXT,
  ambulating TEXT,
  wheelchair TEXT,
  withLift TEXT,
  recliner TEXT,
  bariatric TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
