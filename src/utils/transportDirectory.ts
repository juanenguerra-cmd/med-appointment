import { TransportationCompany } from '../types';

export const TRANSPORT_DIRECTORY_STORAGE_KEY = 'transportationDirectory_v1';

export const DEFAULT_TRANSPORTATION_COMPANIES: TransportationCompany[] = [
  {
    id: 'transport-company-other',
    name: 'Others',
    phone: '',
    address: '',
    notes: 'Manual entry option for companies not listed in the directory.',
    active: true,
  },
];

export function loadTransportationDirectory(): TransportationCompany[] {
  try {
    const raw = localStorage.getItem(TRANSPORT_DIRECTORY_STORAGE_KEY);
    if (!raw) return DEFAULT_TRANSPORTATION_COMPANIES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_TRANSPORTATION_COMPANIES;
    return parsed;
  } catch {
    return DEFAULT_TRANSPORTATION_COMPANIES;
  }
}

export function saveTransportationDirectory(companies: TransportationCompany[]) {
  localStorage.setItem(TRANSPORT_DIRECTORY_STORAGE_KEY, JSON.stringify(companies));
}

export function findTransportationCompany(
  companies: TransportationCompany[],
  companyIdOrName?: string,
): TransportationCompany | undefined {
  const key = String(companyIdOrName || '').trim().toLowerCase();
  if (!key) return undefined;
  return companies.find(
    (company) =>
      company.id.toLowerCase() === key ||
      company.name.toLowerCase() === key,
  );
}

export function getTransportationDisplayName(company?: TransportationCompany) {
  if (!company) return '';
  return company.name === 'Others' ? 'Others' : company.name;
}
