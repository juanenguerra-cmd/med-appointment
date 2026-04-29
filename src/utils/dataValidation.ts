import { Appointment, AppointmentStatus, Facility, Resident } from '../types';

export type ValidationIssue = {
  field: string;
  message: string;
  severity: 'warning' | 'error';
};

export type ValidationResult<T> = {
  value: T;
  issues: ValidationIssue[];
  isValid: boolean;
};

const VALID_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'Scheduled',
  'Completed',
  'Cancelled',
  'Pending',
  'Hospitalized',
  'Discontinued',
  'Deferred',
  'Rescheduled',
  'Pending Scheduling Review' as AppointmentStatus,
];

export const safeString = (value: unknown, fallback = ''): string => {
  if (value === undefined || value === null) return fallback;
  return String(value);
};

export const safeLower = (value: unknown): string => safeString(value).trim().toLowerCase();

export const safeBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  return ['true', 'yes', 'y', '1', 'checked'].includes(safeLower(value));
};

export const isIsoDate = (value: unknown): boolean => /^\d{4}-\d{2}-\d{2}$/.test(safeString(value).trim());

const normalizeDateLike = (value: unknown): string => {
  const text = safeString(value).trim();
  if (!text || text === '—') return '';
  if (isIsoDate(text)) return text;

  const slashDate = text.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2}|\d{4})$/);
  if (slashDate) {
    const [, month, day, rawYear] = slashDate;
    const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return '';
};

const normalizeResidentStatus = (status: unknown): 'Active' | 'Discharged' => {
  const text = safeString(status).trim().toLowerCase();
  if (text === 'discharged' || text === 'inactive') return 'Discharged';
  return 'Active';
};

const required = (issues: ValidationIssue[], field: string, value: unknown, label: string) => {
  if (!safeString(value).trim() || safeString(value).trim() === '—') {
    issues.push({ field, message: `${label} is required.`, severity: 'error' });
  }
};

const warnInvalidDate = (issues: ValidationIssue[], field: string, value: unknown, label: string) => {
  const text = safeString(value).trim();
  if (text && text !== '—' && !isIsoDate(text)) {
    issues.push({ field, message: `${label} should use YYYY-MM-DD format.`, severity: 'warning' });
  }
};

export function normalizeAppointment(input: Partial<Appointment> | any): Appointment {
  const rawStatus = safeString(input?.status, input?.date ? 'Scheduled' : 'Pending Scheduling Review').trim() || (input?.date ? 'Scheduled' : 'Pending Scheduling Review');
  const status = VALID_APPOINTMENT_STATUSES.includes(rawStatus as AppointmentStatus)
    ? (rawStatus as AppointmentStatus)
    : (input?.date ? 'Scheduled' : 'Pending Scheduling Review' as AppointmentStatus);

  return {
    ...input,
    id: safeString(input?.id),
    facilityId: safeString(input?.facilityId),
    origin: safeString(input?.origin),
    residentName: safeString(input?.residentName),
    unit: safeString(input?.unit),
    roomNumber: safeString(input?.roomNumber),
    providerName: safeString(input?.providerName),
    location: safeString(input?.location),
    contactNumber: safeString(input?.contactNumber),
    schedulingDate: normalizeDateLike(input?.schedulingDate),
    referralDate: normalizeDateLike(input?.referralDate),
    status,
    date: normalizeDateLike(input?.date),
    time: safeString(input?.time),
    pickUpTime: safeString(input?.pickUpTime),
    type: safeString(input?.type),
    description: safeString(input?.description),
    serviceInHouse: safeString(input?.serviceInHouse),
    reasonSendOut: safeString(input?.reasonSendOut),
    transportType: safeString(input?.transportType),
    transportTypeOther: safeString(input?.transportTypeOther),
    transportCompany: safeString(input?.transportCompany),
    payerForRide: safeString(input?.payerForRide),
    payerForRideOther: safeString(input?.payerForRideOther),
    roundTrip: safeString(input?.roundTrip),
    escort: safeString(input?.escort),
    escortDetails: safeString(input?.escortDetails),
    notes: safeString(input?.notes),
    weight: safeString(input?.weight),
    height: safeString(input?.height),
    nurseCompleting: safeString(input?.nurseCompleting),
    reasonConsultation: safeString(input?.reasonConsultation),
    consultReason: safeString(input?.consultReason),
    ambulating: safeBoolean(input?.ambulating),
    wheelchair: safeBoolean(input?.wheelchair),
    withLift: safeBoolean(input?.withLift),
    recliner: safeBoolean(input?.recliner),
    oxygen: safeBoolean(input?.oxygen),
    bariatric: safeBoolean(input?.bariatric),
  };
}

