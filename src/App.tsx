/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  generateAppointmentPDF,
  generateFullReport,
  generateTransportSchedulePDF,
  generateOutsideAppointmentChecklistPDF,
  generateMedicalClearancePDF,
} from "./services/pdfService";
import {
  Calendar,
  Users,
  ClipboardList,
  ClipboardCheck,
  FileSignature,
  FileDown,
  Plus,
  Clock,
  MapPin,
  ChevronRight,
  Search,
  Menu,
  X,
  Stethoscope,
  Activity,
  User,
  Database,
  ShieldCheck,
  FileText,
  Phone,
  BarChart3,
  TrendingUp,
  Trash2,
  Filter,
  CheckSquare,
  Square,
  Download,
  Home,
  Copy,
  CopyPlus,
} from "lucide-react";
import { AppointmentModal, Button, Card, LockScreen } from "./components";
import { useHealthData } from "./hooks";
import type { Appointment, Facility, Resident, TransportationCompany } from "./typeExports";
import { CONSULT_REASONS_BY_SPECIALTY } from "./constants/consultReasons";
import { MEDICAL_SPECIALTIES } from "./constants/medicalSpecialties";
import { DirectoryPage } from "./pages/DirectoryPage";
import { TrendsPage } from "./pages/TrendsPage";
import { HelpPage } from "./pages/HelpPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ReportsPage } from "./pages/ReportsPage";
import { CensusPage } from "./pages/CensusPage";
import { AppointmentsPage } from "./pages/AppointmentsPage";
import {
  getConsultFormLabel,
  openConsultForm,
} from "./services/consultForms";
import { apiFetch } from "./api/apiClient";

type Tab =
  | "dashboard"
  | "appointments"
  | "trends"
  | "reports"
  | "census"
  | "directory"
  | "help";

const TAB_META: Record<
  Tab,
  { title: string; subtitle: string; badge: string }
> = {
  dashboard: {
    title: "Dashboard",
    subtitle:
      "High-level overview of upcoming visits, volume trends, and provider activity.",
    badge: "Overview",
  },
  appointments: {
    title: "Appointments",
    subtitle:
      "Manage and monitor all scheduled medical visits and logistics in one place.",
    badge: "Entry Log",
  },
  trends: {
    title: "Specialty Trends",
    subtitle:
      "Visualize visit volume by specialty to identify service demand and distribution.",
    badge: "Analytics",
  },
  reports: {
    title: "Report Builder",
    subtitle:
      "Generate and export clinical data reports for specific date ranges or providers.",
    badge: "Operations",
  },
  census: {
    title: "Patient Census",
    subtitle:
      "Manage resident data, unit assignments, and room allocations for auto-fill.",
    badge: "Registry",
  },
  directory: {
    title: "Transportation Directory",
    subtitle:
      "Manage transportation company names and contact details for appointment auto-fill.",
    badge: "Directory",
  },
  help: {
    title: "System Guide",
    subtitle:
      "Version history, user instructions, and technical documentation.",
    badge: "Support",
  },
};

const safeLower = (value: unknown) => String(value ?? "").toLocaleLowerCase();

const getLocalDateKey = (date = new Date()) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const parseDateKeyAsLocalDate = (dateStr?: string) => {
  const raw = String(dateStr || "").trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
};

