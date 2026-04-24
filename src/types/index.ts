export type AppointmentStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'Pending' | 'Hospitalized';

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface Facility {
  id: string;
  name: string;
  address: string;
  phone: string;
  contactPerson?: string;
}

export interface Appointment {
  id: string;
  facilityId: string;
  // Origin & Patient Info
  origin: string;
  residentName: string;
  unit: string;
  roomNumber: string;
  
  // Location Details
  providerName: string;
  location: string;
  contactNumber: string;
  
  // Dates & Status
  schedulingDate: string;
  referralDate: string;
  dueDate: string;
  status: AppointmentStatus;
  
  // Appointment Details
  date: string;
  time: string;
  pickUpTime: string;
  type: string; // Specialty
  description: string;
  
  // Clinical Context
  serviceInHouse: string;
  reasonSendOut: string;
  
  // Transport Details
  transportType: string;
  transportCompany: string;
  payerForRide: string;
  roundTrip: string;
  escort: string;
  
  notes: string;
}

export interface MedicalRecord {
  id: string;
  date: string;
  title: string;
  content: string;
  doctorId?: string;
}

export interface Resident {
  id: string;
  facilityId: string;
  name: string;
  lastName: string;
  firstName: string;
  mrn: string;
  age: string;
  floor: string;
  unit: string;
  roomNumber: string;
  sex: 'Male' | 'Female' | 'M' | 'F' | string;
  admissionDate: string;
  allergies: string;
  doctor: string;
  diagnosis: string;
  lastVisit?: string;
  notes?: string;
}
