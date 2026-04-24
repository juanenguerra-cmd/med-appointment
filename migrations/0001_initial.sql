-- Migration for Med Appointment tracker
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
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
  dueDate TEXT,
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
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_resident ON appointments(residentName);
CREATE INDEX IF NOT EXISTS idx_residents_mrn ON residents(mrn);