const getAppointmentSortTime = (apt: Partial<Appointment>) => {
  const date = parseDateKeyAsLocalDate(apt.date);
  if (!date) return Number.MAX_SAFE_INTEGER;
  const rawTime = String(apt.time || "00:00");
  const [hours = "0", minutes = "0"] = rawTime.split(":");
  date.setHours(Number(hours) || 0, Number(minutes) || 0, 0, 0);
  return date.getTime();
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showOtherSpecialtyInput, setShowOtherSpecialtyInput] = useState(false);
  const [modalStatusPrompt, setModalStatusPrompt] = useState<{status: string, reason: string} | null>(null);

  const [newAppt, setNewAppt] = useState<Partial<Appointment>>({
    status: "Scheduled",
    residentId: "",
    residentMrn: "",
    residentName: "",
    origin: "",
    unit: "",
    roomNumber: "",
    providerName: "",
    location: "",
    contactNumber: "",
    schedulingDate: "",
    referralDate: "",
    date: "",
    time: "",
    pickUpTime: "",
    type: "",
    description: "",
    serviceInHouse: "",
    reasonSendOut: "",
    transportType: "",
    transportCompany: "",
    transportCompanyId: "",
    transportCompanyPhone: "",
    transportCompanyOther: "",
    payerForRide: "",
    roundTrip: "",
    escort: "",
    escortPhone: "",
    notes: "",
    reasonConsultation: "",
    consultReason: "",
  });

  const {
    facilities,
    currentFacilityId,
    setCurrentFacilityId,
    addFacility,
    updateFacility,
    deleteFacility,
    users,
    currentUser,
    setCurrentUser,
    login,
    logout,
    setupPassword,
    addUser,
    updateUser,
    updateUserPermissions,
    fetchUserPermissions,
    appointments,
    doctors,
    records,
    residents,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    batchAddResidents,
    replaceResidents,
    deleteResident,
    isLoaded,
  } = useHealthData();

  const [isFacModalOpen, setIsFacModalOpen] = useState(false);
  const [editingFac, setEditingFac] = useState<Facility | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userFacPermissions, setUserFacPermissions] = useState<string[]>([]);

  const currentFacility = facilities.find((f) => f.id === currentFacilityId);
  const [transportCompanies, setTransportCompanies] = useState<TransportationCompany[]>([]);

  React.useEffect(() => {
    if (!currentFacilityId) {
      setTransportCompanies([]);
      return;
    }

    apiFetch<TransportationCompany[]>(`/api/transportation-companies?facilityId=${encodeURIComponent(currentFacilityId)}`)
      .then((data) => setTransportCompanies(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.error("Failed to load transportation directory", error);
        setTransportCompanies([]);
      });
  }, [currentFacilityId]);

  const [censusPasteText, setCensusPasteText] = useState("");
  const [parsedResidentsPreview, setParsedResidentsPreview] = useState<
    Omit<Resident, "id">[]
  >([]);
  const [isParsing, setIsParsing] = useState(false);
  const [censusSkipDuplicates, setCensusSkipDuplicates] = useState(false);

  const [reportFilters, setReportFilters] = useState({
    startDate: "",
    endDate: "",
    specialties: [] as string[],
    exportType: "PDF Document (.pdf)",
    columns: [
      "Resident Name",
      "Date",
      "Time",
      "Provider",
      "Specialty",
      "Transport",
    ],
  });

  const [appointmentsFilter, setAppointmentsFilter] = useState({
    dateRange: "next7days",
    month: getLocalDateKey().slice(0, 7),
    status: "All",
  });

  const [residentSearchTerm, setResidentSearchTerm] = useState("");
  const [showResidentSuggestions, setShowResidentSuggestions] = useState(false);
  const [censusSearchQuery, setCensusSearchQuery] = useState("");
  const [selectedResident, setSelectedResident] = useState<Resident | null>(
    null,
  );
  const [isResidentDetailOpen, setIsResidentDetailOpen] = useState(false);
  const printIframeRef = React.useRef<HTMLIFrameElement>(null);

  if (!currentUser) {
    return (
      <LockScreen 
        onLogin={login}
        onSetupPassword={setupPassword}
        onLoginSuccess={setCurrentUser}
      />
    );
  }

  const handleParseCensus = () => {
    if (!censusPasteText.trim()) return;
    setIsParsing(true);

    const lines = censusPasteText.split("\n");
    const residentMap = new Map<string, any>();

    // Pre-process lines to aggregate wrapped content (e.g., long allergy lists on new lines)
    const aggregatedLines: string[] = [];
    let currentBuffer = "";

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Detect if this line looks like the start of a resident record: "Name (MRN)"
      const isNewRecord = /^[A-Z0-9\s,.-]+?\s*[\(\[]([A-Z0-9-]+)[\)\]]/i.test(trimmed);
      
      if (isNewRecord) {
        if (currentBuffer) aggregatedLines.push(currentBuffer);
        currentBuffer = trimmed;
      } else {
        // Check if it's a header line to skip
        const lower = trimmed.toLowerCase();
        const isHeader = lower.includes("resident listing report") || 
                         lower.includes("facility #") || 
                         lower.includes("floor") || 
                         lower.includes("unit") || 
                         lower.includes("gender") ||
                         lower.includes("admission date") ||
                         lower.includes("birth date") || 
                         lower.includes("primary physician");

        if (isHeader) {
          if (currentBuffer) aggregatedLines.push(currentBuffer);
          currentBuffer = ""; // Reset buffer
          aggregatedLines.push(trimmed); // Push header for standard filter to catch
        } else if (currentBuffer) {
          // Append to current record buffer with a delimiter or space
          // If the line has tabs, it might be a partial columnar wrap
          currentBuffer += " " + trimmed;
        } else {
          aggregatedLines.push(trimmed);
        }
      }
    });
    if (currentBuffer) aggregatedLines.push(currentBuffer);

    aggregatedLines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.length < 10) return;

      // Skip common header noise
      const lower = trimmed.toLowerCase();
      if (
        lower.includes("resident listing report") ||
        lower.includes("facility #") ||
        lower.includes("page #") ||
        lower.startsWith("date:") ||
        lower.startsWith("time:") ||
        lower.startsWith("user:") ||
        lower.startsWith("resident:") ||
        lower.includes("status: current") ||
        lower === "name" ||
        lower === "age" ||
        lower === "location" ||
        lower.includes("(fl un rm bd)") ||
        lower.includes("gender") ||
        lower.includes("admission date") ||
        lower.includes("birth date") || 
        lower.includes("primary diagnosis") ||
        lower.includes("resident listing")
      ) {
        return;
      }

      // The format is column-based, typically separated by tabs (\t) or multiple spaces (\s{2,})
      // Use a more robust split that prioritizes tabs if they exist
      let columns: string[] = [];
      if (trimmed.includes("\t")) {
        columns = trimmed.split("\t").map(c => c.trim());
      } else {
        columns = trimmed.split(/\s{2,}/).map(c => c.trim());
      }
      columns = columns.filter(Boolean);

      // If we don't have enough columns, it's probably not a data line
      if (columns.length < 4) return;

      let name = "—";
      let mrn = "—";
      let age = "—";
      let birthDate = "—";
      let location = "—";
      let sex = "—";
      let admissionDate = "—";
      let allergies = "No Known Allergies";
      let doctor = "—";
      let diagnosis = "—";

      // 1. Name and MRN (Column 0)
      const nameMrnPart = columns[0] || "";
      const nameMrnMatch = nameMrnPart.match(/^(.+?)\s*[\(\[]([A-Z0-9-]+)[\)\]]/i);
      if (nameMrnMatch) {
        name = nameMrnMatch[1].trim();
        mrn = nameMrnMatch[2].trim();
      } else {
        name = nameMrnPart;
        // Search for MRN in other parts if missing
        const fallbackMrn = trimmed.match(/[\(\[]([A-Z0-9-]+)[\)\]]/i);
        if (fallbackMrn) mrn = fallbackMrn[1];
      }
      name = name.replace(/,/g, ", ").replace(/\s+/g, " ").trim();
      if (name.toLowerCase() === "name") return;

      // Map columns based on anchored pattern (robust to fragmented columns)
      // Standard: [Name/MRN, Age, BirthDate, ...Location..., Sex, AdmissionDate, Allergies, Doctor, Diagnosis]
      
      const dobIdx = columns.findIndex((c, i) => i > 0 && i < 5 && /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(c));
      const sexIdx = columns.findIndex((c, i) => i > 1 && i < 9 && /^(M|F|Male|Female)$/i.test(c));
      // Admission date is the FIRST date AFTER birthDate (or first date if birthDate missing)
      const admIdx = columns.findIndex((c, i) => i > (dobIdx !== -1 ? dobIdx : 2) && /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(c));

      if (dobIdx !== -1) birthDate = columns[dobIdx];
      if (sexIdx !== -1) sex = columns[sexIdx];
      if (admIdx !== -1) admissionDate = columns[admIdx];

      const ageCol = columns.find((c, i) => i > 0 && i < 3 && /^\d{1,3}$/.test(c));
      if (ageCol) age = ageCol;

      // Location is everything between DOB and Sex (or between DOB and AdmDate if sex missing)
      const locStart = dobIdx !== -1 ? dobIdx + 1 : 3;
      const locEnd = sexIdx !== -1 ? sexIdx : (admIdx !== -1 ? admIdx : columns.length);
      
      if (locEnd > locStart) {
        location = columns.slice(locStart, locEnd).join(" ").trim();
      }

      // Fields after Admission Date
      if (admIdx !== -1 && admIdx < columns.length - 1) {
        const remaining = columns.slice(admIdx + 1);
        
        // Identify which is which in the remaining tail
        remaining.forEach((col, idx) => {
          const c = col.trim();
          if (/dr\.?\s|physician|\bmd\b|doctor/i.test(c)) {
            doctor = c;
          } else if (/nka|nkda|no\s+known|allerg|pcn|sulfa|latex/i.test(c) || (c.includes(",") && doctor === "—")) {
            allergies = c;
          } else if (/^[A-Z]\d{2}(?:\.\d+)?$/i.test(c)) {
            diagnosis = c;
          } else if (idx === remaining.length - 1 && diagnosis === "—") {
            diagnosis = c;
          } else if (idx === remaining.length - 2 && doctor === "—") {
            doctor = c;
          }
        });

        // Positional fallback if heuristics failed for tail
        if (doctor === "—" && remaining.length >= 2) doctor = remaining[remaining.length - 2];
        if (diagnosis === "—" && remaining.length >= 1) diagnosis = remaining[remaining.length - 1];
        if (allergies === "No Known Allergies" && remaining.length >= 3) allergies = remaining[0];
      }

      // Parse Location into Floor/Unit/Room
      let floor = "—";
      let unit = "—";
      let room = "—";

      if (location !== "—") {
        // Floor: "3rd Floor" or "Floor 3"
        const fMatch = location.match(/(\d+(?:st|nd|rd|th)?\sFloor|Floor\s+\d+)/i);
        if (fMatch) {
          floor = fMatch[1].trim();
          location = location.replace(fMatch[0], "").trim();
        }

        // Unit: "Unit 3", "Unit 4", etc.
        const uMatch = location.match(/(Unit\s+\d+|Unit\s+\w+|\bUNIT\s+[A-Z]\b)/i);
        if (uMatch) {
          unit = uMatch[1].trim();
          location = location.replace(uMatch[0], "").trim();
        }
        
        // Final cleaning of remaining location to get Room
        // Room often looks like "359 B" or "470 A" or "101"
        room = location.replace(/[,;]/g, "").trim();
        
        // If room is empty or just gender/noise, skip record
        if (!room || room.length > 15) {
            // Try to find a standalone room number pattern in the original location if extraction failed
            const roomMatch = location.match(/\b\d{2,4}\s?[A-Z]?\b/);
            if (roomMatch) room = roomMatch[0];
            else return; 
        }
      } else {
        return; // Skip if no location
      }

      // Final cleanup
      if (doctor !== "—" && !doctor.toLowerCase().startsWith("dr.")) {
        doctor = "Dr. " + doctor;
      }
      
      // Final cleanup of diagnosis
      if (diagnosis !== "—") {
        diagnosis = diagnosis.replace(/^(Diagnosis|Dx|Primary Diagnosis):?\s*/i, "").trim();
      }

      // Final cleanup of allergies
      if (allergies !== "No Known Allergies") {
        allergies = allergies.replace(/^(Allergies|Allg|Allergy):?\s*/i, "").trim();
      }

      // Final Assembly
      const nameParts = name.split(",").map((n) => n.trim());
      const lastName = nameParts[0] || name;
      const firstName = nameParts.slice(1).join(" ") || "—";

      const resData = {
        name,
        lastName,
        firstName,
        mrn,
        age,
        floor,
        unit,
        roomNumber: room,
        sex: sex.toUpperCase().startsWith("M")
          ? "Male"
          : sex.toUpperCase().startsWith("F")
            ? "Female"
            : "—",
        admissionDate,
        allergies,
        doctor,
        diagnosis,
        notes: birthDate !== "—" ? `DOB: ${birthDate}` : "",
      };

      const uniqueKey = mrn !== "—" ? mrn : `${name}-${room}`.toLowerCase();

      // Duplicate detection
      const alreadyInSystem = residents.some(
        (r) =>
          (resData.mrn !== "—" && r.mrn === resData.mrn) ||
          `${r.name}|${r.roomNumber}`.toLowerCase() ===
            `${resData.name}|${resData.roomNumber}`.toLowerCase(),
      );

      // If skipping duplicates, we don't even add to the map for preview
      if (censusSkipDuplicates && alreadyInSystem) return;

      residentMap.set(uniqueKey, resData);
    });

    setParsedResidentsPreview(Array.from(residentMap.values()));
    setIsParsing(false);
  };

  const handleSaveCensus = () => {
    if (parsedResidentsPreview.length > 0) {
      if (censusSkipDuplicates) {
        // Only append truly new ones
        const trulyNew = parsedResidentsPreview.filter(
          (newRes) =>
            !residents.some(
              (r) =>
                (newRes.mrn !== "—" && r.mrn === newRes.mrn) ||
                `${r.name}|${r.roomNumber}`.toLowerCase() ===
                  `${newRes.name}|${newRes.roomNumber}`.toLowerCase(),
            ),
        );
        batchAddResidents(trulyNew);
      } else {
        // Systematic override of old census listing
        replaceResidents(parsedResidentsPreview);
      }
      setParsedResidentsPreview([]);
      setCensusPasteText("");
    }
  };

  const toggleReportColumn = (col: string) => {
    setReportFilters((prev) => ({
      ...prev,
      columns: prev.columns.includes(col)
        ? prev.columns.filter((c) => c !== col)
        : [...prev.columns, col],
    }));
  };

  const setReportPreset = (type: "today" | "week" | "month") => {
    const start = new Date();
    const end = new Date();

    if (type === "week") {
      start.setDate(start.getDate() - 7);
    } else if (type === "month") {
      start.setMonth(start.getMonth() - 1);
    }

    setReportFilters((prev) => ({
      ...prev,
      startDate: getLocalDateKey(start),
      endDate: getLocalDateKey(end),
    }));
  };