export function validateAppointment(input: Partial<Appointment> | any): ValidationResult<Appointment> {
  const value = normalizeAppointment(input);
  const issues: ValidationIssue[] = [];

  required(issues, 'residentName', value.residentName, 'Resident name');
  required(issues, 'type', value.type, 'Specialty');
  warnInvalidDate(issues, 'date', value.date, 'Appointment date');
  warnInvalidDate(issues, 'schedulingDate', value.schedulingDate, 'Transport scheduling date');
  warnInvalidDate(issues, 'referralDate', value.referralDate, 'Referral date');

  return {
    value,
    issues,
    isValid: issues.every((issue) => issue.severity !== 'error'),
  };
}

export function normalizeResident(input: Partial<Resident> | any): Resident {
  return {
    ...input,
    id: safeString(input?.id),
    facilityId: safeString(input?.facilityId),
    name: safeString(input?.name),
    lastName: safeString(input?.lastName),
    firstName: safeString(input?.firstName),
    mrn: safeString(input?.mrn),
    age: safeString(input?.age),
    floor: safeString(input?.floor),
    unit: safeString(input?.unit),
    roomNumber: safeString(input?.roomNumber),
    sex: safeString(input?.sex),
    admissionDate: normalizeDateLike(input?.admissionDate),
    allergies: safeString(input?.allergies),
    doctor: safeString(input?.doctor),
    diagnosis: safeString(input?.diagnosis),
    lastVisit: safeString(input?.lastVisit),
    notes: safeString(input?.notes),
    status: normalizeResidentStatus(input?.status),
    dischargedAt: safeString(input?.dischargedAt),
    lastSeenCensusAt: safeString(input?.lastSeenCensusAt),
    dischargeBatchId: safeString(input?.dischargeBatchId),
  };
}

export function validateResident(input: Partial<Resident> | any): ValidationResult<Resident> {
  const value = normalizeResident(input);
  const issues: ValidationIssue[] = [];

  required(issues, 'name', value.name, 'Resident name');
  required(issues, 'roomNumber', value.roomNumber, 'Room number');
  warnInvalidDate(issues, 'admissionDate', value.admissionDate, 'Admission date');

  if (!value.mrn && (!value.name || !value.roomNumber)) {
    issues.push({
      field: 'mrn',
      message: 'MRN is recommended when name/room matching is incomplete.',
      severity: 'warning',
    });
  }

  return {
    value,
    issues,
    isValid: issues.every((issue) => issue.severity !== 'error'),
  };
}

export function normalizeFacility(input: Partial<Facility> | any): Facility {
  return {
    ...input,
    id: safeString(input?.id),
    name: safeString(input?.name),
    address: safeString(input?.address),
    phone: safeString(input?.phone),
    contactPerson: safeString(input?.contactPerson),
  };
}

export function validateFacility(input: Partial<Facility> | any): ValidationResult<Facility> {
  const value = normalizeFacility(input);
  const issues: ValidationIssue[] = [];

  required(issues, 'name', value.name, 'Facility name');

  return {
    value,
    issues,
    isValid: issues.every((issue) => issue.severity !== 'error'),
  };
}

export function normalizeResidentKey(resident: Partial<Resident>) {
  const mrn = safeString(resident.mrn).trim();
  if (mrn && mrn !== '—') return `mrn:${safeLower(mrn)}`;

  const name = safeString(resident.name).trim().replace(/\s+/g, ' ');
  const room = safeString(resident.roomNumber).trim().replace(/\s+/g, ' ');
  return `name-room:${safeLower(name)}|${safeLower(room)}`;
}