if (!isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-soft-bg text-brand font-black">
        Loading HealthSync...
      </div>
    );
  }

  const handleGenerateForm = (apt: Appointment, formType: string) => {
  try {
    const resident = residents.find((r) => r.name === apt.residentName);

    if (formType === "Visit Form") {
      generateAppointmentPDF(apt, resident, currentFacility);
    } else if (formType === "Checklist") {
      generateOutsideAppointmentChecklistPDF(apt, resident, currentFacility);
    } else if (formType === "Medical Clearance") {
      generateMedicalClearancePDF(apt, "Regular Visit", resident, currentFacility);
    } else if (formType === "Consult") {
      openConsultForm(apt, resident, currentFacility);
    }
  } catch (e) {
    console.error(e);
    alert("Error generating form");
  }
};

  const handleDuplicateAppt = (apt: Appointment) => {
    const { id, ...appData } = apt;
    setEditingId(null);
    setNewAppt({
      ...appData,
      status: "Scheduled" as any
    });
    setIsAddModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setNewAppt({
      status: "Scheduled",
      residentId: "",
      residentMrn: "",
      residentName: "",
      origin: "",
      unit: "",
      roomNumber: "",
      providerName: "",
      location: "",
      contactNumber: "",
      schedulingDate: "",
      referralDate: "",
      date: "",
      time: "",
      pickUpTime: "",
      type: "",
      description: "",
      serviceInHouse: "",
      reasonSendOut: "",
      transportType: "",
      transportCompany: "",
      transportCompanyId: "",
      transportCompanyPhone: "",
      transportCompanyOther: "",
      payerForRide: "",
      roundTrip: "",
      escort: "",
      escortPhone: "",
      notes: "",
      reasonConsultation: "",
      consultReason: "",
    });
    setShowOtherSpecialtyInput(false);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (apt: Appointment) => {
    setEditingId(apt.id);
    const isOther = apt.type !== "" && !(MEDICAL_SPECIALTIES as readonly string[]).includes(apt.type);
    setNewAppt({ ...apt });
    setShowOtherSpecialtyInput(isOther);
    setIsAddModalOpen(true);
  };

  const handleSelectResident = (resident: Resident) => {
    // Normalize unit to match dropdown values if possible
    let matchedUnit = "";
    const unitStr = (resident.unit || "").trim();
    const units = [
      "Unit A",
      "Unit B",
      "Unit 1",
      "Unit 2",
      "Unit 3",
      "Unit 4",
      "Rehab",
    ];

    // Try exact match first (case-insensitive)
    const exactMatch = units.find(
      (u) => u.toLowerCase() === unitStr.toLowerCase(),
    );
    if (exactMatch) {
      matchedUnit = exactMatch;
    } else {
      // Try partial match
      const lower = unitStr.toLowerCase();
      if (lower.includes("unit a")) matchedUnit = "Unit A";
      else if (lower.includes("unit b")) matchedUnit = "Unit B";
      else if (lower.includes("rehab")) matchedUnit = "Rehab";
      else if (lower.includes("unit 1")) matchedUnit = "Unit 1";
      else if (lower.includes("unit 2")) matchedUnit = "Unit 2";
    }

    setNewAppt((prev) => {
      let finalUnit = matchedUnit;
      if (!finalUnit && resident.unit && resident.unit !== "—")
        finalUnit = resident.unit;
      if (!finalUnit && resident.floor && resident.floor !== "—")
        finalUnit = resident.floor;
      if (!finalUnit) finalUnit = prev.unit;

      return {
        ...prev,
        residentId: resident.id,
        residentMrn: resident.mrn,
        residentName: resident.name,
        roomNumber: resident.roomNumber,
        unit: finalUnit,
        notes: `MRN: ${resident.mrn} | Physician: ${resident.doctor} | Age: ${resident.age}`,
      };
    });
  };

  const filteredResidents = residents
    .filter(
      (r) =>
        r.name.toLowerCase().includes(residentSearchTerm.toLowerCase()) ||
        r.mrn.toLowerCase().includes(residentSearchTerm.toLowerCase()),
    )
    .slice(0, 5);

  const handleResidentInputChange = (val: string) => {
    setResidentSearchTerm(val);
    setNewAppt({
      ...newAppt,
      residentId: "",
      residentMrn: "",
      residentName: val,
    });
    setShowResidentSuggestions(true);
  };

  const handleSaveAppointment = () => {
    if (!newAppt.residentName) return;

    if (editingId && updateAppointment) {
      const original = appointments.find((a) => a.id === editingId);
      if (original) {
        const updates: Partial<Appointment> = {};
        (Object.keys(newAppt) as Array<keyof typeof newAppt>).forEach((key) => {
          if (newAppt[key] !== (original as any)[key]) {
            (updates as any)[key] = newAppt[key];
          }
        });
        if (Object.keys(updates).length > 0) {
          updateAppointment(editingId, updates);
        }
      }
    } else {
      addAppointment(newAppt as Omit<Appointment, "id">);
    }

    setIsAddModalOpen(false);
    setEditingId(null);
  };

  const handleSaveAllAppointments = (updates: Record<string, Partial<Appointment>>) => {
    if (!updateAppointment) return;
    Object.entries(updates).forEach(([id, apptUpdates]) => {
      updateAppointment(id, apptUpdates);
    });
  };

  const filteredTabAppointments = appointments.filter((apt) => {
    if (appointmentsFilter.dateRange === "next7days") {
      const today = new Date();
      // Use local time string for today
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const n7d = new Date(today);
      n7d.setDate(n7d.getDate() + 7);
      const n7dStr = `${n7d.getFullYear()}-${String(n7d.getMonth() + 1).padStart(2, '0')}-${String(n7d.getDate()).padStart(2, '0')}`;
      if (apt.date < todayStr || apt.date > n7dStr) {
        return false;
      }
    } else if (appointmentsFilter.dateRange === "month") {
      if (!apt.date.startsWith(appointmentsFilter.month)) return false;
    }
    
    if (appointmentsFilter.status !== "All" && apt.status !== appointmentsFilter.status) return false;
    
    return true;
  });

  const todayKey = getLocalDateKey();

  const upcomingAppointments = appointments
    .filter((a) => a.status === "Scheduled" && String(a.date || "") >= todayKey)
    .sort((a, b) => getAppointmentSortTime(a) - getAppointmentSortTime(b));

  const completedAppointments = appointments.filter(
    (a) => a.status === "Completed",
  );
  const nextAppointment = upcomingAppointments[0];
  const getDoctorNameDisplay = (apt: Appointment) =>
    apt.providerName || "Unknown Provider";
  const goToTab = (tab: Tab) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
    window.requestAnimationFrame(() =>
      window.scrollTo({ top: 0, behavior: "smooth" }),
    );
  };

  const residentAppointments = selectedResident
    ? appointments.filter((a) => {
        const appointmentResidentId = String((a as any).residentId || "").trim();
        const appointmentResidentMrn = safeLower((a as any).residentMrn);
        const appointmentNotes = safeLower(a.notes);
        const appointmentName = safeLower(a.residentName);
        const selectedResidentId = String(selectedResident.id || "").trim();
        const selectedResidentMrn = safeLower(selectedResident.mrn);
        const selectedFirstName = safeLower(selectedResident.firstName);
        const selectedLastName = safeLower(selectedResident.lastName);

        if (appointmentResidentId && selectedResidentId && appointmentResidentId === selectedResidentId) return true;
        if (appointmentResidentMrn && selectedResidentMrn && appointmentResidentMrn === selectedResidentMrn) return true;
        if (selectedResidentMrn && appointmentNotes.includes(selectedResidentMrn)) return true;
        if (appointmentName === safeLower(selectedResident.name)) return true;
        return Boolean(
          selectedFirstName &&
          selectedLastName &&
          appointmentName.includes(selectedLastName) &&
          appointmentName.includes(selectedFirstName),
        );
      })
    : [];

  const printResidentAppointmentSummary = (
    type: "all" | "history" | "future",
  ) => {
    if (!selectedResident) return;

    const today = getLocalDateKey();
    const escapePrintHtml = (value: unknown) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const source = residentAppointments
      .filter((apt) => {
        if (type === "history") return String(apt.date || "") < today;
        if (type === "future") return String(apt.date || "") >= today;
        return true;
      })
      .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));

    const title =
      type === "history"
        ? "Historical Appointment Summary"
        : type === "future"
          ? "Future Appointment Summary"
          : "All Appointment Summary";

    const scheduled = source.filter((a) => a.status === "Scheduled").length;
    const completed = source.filter((a) => a.status === "Completed").length;
    const cancelled = source.filter((a) =>
      ["Cancelled", "Deferred", "Discontinued"].includes(String(a.status)),
    ).length;
    const historical = source.filter((a) => String(a.date || "") < today).length;
    const future = source.filter((a) => String(a.date || "") >= today).length;

    const rows = source
      .map(
        (apt) => `
          <tr>
            <td>${escapePrintHtml(formatFullDate(apt.date))}</td>
            <td>${escapePrintHtml(formatTimeAMPM(apt.time))}</td>
            <td>${escapePrintHtml(apt.type || "—")}</td>
            <td>${escapePrintHtml(apt.providerName || "—")}</td>
            <td>${escapePrintHtml(apt.location || "—")}</td>
            <td>${escapePrintHtml(apt.status || "Scheduled")}</td>
          </tr>
        `,
      )
      .join("");

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapePrintHtml(title)}</title>
  <style>
    @page { size: letter landscape; margin: 0.35in; }
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111827; margin: 0; background: #ffffff; }
    .header { border-bottom: 3px solid #0b2a6f; padding-bottom: 10px; margin-bottom: 12px; display: flex; justify-content: space-between; gap: 24px; }
    h1 { color: #0b2a6f; font-size: 19px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: .02em; }
    .subtitle { color: #475569; font-size: 11px; font-weight: 800; }
    .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px 16px; font-size: 11px; line-height: 1.35; margin: 12px 0; padding: 10px; background: #f8fbff; border: 1px solid #d6deeb; border-radius: 10px; }
    .meta strong { color: #0b2a6f; }
    h2 { color: #0b2a6f; font-size: 13px; margin: 14px 0 8px; text-transform: uppercase; letter-spacing: .08em; }
    table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 7px; text-align: left; vertical-align: top; }
    th { background: #0b2a6f; color: #ffffff; font-size: 9.5px; text-transform: uppercase; letter-spacing: .04em; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    .summary { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-top: 10px; }
    .summary-card { border: 1px solid #d6deeb; background: #f8fbff; border-radius: 10px; padding: 8px; }
    .summary-card span { display: block; color: #64748b; font-size: 9px; font-weight: 900; text-transform: uppercase; }
    .summary-card strong { color: #0b2a6f; font-size: 18px; }
    .footer { margin-top: 16px; border-top: 1px solid #cbd5e1; padding-top: 6px; text-align: center; font-size: 8px; color: #64748b; font-weight: 800; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Resident Appointment Summary Report</h1>
      <div class="subtitle">${escapePrintHtml(title)}</div>
    </div>
    <div class="subtitle">Generated: ${escapePrintHtml(new Date().toLocaleString())}</div>
  </div>

  <div class="meta">
    <div><strong>Resident:</strong> ${escapePrintHtml(selectedResident.name)}</div>
    <div><strong>MRN:</strong> ${escapePrintHtml(selectedResident.mrn || "—")}</div>
    <div><strong>Room:</strong> ${escapePrintHtml(selectedResident.roomNumber || "—")}</div>
    <div><strong>Unit:</strong> ${escapePrintHtml(selectedResident.unit || selectedResident.floor || "—")}</div>
    <div><strong>Primary Doctor:</strong> ${escapePrintHtml(selectedResident.doctor || "—")}</div>
    <div><strong>Report Type:</strong> ${escapePrintHtml(title)}</div>
  </div>

  <h2>Appointment & Visit History</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Time</th>
        <th>Visit Category</th>
        <th>Provider / Clinic</th>
        <th>Location</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${rows || `<tr><td colspan="6" style="text-align:center; color:#64748b; font-weight:700;">No appointments found.</td></tr>`}
    </tbody>
  </table>

  <h2>Summary</h2>
  <div class="summary">
    <div class="summary-card"><span>Total</span><strong>${source.length}</strong></div>
    <div class="summary-card"><span>Historical</span><strong>${historical}</strong></div>
    <div class="summary-card"><span>Future</span><strong>${future}</strong></div>
    <div class="summary-card"><span>Scheduled</span><strong>${scheduled}</strong></div>
    <div class="summary-card"><span>Completed</span><strong>${completed}</strong></div>
    <div class="summary-card"><span>Cancelled / Deferred</span><strong>${cancelled}</strong></div>
  </div>

  <div class="footer">CONFIDENTIAL MEDICAL RECORD / APPOINTMENT SUMMARY</div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="app-shell min-h-screen flex flex-col lg:flex-row">
      <iframe ref={printIframeRef} style={{ display: "none" }} title="Print iframe" />
      {isMenuOpen && (
        <button
          className="fixed inset-0 bg-slate-950/35 backdrop-blur-sm z-40 lg:hidden"
          aria-label="Close navigation overlay"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <aside
        className={`
        fixed inset-y-0 left-0 z-50 w-72 p-4 transform transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:translate-x-0 lg:h-screen
        ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="h-full transport-card overflow-hidden flex flex-col">
          <div className="transport-gradient text-white p-5 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-12 right-10 h-28 w-28 rounded-full bg-white/10" />
            <div className="relative flex items-center gap-3">
              <div className="w-11 h-11 bg-white/15 border border-white/25 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <Stethoscope size={24} />
              </div>
              <div>
                <h1 className="font-black leading-tight tracking-tight">
                  HealthSync
                </h1>
                <p className="text-[10px] uppercase tracking-[0.22em] font-black opacity-80">
                  Medical Tracker
                </p>
              </div>
            </div>
            <div className="relative mt-4 rounded-2xl bg-white/12 border border-white/20 p-3">
              <p className="text-xs font-black uppercase tracking-wider opacity-90">
                Appointment workspace
              </p>
              <p className="text-xs opacity-80 mt-1 leading-relaxed">
                Navigation, provider directory, and visit history in separated
                pages.
              </p>
            </div>
          </div>

          <nav className="flex-1 px-4 py-5 space-y-2" aria-label="Main pages">
            {currentUser?.role !== "admin" && (
              <NavItem
                active={activeTab === "help"}
                onClick={() => goToTab("help")}
                icon={<ShieldCheck size={20} />}
                label="Guide & Info"
              />
            )}

            <NavItem
              active={activeTab === "dashboard"}
              onClick={() => goToTab("dashboard")}
              icon={<Activity size={20} />}
              label="Dashboard"
            />
            <NavItem
              active={activeTab === "appointments"}
              onClick={() => goToTab("appointments")}
              icon={<Calendar size={20} />}
              label="Appointments"
            />
            <NavItem
              active={activeTab === "trends"}
              onClick={() => goToTab("trends")}
              icon={<BarChart3 size={20} />}
              label="Trends"
            />
            <NavItem
              active={activeTab === "reports"}
              onClick={() => goToTab("reports")}
              icon={<FileText size={20} />}
              label="Reports"
            />
            <NavItem
              active={activeTab === "census"}
              onClick={() => goToTab("census")}
              icon={<Users size={20} />}
              label="Census"
            />
            <NavItem
              active={activeTab === "directory"}
              onClick={() => goToTab("directory")}
              icon={<Phone size={20} />}
              label="Directory"
            />

            {currentUser?.role === "admin" && (
              <NavItem
                active={activeTab === "help"}
                onClick={() => goToTab("help")}
                icon={<ShieldCheck size={20} />}
                label="Help & Info"
              />
            )}
          </nav>

          <div className="p-4 border-t border-[#d6deeb] bg-[rgba(11,42,111,.03)]">
            <div className="rounded-2xl bg-white border border-[#d6deeb] p-4 shadow-[0_4px_12px_rgba(11,42,111,.08)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-brand font-black text-[10px] uppercase tracking-wider">
                  <ShieldCheck size={14} /> session active
                </div>
                <button 
                  onClick={logout}
                  className="text-[10px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest"
                >
                  Logout
                </button>
              </div>
              <p className="text-[11px] font-bold text-slate-700">
                {currentUser?.fullName}
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-tight">
                {currentUser?.role === 'admin' ? 'Administrator' : 'Staff Member'} Mode • {facilities.length} Fac.
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 px-4 py-5 md:px-6 lg:px-8 xl:px-10 page-scrollbar">
        <header className="transport-gradient rounded-2xl p-5 md:p-6 text-white shadow-[0_10px_30px_rgba(11,42,111,.12)] mb-5 relative overflow-hidden">
          <div className="absolute -right-14 -top-16 h-44 w-44 rounded-full bg-white/10" />
          <div className="absolute right-24 -bottom-20 h-48 w-48 rounded-full bg-white/10" />
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <span className="inline-flex items-center rounded-full bg-white/15 border border-white/25 px-3 py-1 text-xs font-black mb-3">
                {TAB_META[activeTab].badge}
              </span>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight">
                {TAB_META[activeTab].title}
              </h2>
              <p className="text-sm opacity-90 mt-1 max-w-3xl leading-relaxed">
                {TAB_META[activeTab].subtitle}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap xl:justify-end">
              <div className="relative group min-w-[200px]">
                <MapPin
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none group-focus-within:text-white transition-colors"
                />
                <select
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-black focus:bg-white/20 focus:outline-none appearance-none transition-all cursor-pointer"
                  value={currentFacilityId || ""}
                  onChange={(e) => {
                    setCurrentFacilityId(e.target.value);
                  }}
                >
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id} className="text-slate-900">
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                className="gap-2 font-black shadow-lg uppercase tracking-wider text-[10px]"
                onClick={handleOpenAdd}
              >
                <Plus size={16} /> New Appointment
              </Button>
              <button
                className="lg:hidden transport-pill h-10 w-10 flex items-center justify-center text-brand"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </header>

        <div className="mb-6 transport-card p-2 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            <TopTab
              active={activeTab === "dashboard"}
              onClick={() => goToTab("dashboard")}
              label="Dashboard"
            />
            <TopTab
              active={activeTab === "appointments"}
              onClick={() => goToTab("appointments")}
              label="Appointments"
            />
            <TopTab
              active={activeTab === "trends"}
              onClick={() => goToTab("trends")}
              label="Specialty Trends"
            />
            <TopTab
              active={activeTab === "reports"}
              onClick={() => goToTab("reports")}
              label="Report Builder"
            />
            <TopTab
              active={activeTab === "census"}
              onClick={() => goToTab("census")}
              label="Patient Census"
            />
            <TopTab
              active={activeTab === "directory"}
              onClick={() => goToTab("directory")}
              label="Directory"
            />
            {currentUser?.role === "admin" && (
              <TopTab
                active={activeTab === "help"}
                onClick={() => goToTab("help")}
                label="Guide & Info"
              />
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <DashboardPage
              appointments={appointments}
              residents={residents}
              completedAppointmentsCount={completedAppointments.length}
              nextAppointmentDateLabel={
                nextAppointment ? formatShortDate(nextAppointment.date) : "—"
              }
              nextAppointmentTimeLabel={
                nextAppointment
                  ? formatTimeAMPM(nextAppointment.time)
                  : "No upcoming visit"
              }
              getDoctorNameDisplay={getDoctorNameDisplay}
              onNavigateAppointments={() => goToTab("appointments")}
              onNavigateCensus={() => goToTab("census")}
              onAppointmentClick={handleOpenEdit}
              StatCard={StatCard}
            />
          )}

          {activeTab === "appointments" && (
            <AppointmentsPage
              appointmentsFilter={appointmentsFilter}
              setAppointmentsFilter={setAppointmentsFilter}
              appointments={appointments}
              filteredTabAppointments={filteredTabAppointments}
              residents={residents}
              currentFacility={currentFacility}
              handleOpenAdd={handleOpenAdd}
              handleOpenEdit={handleOpenEdit}
              handleSaveAllAppointments={handleSaveAllAppointments}
              handleDuplicateAppt={handleDuplicateAppt}
              handleGenerateForm={handleGenerateForm}
              getAppointmentSortTime={getAppointmentSortTime}
              EmptyState={EmptyState}
              WideAppointmentTable={WideAppointmentTable}
            />
          )}

          {activeTab === "reports" && (
            <ReportsPage
              appointments={appointments}
              residents={residents}
              currentFacility={currentFacility}
              reportFilters={reportFilters}
              setReportFilters={setReportFilters}
              setReportPreset={setReportPreset}
              handleOpenEdit={handleOpenEdit}
              handleSaveAllAppointments={handleSaveAllAppointments}
              handleDuplicateAppt={handleDuplicateAppt}
              handleGenerateForm={handleGenerateForm}
              generateFullReport={generateFullReport}
              generateTransportSchedulePDF={generateTransportSchedulePDF}
              FormField={FormField}
              WideAppointmentTable={WideAppointmentTable}
            />
          )}

          {activeTab === "trends" && <TrendsPage appointments={appointments} />}

          {activeTab === "census" && (
            <CensusPage
              residents={residents}
              appointments={appointments}
              censusPasteText={censusPasteText}
              setCensusPasteText={setCensusPasteText}
              parsedResidentsPreview={parsedResidentsPreview}
              setParsedResidentsPreview={setParsedResidentsPreview}
              isParsing={isParsing}
              censusSkipDuplicates={censusSkipDuplicates}
              setCensusSkipDuplicates={setCensusSkipDuplicates}
              censusSearchQuery={censusSearchQuery}
              setCensusSearchQuery={setCensusSearchQuery}
              handleParseCensus={handleParseCensus}
              handleSaveCensus={handleSaveCensus}
              setSelectedResident={setSelectedResident}
              setIsResidentDetailOpen={setIsResidentDetailOpen}
              deleteResident={deleteResident}
            />
          )}

          {activeTab === "directory" && <DirectoryPage />}
          {activeTab === "help" && (
            <HelpPage
              currentUserRole={currentUser?.role}
              facilities={facilities}
              currentFacilityId={currentFacilityId}
              setCurrentFacilityId={setCurrentFacilityId}
              setEditingFac={setEditingFac}
              setIsFacModalOpen={setIsFacModalOpen}
              deleteFacility={deleteFacility}
              users={users}
              setEditingUser={setEditingUser}
              setIsUserModalOpen={setIsUserModalOpen}
              currentUser={currentUser}
            />
          )}

        </AnimatePresence>
      </main>

      <AppointmentModal
        isOpen={isAddModalOpen}
        editingId={editingId}
        newAppt={newAppt}
        setNewAppt={setNewAppt}
        showOtherSpecialtyInput={showOtherSpecialtyInput}
        setShowOtherSpecialtyInput={setShowOtherSpecialtyInput}
        modalStatusPrompt={modalStatusPrompt}
        setModalStatusPrompt={setModalStatusPrompt}
        residentSearchTerm={residentSearchTerm}
        setResidentSearchTerm={setResidentSearchTerm}
        showResidentSuggestions={showResidentSuggestions}
        setShowResidentSuggestions={setShowResidentSuggestions}
        filteredResidents={filteredResidents}
        handleResidentInputChange={handleResidentInputChange}
        handleSelectResident={handleSelectResident}
        handleSaveAppointment={handleSaveAppointment}
        deleteAppointment={deleteAppointment}
        onClose={() => setIsAddModalOpen(false)}
        transportCompanies={transportCompanies}
        FormField={FormField}
      />

      {/* Facility Modals */}
      <AnimatePresence>
        {isFacModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md"
            >
              <Card className="p-6 overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-slate-800">
                    {editingFac ? "Edit Facility" : "Add Facility"}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFacModalOpen(false)}
                  >
                    <X size={20} />
                  </Button>
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const data = {
                      name: formData.get("name") as string,
                      address: formData.get("address") as string,
                      phone: formData.get("phone") as string,
                    };
                    if (editingFac) {
                      await updateFacility(editingFac.id, data);
                    } else {
                      await addFacility(data);
                    }
                    setIsFacModalOpen(false);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-2">
                      Facility Name
                    </label>
                    <input
                      name="name"
                      defaultValue={editingFac?.name}
                      required
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand/20 transition-all text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-2">
                      Address
                    </label>
                    <textarea
                      name="address"
                      defaultValue={editingFac?.address}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand/20 transition-all rows-3 text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-2">
                      Phone
                    </label>
                    <input
                      name="phone"
                      defaultValue={editingFac?.phone}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand/20 transition-all text-sm font-bold"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full py-4 text-sm font-black"
                  >
                    {editingFac ? "Save Changes" : "Create Facility"}
                  </Button>
                </form>
              </Card>
            </motion.div>
          </div>
        )}

        {isUserModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg"
            >
              <Card className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-slate-800">
                    User Configuration
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsUserModalOpen(false)}
                  >
                    <X size={20} />
                  </Button>
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const password = formData.get("password") as string;
                    let uId = editingUser?.id;
                    if (!uId) {
                      uId = await addUser({
                        fullName: formData.get("fullName"),
                        email: formData.get("email"),
                        role: formData.get("role"),
                        password: password || undefined,
                      });
                    } else {
                      await updateUser(uId, {
                        fullName: formData.get("fullName"),
                        email: formData.get("email"),
                        role: formData.get("role"),
                        ...(password ? { password } : {}),
                      });
                    }
                    await updateUserPermissions(uId, userFacPermissions);
                    setIsUserModalOpen(false);
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-2">
                        Full Name
                      </label>
                      <input
                        name="fullName"
                        defaultValue={editingUser?.fullName}
                        required
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none font-bold text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-2">
                        Email
                      </label>
                      <input
                        name="email"
                        type="email"
                        defaultValue={editingUser?.email}
                        required
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none font-bold text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-2">
                        Role
                      </label>
                      <select
                        name="role"
                        defaultValue={editingUser?.role || "staff"}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none font-bold text-sm"
                      >
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-2">
                        {editingUser ? "Reset Password (Optional)" : "Initial Password (Optional)"}
                      </label>
                      <input
                        name="password"
                        type="text"
                        placeholder={editingUser ? "Leave blank to keep current" : "Leave blank for user to setup"}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none font-bold text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-4">
                      Permitted Facilities (Grip Access)
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      {facilities.map((f) => (
                        <label
                          key={f.id}
                          className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-xl transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={userFacPermissions.includes(f.id)}
                            onChange={(e) => {
                              if (e.target.checked)
                                setUserFacPermissions([
                                  ...userFacPermissions,
                                  f.id,
                                ]);
                              else
                                setUserFacPermissions(
                                  userFacPermissions.filter(
                                    (id) => id !== f.id,
                                  ),
                                );
                            }}
                            className="rounded-lg text-brand focus:ring-brand"
                          />
                          <span className="text-sm font-bold text-slate-700">
                            {f.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full py-4 text-sm font-black bg-purple-600 hover:bg-purple-700"
                  >
                    Save User Permissions
                  </Button>
                </form>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface NavItemProps {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}

function NavItem({ active, onClick, icon, label }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group text-left
        ${active ? "bg-gradient-to-br from-brand to-brand-2 text-white shadow-[0_10px_26px_rgba(11,42,111,.18)]" : "text-slate-500 hover:bg-brand-light/70 hover:text-brand"}
      `}
    >
      <span
        className={`${active ? "text-white" : "text-slate-400 group-hover:text-brand"}`}
      >
        {icon}
      </span>
      <span className="font-black text-sm tracking-tight">{label}</span>
      {active && (
        <motion.div
          layoutId="nav-active"
          className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
        />
      )}
    </button>
  );
}

function TopTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-black transition-all ${active ? "bg-gradient-to-br from-brand to-brand-2 text-white shadow-[0_6px_16px_rgba(11,42,111,.16)]" : "text-slate-600 hover:bg-brand-light hover:text-brand"}`}
    >
      {label}
    </button>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
  onClick,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      className={`bg-white p-5 rounded-2xl border border-[#d6deeb] shadow-[0_6px_16px_rgba(11,42,111,.10)] transition-all ${onClick ? "cursor-pointer hover:border-brand/30 hover:shadow-[0_10px_26px_rgba(11,42,111,.15)]" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-slate-500 text-xs font-black uppercase tracking-wider">
            {label}
          </p>
          <p className="text-2xl font-black text-brand leading-tight mt-2">
            {value}
          </p>
          <p className="text-[11px] text-slate-500 font-bold mt-2">{hint}</p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-brand-light flex items-center justify-center text-brand border border-brand/10">
          {icon}
        </div>
      </div>
    </div>
  );
}

function AppointmentItem({
  appointment,
  residents,
  doctorName,
  currentFacility,
  onClick,
}: {
  appointment: Appointment;
  residents: Resident[];
  doctorName: string;
  currentFacility?: Facility;
  key?: string;
  onClick?: () => void;
}) {
  const date = new Date(appointment.date);
  return (
    <div
      onClick={onClick}
      className="flex items-start gap-4 p-4 rounded-2xl border border-[#d6deeb] bg-white hover:border-brand-light/40 hover:bg-white transition-all hover:shadow-[0_10px_26px_rgba(11,42,111,.08)] group cursor-pointer relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            const res = residents.find(
              (r) => r.name === appointment.residentName,
            );
            generateAppointmentPDF(appointment, res, currentFacility);
          }}
          className="p-2 bg-brand-light text-brand rounded-xl hover:bg-brand hover:text-white transition-all shadow-sm"
          title="Download Visit Form"
        >
          <FileDown size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            const res = residents.find(
              (r) => r.name === appointment.residentName,
            );
            generateOutsideAppointmentChecklistPDF(
              appointment,
              res,
              currentFacility,
            );
          }}
          className="p-2 bg-brand-light text-brand rounded-xl hover:bg-brand hover:text-white transition-all shadow-sm ml-1"
          title="Download Checklist"
        >
          <ClipboardCheck size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            const res = residents.find(
              (r) => r.name === appointment.residentName,
            );
            // Defaulting to "Regular Visit" since window.prompt doesn't work well in preview
            generateMedicalClearancePDF(
              appointment,
              "Regular Visit",
              res,
              currentFacility,
            );
          }}
          className="p-2 bg-brand-light text-brand rounded-xl hover:bg-brand hover:text-white transition-all shadow-sm ml-1"
          title="Download Medical Clearance"
        >
          <FileSignature size={14} />
        </button>
      </div>
      <DateBadge date={date} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h4 className="font-black text-slate-900 truncate">
            {appointment.residentName}
          </h4>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {formatTimeAMPM(appointment.time)}
          </span>
        </div>
        <p className="text-sm text-slate-500 truncate mb-1">
          {appointment.type} • {doctorName}
        </p>
        <span className="inline-flex items-center gap-1 text-[10px] font-black text-brand uppercase tracking-wider rounded-full bg-brand-light px-2 py-1">
          <Clock size={10} /> {appointment.transportType}
        </span>
      </div>
      <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight size={20} className="text-brand" />
      </div>
    </div>
  );
}

const InlineInput = ({ value, onChange, placeholder, className = "", type = "text" }: any) => {
  if (type === "textarea") {
    return (
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "—"}
        className={`w-full max-w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20 outline-none px-1 py-0.5 -mx-1 rounded transition-all text-inherit font-inherit resize-y min-h-[32px] ${className}`}
        onClick={(e) => e.stopPropagation()}
        rows={2}
      />
    );
  }
  return (
    <input
      type={type}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || "—"}
      className={`w-full max-w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20 outline-none px-1 py-0.5 -mx-1 rounded transition-all text-inherit font-inherit ${className}`}
      onClick={(e) => e.stopPropagation()}
    />
  );
};

const InlineSelect = ({ value, onChange, options, className = "" }: any) => (
  <select
    value={value || ""}
    onChange={(e) => onChange(e.target.value)}
    className={`w-full max-w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20 outline-none px-1 py-0.5 -mx-1 rounded transition-all text-inherit font-inherit cursor-pointer ${className}`}
    onClick={(e) => e.stopPropagation()}
  >
    {options.map((opt: any) => (
      <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>
    ))}
  </select>
);

function WideAppointmentTable({
  appointments,
  residents,
  currentFacility,
  onEdit,
  selectedColumns,
  onSaveAll,
  onDuplicate,
  onGenerateForm,
}: {
  appointments: Appointment[];
  residents: Resident[];
  currentFacility?: Facility;
  onEdit: (apt: Appointment) => void;
  selectedColumns?: string[];
  onSaveAll?: (updates: Record<string, Partial<Appointment>>) => void;
  onDuplicate?: (apt: Appointment) => void;
  onGenerateForm?: (apt: Appointment, type: string) => void;
}) {
  const showColumn = (col: string) =>
    !selectedColumns || selectedColumns.includes(col);

  const [editedAppointments, setEditedAppointments] = useState<Record<string, Partial<Appointment>>>({});
  const [statusPromptAppt, setStatusPromptAppt] = useState<{ id: string; status: string } | null>(null);
  const [statusReason, setStatusReason] = useState("");

  const handleCopyRecord = (apt: Appointment, e: React.MouseEvent) => {
    e.stopPropagation();
    const copyText = `Specialty: ${apt.type || 'N/A'}
Description: ${apt.description || 'N/A'}
Reason Consultation: ${apt.reasonConsultation || 'N/A'}
Provider: ${apt.providerName || 'N/A'}
Location: ${apt.location || 'N/A'}
Contact: ${apt.contactNumber || 'N/A'}
Date: ${apt.date || 'N/A'}
Time: ${formatTimeAMPM(apt.time)}`;
    navigator.clipboard.writeText(copyText).then(() => {
      // Optional: show a small toast, but we can just let it silently copy or alert.
    });
  };

  const handleEditField = (id: string, field: keyof Appointment, value: any) => {
    setEditedAppointments(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: value
      }
    }));
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    if (["Cancelled", "Rescheduled", "Deferred", "Discontinued"].includes(newStatus)) {
      setStatusPromptAppt({ id, status: newStatus });
      setStatusReason("");
    } else {
      handleEditField(id, 'status', newStatus);
    }
  };

  const confirmStatusChange = () => {
    if (statusPromptAppt) {
       const { id, status } = statusPromptAppt;
       handleEditField(id, 'status', status);
       
       const currentAppt = appointments.find(a => a.id === id);
       const edits = editedAppointments[id] || {};
       const existingNotes = edits.notes !== undefined ? edits.notes : (currentAppt?.notes || "");
       const newNotes = existingNotes ? `${existingNotes}\n[${status} Reason]: ${statusReason}` : `[${status} Reason]: ${statusReason}`;
       
       handleEditField(id, 'notes', newNotes);
       
       setStatusPromptAppt(null);
       setStatusReason("");
    }
  };

  const getVal = (apt: Appointment, field: keyof Appointment) => {
    if (editedAppointments[apt.id] && editedAppointments[apt.id]?.[field] !== undefined) {
      return editedAppointments[apt.id]?.[field];
    }
    return apt[field] as string;
  };

  const handleSaveAllClick = () => {
    if (onSaveAll && Object.keys(editedAppointments).length > 0) {
      onSaveAll(editedAppointments);
      setEditedAppointments({});
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-[#d6deeb] bg-white shadow-sm">
      <table className="w-full text-left border-collapse min-w-[1400px]">
        <thead className="bg-[#0b2a6f] text-white text-[10px] font-black uppercase tracking-wider sticky top-0 z-20">
          <tr>
            <th className="px-3 py-4 border-r border-white/10 text-center w-12">
              Select
            </th>
            {showColumn("Resident Name") && (
              <th className="px-4 py-4 border-r border-white/10">Resident</th>
            )}
            {(showColumn("Weight") || showColumn("Height")) && (
              <th className="px-1 py-4 border-r border-white/10 w-[60px] whitespace-nowrap text-center text-[9px] leading-tight">Wt.<br/>Ht.</th>
            )}
            {(showColumn("Unit") || showColumn("Room #")) && (
              <th className="px-1 py-4 border-r border-white/10 w-[60px] whitespace-nowrap text-center text-[9px] leading-tight">Unit<br/>Room</th>
            )}
            <th className="px-4 py-4 border-r border-white/10 min-w-[300px]">
              Medical Appointment Details
            </th>
            {(showColumn("Date") || showColumn("Time")) && (
              <th className="px-4 py-4 border-r border-white/10 whitespace-nowrap">
                Appt Date & Time
              </th>
            )}
            {showColumn("Transport") && (
              <th className="px-4 py-4 border-r border-white/10 min-w-[200px]">
                Transport Details
              </th>
            )}
            {showColumn("Status") && (
              <th className="px-4 py-4 border-r border-white/10">Status</th>
            )}
            <th className="px-4 py-4 border-r border-white/10">Form</th>
            {showColumn("Payer") && (
              <th className="px-4 py-4 border-r border-white/10">Payer</th>
            )}
            {showColumn("Notes") && <th className="px-4 py-4">Notes</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#d6deeb]">
          {appointments.map((apt) => (
            <tr
              key={apt.id}
              className="group hover:bg-brand-light/20 transition-colors text-[11px] font-medium text-slate-700"
            >
              <td className="px-3 py-4 text-center border-r border-[#d6deeb] cursor-pointer" onClick={() => onEdit(apt)}>
                <div className="w-4 h-4 rounded-full border-2 border-slate-300 mx-auto group-hover:border-brand" title="Open Edit Modal" />
              </td>
              {showColumn("Resident Name") && (
                <td className="px-4 py-3 border-r border-[#d6deeb] align-top">
                  <div className="flex flex-col gap-2">
                    <span 
                      className="font-black uppercase text-slate-900 cursor-pointer" 
                      onClick={() => onEdit(apt)}
                    >
                      {apt.residentName}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {onDuplicate && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onDuplicate(apt); }}
                          className="flex items-center gap-1 px-2 py-1 rounded-md bg-brand/10 hover:bg-brand/20 text-brand transition-colors text-[9px] font-bold uppercase tracking-wider border border-brand/20"
                          title="Duplicate Appointment"
                        >
                          <CopyPlus size={10} /> Duplicate
                        </button>
                      )}
                      <button
                        onClick={(e) => handleCopyRecord(apt, e)}
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors text-[9px] font-bold uppercase tracking-wider border border-slate-200"
                        title="Copy details"
                      >
                        <Copy size={10} /> Copy
                      </button>
                    </div>
                  </div>
                </td>
              )}
              {(showColumn("Weight") || showColumn("Height")) && (
                <td className="px-1 py-3 border-r border-[#d6deeb] align-top w-[60px]">
                  <div className="flex flex-col gap-1.5 w-full items-center">
                    {showColumn("Weight") && (
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[8px] uppercase text-slate-400 font-bold shrink-0">Wt.</span>
                        <InlineInput value={getVal(apt, 'weight')} onChange={(v: string) => handleEditField(apt.id, 'weight', v)} className="w-10 text-center text-[10px] px-1 py-1" />
                      </div>
                    )}
                    {showColumn("Height") && (
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[8px] uppercase text-slate-400 font-bold shrink-0">Ht.</span>
                        <InlineInput value={getVal(apt, 'height')} onChange={(v: string) => handleEditField(apt.id, 'height', v)} className="w-10 text-center text-[10px] px-1 py-1" />
                      </div>
                    )}
                  </div>
                </td>
              )}
              {(showColumn("Unit") || showColumn("Room #")) && (
                <td className="px-1 py-3 border-r border-[#d6deeb] font-bold align-top w-[60px]">
                  <div className="flex flex-col items-center gap-1.5 w-full">
                    {showColumn("Unit") && (
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[8px] uppercase text-slate-400 font-bold shrink-0">Unit</span>
                        <InlineInput value={getVal(apt, 'unit')} onChange={(v: string) => handleEditField(apt.id, 'unit', v)} className="w-10 text-center text-[10px] px-1 py-1" />
                      </div>
                    )} 
                    {showColumn("Room #") && (
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[8px] uppercase text-slate-400 font-bold shrink-0">Room</span>
                        <InlineInput value={getVal(apt, 'roomNumber')} onChange={(v: string) => handleEditField(apt.id, 'roomNumber', v)} className="w-10 text-center text-[10px] px-1 py-1" />
                      </div>
                    )}
                  </div>
                </td>
              )}
              <td className="px-4 py-3 border-r border-[#d6deeb] align-top">
                <div className="flex flex-col gap-2 min-w-[300px]">
                  <div className="grid grid-cols-2 gap-2">
                    {showColumn("Origin") && (
                      <div>
                        <span className="text-[9px] uppercase text-slate-400 font-bold block mb-0.5">Origin</span>
                        <InlineInput value={getVal(apt, 'origin')} onChange={(v: string) => handleEditField(apt.id, 'origin', v)} />
                      </div>
                    )}
                    {showColumn("Specialty") && (
                      <div>
                        <span className="text-[9px] uppercase text-slate-400 font-bold block mb-0.5">Specialty</span>
                        <InlineSelect 
                          value={getVal(apt, 'type')} 
                          onChange={(v: string) => handleEditField(apt.id, 'type', v)} 
                          options={[...MEDICAL_SPECIALTIES, "Other"]}
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-slate-400 font-bold block mb-0.5">Description & Reasons</span>
                    <div className="flex flex-col gap-1">
                      <InlineInput type="textarea" value={getVal(apt, 'description')} onChange={(v: string) => handleEditField(apt.id, 'description', v)} placeholder="Description" />
                      <InlineInput type="textarea" value={getVal(apt, 'consultReason')} onChange={(v: string) => handleEditField(apt.id, 'consultReason', v)} placeholder="Admin Consult Reason" className="text-[10px] text-brand" />
                      <InlineInput type="textarea" value={getVal(apt, 'reasonConsultation')} onChange={(v: string) => handleEditField(apt.id, 'reasonConsultation', v)} placeholder="Consultation reason notes" className="opacity-70 italic text-[10px]" />
                    </div>
                  </div>
                  {showColumn("Provider") && (
                    <div className="mt-2">
                      <span className="flex items-center gap-1 text-[9px] uppercase text-brand font-bold mb-1.5"><MapPin size={10} /> Location Details</span>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col">
                          <span className="text-[8px] uppercase text-slate-500 font-bold mb-0.5">Staff/Doctor Name</span>
                          <InlineInput value={getVal(apt, 'providerName')} onChange={(v: string) => handleEditField(apt.id, 'providerName', v)} placeholder="e.g., Dr. So" className="font-medium text-slate-800" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] uppercase text-slate-500 font-bold mb-0.5">Location Name / Address</span>
                          <InlineInput value={getVal(apt, 'location')} onChange={(v: string) => handleEditField(apt.id, 'location', v)} placeholder="e.g., MSSN/2nd floor" className="text-slate-800" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] uppercase text-slate-500 font-bold mb-0.5">Contact Number</span>
                          <InlineInput value={getVal(apt, 'contactNumber')} onChange={(v: string) => handleEditField(apt.id, 'contactNumber', v)} placeholder="Contact" className="text-slate-800" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </td>
              {(showColumn("Date") || showColumn("Time")) && (
                <td className="px-4 py-3 border-r border-[#d6deeb]">
                  <div className="flex flex-col gap-1.5 min-w-[140px]">
                    {showColumn("Date") && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] uppercase text-slate-400 font-bold shrink-0 w-16">Appt Date</span>
                        <InlineInput type="date" value={getVal(apt, 'date')} onChange={(v: string) => handleEditField(apt.id, 'date', v)} className="flex-1 w-full" />
                      </div>
                    )}
                    {showColumn("Time") && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] uppercase text-slate-400 font-bold shrink-0 w-16">Appt Time</span>
                        <InlineInput type="time" value={getVal(apt, 'time')} onChange={(v: string) => handleEditField(apt.id, 'time', v)} className="flex-1 w-full" />
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] uppercase text-slate-400 font-bold shrink-0 w-16">Pick Up</span>
                      <InlineInput type="time" value={getVal(apt, 'pickUpTime')} onChange={(v: string) => handleEditField(apt.id, 'pickUpTime', v)} className="flex-1 w-full" />
                    </div>
                  </div>
                </td>
              )}
              {showColumn("Transport") && (
                <td className="px-4 py-3 border-r border-[#d6deeb] align-top">
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    <div className="flex items-center justify-between gap-2">
                       <span className="text-[10px] uppercase text-slate-400 font-bold shrink-0 w-12">Type</span>
                       <div className="flex-1">
                         <InlineSelect 
                          value={getVal(apt, 'transportType')} 
                          onChange={(v: string) => handleEditField(apt.id, 'transportType', v)} 
                          options={["", "Facility Van", "Ambulance", "Lyft/Uber", "Ambulette", "Private Care", "Others"]}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                       <span className="text-[10px] uppercase text-slate-400 font-bold shrink-0 w-12">R/T</span>
                       <div className="flex-1">
                         <InlineSelect 
                            value={getVal(apt, 'roundTrip')} 
                            onChange={(v: string) => handleEditField(apt.id, 'roundTrip', v)} 
                            options={["", "Yes", "No"]}
                          />
                        </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                       <span className="text-[10px] uppercase text-slate-400 font-bold shrink-0 w-12">Escort</span>
                       <div className="flex-1">
                         <InlineSelect 
                            value={getVal(apt, 'escort')} 
                            onChange={(v: string) => handleEditField(apt.id, 'escort', v)} 
                            options={["", "Yes", "No"]}
                          />
                        </div>
                    </div>
                  </div>
                </td>
              )}
              {showColumn("Status") && (
                <td className="px-4 py-3 border-r border-[#d6deeb]">
                  <InlineSelect 
                    value={getVal(apt, 'status')} 
                    onChange={(v: string) => handleStatusChange(apt.id, v)} 
                    options={["Scheduled", "Completed", "Cancelled", "Discontinued", "Deferred"]}
                  />
                </td>
              )}
                    <td className="px-4 py-3 border-r border-[#d6deeb] align-top">
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); onGenerateForm && onGenerateForm(apt, 'Visit Form'); }}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-brand-light hover:bg-brand/20 text-brand transition-colors text-[10px] font-bold uppercase tracking-wider"
                    title="Generate Visit Form"
                  >
                    <FileText size={12} /> Visit Form
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onGenerateForm && onGenerateForm(apt, 'Checklist'); }}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-brand-light hover:bg-brand/20 text-brand transition-colors text-[10px] font-bold uppercase tracking-wider"
                    title="Generate Checklist"
                  >
                    <ClipboardCheck size={12} /> Checklist
                  </button>
<button
  onClick={(e) => {
    e.stopPropagation();
    onGenerateForm && onGenerateForm(apt, "Medical Clearance");
  }}
  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-brand-light hover:bg-brand/20 text-brand transition-colors text-[10px] font-bold uppercase tracking-wider"
  title="Generate Medical Clearance"
>
  <ShieldCheck size={12} /> Medical Clearance
</button>

<button
  onClick={(e) => {
    e.stopPropagation();
    onGenerateForm && onGenerateForm(apt, "Consult");
  }}
  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-brand-light hover:bg-brand/20 text-brand transition-colors text-[10px] font-bold uppercase tracking-wider"
  title={`Generate ${getConsultFormLabel(apt)}`}
>
  <FileText size={12} /> {getConsultFormLabel(apt)}
</button>
                </div>
              </td>
              {showColumn("Payer") && (
                <td className="px-4 py-3 border-r border-[#d6deeb]">
                  <InlineSelect 
                    value={getVal(apt, 'payerForRide')} 
                    onChange={(v: string) => handleEditField(apt.id, 'payerForRide', v)} 
                    options={["", "Medicaid", "Medicare", "Facility", "Resident", "Others"]}
                  />
                </td>
              )}
              {showColumn("Notes") && (
                <td className="px-4 py-3 align-top min-w-[200px]">
                  <InlineInput type="textarea" value={getVal(apt, 'notes')} onChange={(v: string) => handleEditField(apt.id, 'notes', v)} className="w-[180px] h-full min-h-[80px]" />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {onSaveAll && Object.keys(editedAppointments).length > 0 && (
        <div className="sticky bottom-0 left-0 right-0 p-4 bg-slate-50 border-t border-[#d6deeb] flex justify-end">
          <Button onClick={handleSaveAllClick}>
            Save All Changes ({Object.keys(editedAppointments).length})
          </Button>
        </div>
      )}
      
      <AnimatePresence>
        {statusPromptAppt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-lg">Update Status</h3>
              </div>
              <div className="p-6">
                <p className="text-sm font-medium text-slate-600 mb-3 block">Reason for changing status to <span className="font-bold text-brand">{statusPromptAppt.status}</span>:</p>
                <textarea
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all resize-none mb-4"
                  rows={3}
                  placeholder="Enter reason..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                />
                <div className="flex items-center gap-3 justify-end">
                  <button 
                    onClick={() => {
                        setStatusPromptAppt(null);
                        setStatusReason("");
                    }} 
                    className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <Button onClick={confirmStatusChange}>
                    Confirm Status Change
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AppointmenttLogRow({
  appointment,
  doctorName,
  compact = false,
  onClick,
}: {
  appointment: Appointment;
  doctorName: string;
  compact?: boolean;
  key?: string;
  onClick?: () => void;
}) {
  const date = new Date(appointment.date);
  const statusClass =
    appointment.status === "Scheduled"
      ? "bg-blue-50 text-blue-700 border-blue-100"
      : appointment.status === "Completed"
        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
        : appointment.status === "Cancelled"
          ? "bg-red-50 text-red-700 border-red-100"
          : "bg-amber-50 text-amber-700 border-amber-100";

  return (
    <div
      onClick={onClick}
      className={`flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-2xl border border-[#d6deeb] bg-white hover:border-brand/30 hover:bg-brand-light/10 transition-all gap-4 group cursor-pointer ${compact ? "" : "hover:shadow-[0_10px_26px_rgba(11,42,111,.10)]"}`}
    >
      <div className="flex items-center gap-4 min-w-0">
        <DateBadge date={date} small />
        <div className="min-w-0">
          <h4 className="font-black text-slate-900 truncate">
            {appointment.residentName}
          </h4>
          <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
            <span className="font-bold text-brand uppercase tracking-tighter text-[10px]">
              {appointment.type}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Clock size={12} /> {formatTimeAMPM(appointment.time)}
            </span>
            <span>•</span>
            <span>{doctorName}</span>
          </p>
          {(appointment.description ||
            appointment.consultReason ||
            appointment.reasonConsultation ||
            appointment.notes) && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2 italic opacity-80">
              {appointment.description && `${appointment.description}`}
              {appointment.consultReason && ` - ${appointment.consultReason}`}
              {appointment.reasonConsultation &&
                ` - ${appointment.reasonConsultation}`}
              {(appointment.description || appointment.consultReason || appointment.reasonConsultation) &&
              appointment.notes
                ? ": "
                : ""}
              {appointment.notes}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 md:self-center">
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusClass}`}
        >
          {appointment.status}
        </span>
        <button
          className="p-2 hover:bg-brand-light rounded-full text-slate-400 hover:text-brand"
          aria-label="Open appointment"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

function DateBadge({ date, small = false }: { date: Date; small?: boolean }) {
  const isValid = !isNaN(date.getTime());
  return (
    <div
      className={`${small ? "w-12 h-12" : "w-14 h-14"} bg-white rounded-2xl flex flex-col items-center justify-center border border-[#d6deeb] shadow-[0_4px_12px_rgba(11,42,111,.08)] flex-shrink-0`}
    >
      <span className="text-[10px] uppercase font-black text-brand leading-none mb-1">
        {isValid ? date.toLocaleString("default", { month: "short" }) : "—"}
      </span>
      <span
        className={`${small ? "text-lg" : "text-xl"} font-black leading-none text-slate-900`}
      >
        {isValid ? date.getDate() : "—"}
      </span>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="py-12 px-4 flex flex-col items-center justify-center text-center text-slate-400 bg-[rgba(11,42,111,.03)] rounded-2xl border-2 border-dashed border-[#d6deeb]">
      <div className="mb-4 opacity-40 text-brand">{icon}</div>
      <p className="font-black text-slate-700">{title}</p>
      <p className="text-sm text-slate-500 mt-1 max-w-md">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function FormField({
  label,
  info,
  children,
}: {
  label: string;
  info?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 px-1">
        <label className="block text-sm font-extrabold text-[#0b2a6f]">
          {label}
        </label>
        {info && (
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
            {info}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function formatFullDate(iso: string) {
  if (!iso) return "—";
  const d = parseDateKeyAsLocalDate(iso);
  if (!d || Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-[#d6deeb] p-3 rounded-xl shadow-sm">
      <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">
        {label}
      </p>
      <p className="text-sm font-black text-slate-800">{value}</p>
    </div>
  );
}

export function formatTimeAMPM(timeStr?: string) {
  if (!timeStr) return "N/A";
  const [hours, minutes] = timeStr.split(':');
  if (!hours || !minutes) return timeStr;
  const hp = parseInt(hours, 10);
  if (isNaN(hp)) return timeStr;
  const ampm = hp >= 12 ? 'PM' : 'AM';
  const h12 = hp % 12 || 12;
  const paddedH12 = h12.toString().padStart(2, '0');
  return `${paddedH12}:${minutes} ${ampm}`;
}

function formatShortDate(iso: string) {
  if (!iso) return "—";
  const d = parseDateKeyAsLocalDate(iso);
  if (!d || Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
