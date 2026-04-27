<<<<<<< HEAD
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
  Plus,
  Clock,
  MapPin,
  ChevronRight,
  Bell,
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
  FileDown,
  Printer,
  ClipboardPaste,
  Trash2,
  Filter,
  CheckSquare,
  Square,
  Save,
  Download,
  FileSpreadsheet,
  Home,
  Copy,
  CopyPlus,
} from "lucide-react";
import { useHealthData } from "./hooks/useHealthData";
import { Card } from "./components/Card";
import { Button } from "./components/Button";
import { LockScreen } from "./components/LockScreen";
import { AppointmentCalendar } from "./components/AppointmentCalendar";
import { TrendsTabContent } from "./components/TrendsTabContent";
import { PatientCensusUnitList } from "./components/PatientCensusUnitList";
import { VersionHistoryPanel } from "./components/VersionHistoryPanel";
import { TransportUtilizationPanel } from "./components/TransportUtilizationPanel";
import { AdminGuideTools } from "./components/AdminGuideTools";
import { Appointment, Resident, Facility, TransportationCompany } from "./types";
import { CONSULT_REASONS_BY_SPECIALTY } from "./constants/consultReasons";
import { MEDICAL_SPECIALTIES } from "./constants/medicalSpecialties";
import { TransportationDirectory } from "./components/TransportationDirectory";
import {
  getConsultFormLabel,
  openConsultForm,
} from "./services/consultForms";

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

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showOtherSpecialtyInput, setShowOtherSpecialtyInput] = useState(false);
  const [modalStatusPrompt, setModalStatusPrompt] = useState<{status: string, reason: string} | null>(null);

  const [newAppt, setNewAppt] = useState<Partial<Appointment>>({
    status: "Scheduled",
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

    fetch(`/api/transportation-companies?facilityId=${encodeURIComponent(currentFacilityId)}`)
      .then((res) => (res.ok ? res.json() : []))
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
    month: new Date().toISOString().slice(0, 7),
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
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
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
    const isOther = apt.type !== "" && !MEDICAL_SPECIALTIES.includes(apt.type);
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
    setNewAppt({ ...newAppt, residentName: val });
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

  const upcomingAppointments = appointments
    .filter((a) => a.status === "Scheduled")
    .sort(
      (a, b) =>
        new Date(`${a.date}T${a.time}`).getTime() -
        new Date(`${b.date}T${b.time}`).getTime(),
    );

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
    ? appointments.filter(
        (a) =>
          a.residentName === selectedResident.name ||
          (a.residentName
            .toLowerCase()
            .includes(selectedResident.lastName.toLowerCase()) &&
            a.residentName
              .toLowerCase()
              .includes(selectedResident.firstName.toLowerCase())),
      )
    : [];

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
                key="nav-help-staff-0"
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
            <motion.section
              key="dashboard"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.18 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                  label="Appointments"
                  value={appointments.length.toString()}
                  hint="Total saved visits"
                  icon={<Calendar />}
                  onClick={() => goToTab("appointments")}
                />
                <StatCard
                  label="Patient Census"
                  value={residents.length.toString()}
                  hint="Active Registry"
                  icon={<Users />}
                  onClick={() => goToTab("census")}
                />
                <StatCard
                  label="Completed"
                  value={completedAppointments.length.toString()}
                  hint="Closed visit records"
                  icon={<ShieldCheck />}
                  onClick={() => goToTab("appointments")}
                />
                <StatCard
                  label="Next Visit"
                  value={
                    nextAppointment
                      ? formatShortDate(nextAppointment.date)
                      : "—"
                  }
                  hint={
                    nextAppointment ? formatTimeAMPM(nextAppointment.time) : "No upcoming visit"
                  }
                  icon={<Activity />}
                  onClick={() => goToTab("appointments")}
                />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 min-h-[500px]">
                  <AppointmentCalendar 
                    appointments={appointments}
                    residents={residents}
                    getDoctorNameDisplay={getDoctorNameDisplay}
                    onAppointmentClick={handleOpenEdit}
                  />
                </div>

                <div className="space-y-6">
                  <Card title="Quick Actions" subtitle="Common tracker tasks">
                    <div className="grid gap-3">
                      <Button
                        className="w-full justify-start gap-3"
                        onClick={handleOpenAdd}
                      >
                        <Plus size={18} /> Add Appointment
                      </Button>
                      <Button
                        variant="secondary"
                        className="w-full justify-start gap-3"
                        onClick={() => goToTab("census")}
                      >
                        <Users size={18} /> Manage Census
                      </Button>
                      <Button
                        variant="secondary"
                        className="w-full justify-start gap-3"
                        onClick={() => goToTab("reports")}
                      >
                        <FileText size={18} /> Build Reports
                      </Button>
                    </div>
                  </Card>

                  <div className="transport-gradient rounded-2xl p-6 text-white shadow-[0_10px_30px_rgba(11,42,111,.12)]">
                    <h4 className="font-black text-lg mb-2 flex items-center gap-2">
                      <Bell size={20} /> Daily Health Tip
                    </h4>
                    <p className="text-sm opacity-90 leading-relaxed">
                      Keep appointment details updated with provider, date,
                      time, location, and follow-up notes so records stay
                      survey-ready and easy to review.
                    </p>
                    <button className="mt-4 text-xs font-black bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors">
                      View All Tips
                    </button>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {activeTab === "appointments" && (
            <motion.section
              key="appointments"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.18 }}
              className="space-y-5"
            >
              <Card
                title="Consolidated Appointment Log"
                subtitle="High-definition tabular view of all medical visits and logistics."
                actions={
                  <Button size="sm" onClick={handleOpenAdd}>
                    <Plus size={15} /> Add Record
                  </Button>
                }
                className="overflow-hidden"
              >
                <div className="flex flex-wrap items-center gap-4 px-4 py-3 bg-slate-50 border-y border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Date Range</span>
                    <select 
                      className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand/20 transition-all cursor-pointer shadow-sm text-slate-700"
                      value={appointmentsFilter.dateRange}
                      onChange={e => setAppointmentsFilter({...appointmentsFilter, dateRange: e.target.value})}
                    >
                      <option value="next7days">Today + Next 7 Days</option>
                      <option value="month">Specific Month</option>
                      <option value="all">All Dates</option>
                    </select>
                    
                    {appointmentsFilter.dateRange === "month" && (
                      <input 
                        type="month"
                        className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-brand/20 transition-all shadow-sm text-slate-700 h-[34px]"
                        value={appointmentsFilter.month}
                        onChange={e => setAppointmentsFilter({...appointmentsFilter, month: e.target.value})}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase ml-2">Status</span>
                    <select 
                      className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand/20 transition-all cursor-pointer shadow-sm text-slate-700"
                      value={appointmentsFilter.status}
                      onChange={e => setAppointmentsFilter({...appointmentsFilter, status: e.target.value})}
                    >
                      <option value="All">All Statuses</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Discontinued">Discontinued</option>
                      <option value="Deferred">Deferred</option>
                    </select>
                  </div>
                </div>
                <div className="mt-2">
                  {filteredTabAppointments.length > 0 ? (
                    <WideAppointmentTable
                      appointments={filteredTabAppointments.sort(
                        (a, b) =>
                          new Date(`${a.date}T${a.time}`).getTime() -
                          new Date(`${b.date}T${b.time}`).getTime(),
                      )}
                      residents={residents}
                      currentFacility={currentFacility}
                      onEdit={handleOpenEdit}
                      onSaveAll={handleSaveAllAppointments}
                      onDuplicate={handleDuplicateAppt}
                      onGenerateForm={handleGenerateForm}
                    />
                  ) : (
                    <EmptyState
                      icon={<Database size={44} />}
                      title="No entries found"
                      text="No appointments match the current filters."
                    />
                  )}
                </div>
              </Card>
            </motion.section>
          )}

          {activeTab === "reports" && (
            <motion.section
              key="reports"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.18 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-4 space-y-6">
                  <Card
                    title="Report Configuration"
                    subtitle="Define boundaries for data extraction."
                  >
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="block text-xs font-black uppercase text-slate-500">
                          Quick Presets
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setReportPreset("today")}
                            className="px-3 py-1.5 rounded-lg border border-[#d6deeb] text-xs font-bold hover:bg-brand-light transition-colors"
                          >
                            Today
                          </button>
                          <button
                            onClick={() => setReportPreset("week")}
                            className="px-3 py-1.5 rounded-lg border border-[#d6deeb] text-xs font-bold hover:bg-brand-light transition-colors"
                          >
                            Last 7 Days
                          </button>
                          <button
                            onClick={() => setReportPreset("month")}
                            className="px-3 py-1.5 rounded-lg border border-[#d6deeb] text-xs font-bold hover:bg-brand-light transition-colors"
                          >
                            Last Month
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField label="From Date">
                          <input
                            type="date"
                            value={reportFilters.startDate}
                            onChange={(e) =>
                              setReportFilters({
                                ...reportFilters,
                                startDate: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 rounded-xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 outline-none bg-white text-sm"
                          />
                        </FormField>
                        <FormField label="To Date">
                          <input
                            type="date"
                            value={reportFilters.endDate}
                            onChange={(e) =>
                              setReportFilters({
                                ...reportFilters,
                                endDate: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 rounded-xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 outline-none bg-white text-sm"
                          />
                        </FormField>
                      </div>

                      <FormField label="Export Format">
                        <div className="grid grid-cols-1 gap-2">
                          {[
                            "PDF Document (.pdf)",
                            "Excel Worksheet (.xlsx)",
                            "CSV Data (.csv)",
                          ].map((fmt) => (
                            <button
                              key={fmt}
                              onClick={() =>
                                setReportFilters({
                                  ...reportFilters,
                                  exportType: fmt,
                                })
                              }
                              className={`flex items-center justify-between p-3 rounded-xl border text-sm font-bold transition-all ${
                                reportFilters.exportType === fmt
                                  ? "border-brand bg-brand-light text-brand shadow-sm"
                                  : "border-[#d6deeb] bg-white text-slate-600 hover:border-brand/30"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {fmt.includes(".pdf") ? (
                                  <FileText size={16} />
                                ) : fmt.includes(".xlsx") ? (
                                  <FileSpreadsheet size={16} />
                                ) : (
                                  <Database size={16} />
                                )}
                                {fmt}
                              </div>
                              {reportFilters.exportType === fmt && (
                                <CheckSquare size={14} />
                              )}
                            </button>
                          ))}
                        </div>
                      </FormField>

                      <div className="pt-4 flex gap-3">
                        <Button
                          className="flex-1 gap-2 shadow-lg hover:shadow-brand/20"
                          onClick={() => {
                            const filtered = appointments.filter((apt) => {
                              const date = new Date(apt.date);
                              const start = reportFilters.startDate
                                ? new Date(reportFilters.startDate)
                                : null;
                              const end = reportFilters.endDate
                                ? new Date(reportFilters.endDate)
                                : null;
                              if (start && date < start) return false;
                              if (end && date > end) return false;
                              return true;
                            });
                            generateFullReport(
                              filtered,
                              reportFilters.columns,
                              undefined,
                              currentFacility,
                            );
                          }}
                        >
                          <FileDown size={18} /> Generate
                        </Button>
                        <Button variant="secondary" className="px-4">
                          <Printer size={18} />
                        </Button>
                      </div>

                      <div className="pt-4 border-t border-[#d6deeb]">
                        <label className="block text-xs font-black uppercase text-slate-500 mb-3">
                          Specialized Templates
                        </label>
                        <Button
                          variant="secondary"
                          className="w-full gap-3 justify-center border-brand/20 hover:bg-brand-light"
                          onClick={() => {
                            const filtered = appointments.filter((apt) => {
                              const date = new Date(apt.date);
                              const start = reportFilters.startDate
                                ? new Date(reportFilters.startDate)
                                : null;
                              const end = reportFilters.endDate
                                ? new Date(reportFilters.endDate)
                                : null;
                              if (start && date < start) return false;
                              if (end && date > end) return false;
                              return true;
                            });
                            generateTransportSchedulePDF(
                              filtered,
                              reportFilters.startDate || "all",
                              reportFilters.endDate || "all",
                              currentFacility,
                            );
                          }}
                        >
                          <Calendar size={18} /> Export Transport Calendar
                        </Button>
                        <p className="text-[10px] text-slate-400 mt-2 text-center italic">
                          Matches the facility transport schedule grid format.
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="xl:col-span-8 space-y-6">
                  <Card
                    title="Column Selection"
                    subtitle="Choose which data tags to include in your output."
                  >
                    <div className="space-y-3">
                      <label htmlFor="report-columns" className="block text-sm font-medium text-slate-700">Select Columns (Hold Ctrl/Cmd to select multiple)</label>
                      <select
                        id="report-columns"
                        multiple
                        value={reportFilters.columns}
                        onChange={(e) => {
                          const options = (Array.from(e.target.selectedOptions) as HTMLOptionElement[]).map((option) => option.value);
                          setReportFilters(prev => ({ ...prev, columns: options }));
                        }}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none font-bold text-sm min-h-[200px]"
                      >
                        {[
                          "Resident Name",
                          "Date",
                          "Time",
                          "Provider",
                          "Specialty",
                          "Transport",
                          "Status",
                          "Origin",
                          "Room #",
                          "Unit",
                          "Notes",
                          "Payer",
                          "Weight",
                          "Height",
                        ].map((col) => (
                          <option key={col} value={col} className="p-2">
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>
                  </Card>

                  <Card
                    title="Live Preview (Draft)"
                    subtitle="Real-time look at filtered records."
                    className="overflow-hidden"
                  >
                    <div className="mt-2">
                      {appointments.length > 0 ? (
                        <WideAppointmentTable
                          appointments={appointments
                            .filter((apt) => {
                              const date = new Date(apt.date);
                              const start = reportFilters.startDate
                                ? new Date(reportFilters.startDate)
                                : null;
                              const end = reportFilters.endDate
                                ? new Date(reportFilters.endDate)
                                : null;
                              if (start && date < start) return false;
                              if (end && date > end) return false;
                              return true;
                            })
                            .slice(0, 10)}
                          residents={residents}
                          currentFacility={currentFacility}
                          selectedColumns={reportFilters.columns}
                          onEdit={handleOpenEdit}
                          onSaveAll={handleSaveAllAppointments}
                          onDuplicate={handleDuplicateAppt}
                          onGenerateForm={handleGenerateForm}
                        />
                      ) : (
                        <div className="py-20 text-center opacity-40 italic text-sm">
                          No data matching current filters
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            </motion.section>
          )}

          {activeTab === "trends" && (
  <motion.section
    key="trends"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -12 }}
    transition={{ duration: 0.18 }}
    className="space-y-6"
  >
    <TrendsTabContent appointments={appointments} />

    <TransportUtilizationPanel appointments={appointments} />
  </motion.section>
)}

          {activeTab === "census" && (
            <motion.section
              key="census"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.18 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-5 space-y-6">
                  <Card
                    title="Bulk Import / Paste"
                    subtitle="Copy from Excel or text and paste here for easy upload."
                  >
                    <div className="space-y-4">
                      <div className="bg-[#fcfdfe] border border-[#d6deeb] rounded-2xl p-4">
                        <label className="block text-[10px] font-black uppercase text-brand tracking-widest mb-3 italic">
                          Preferred Format: Resident Listing Report
                        </label>
                        <p className="text-xs text-slate-500 leading-relaxed mb-4">
                          Select and copy the resident rows from your report and
                          paste them here. <br />
                          The parser automatically extracts{" "}
                          <span className="font-bold text-slate-700">
                            Names, MRNs, Age, Locations, Physicians,
                          </span>{" "}
                          and{" "}
                          <span className="font-bold text-slate-700">
                            Diagnosis
                          </span>
                          .
                        </p>
                        <textarea
                          className="w-full h-48 px-4 py-3 bg-white rounded-xl border border-[#d6deeb] shadow-inner focus:ring-2 focus:ring-brand-2/20 outline-none text-sm font-medium resize-none"
                          placeholder="Paste Resident Listing Report data here..."
                          value={censusPasteText}
                          onChange={(e) => setCensusPasteText(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-3 px-1">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${censusSkipDuplicates ? "bg-brand border-brand" : "bg-white border-slate-300 group-hover:border-brand"}`}
                          >
                            {censusSkipDuplicates && (
                              <CheckSquare size={14} className="text-white" />
                            )}
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={censusSkipDuplicates}
                              onChange={() =>
                                setCensusSkipDuplicates(!censusSkipDuplicates)
                              }
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-600">
                            Skip Existing Residents
                          </span>
                        </label>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          className="flex-1 gap-2"
                          onClick={handleParseCensus}
                          disabled={isParsing}
                        >
                          {isParsing ? (
                            <div className="loading-spinner w-4 h-4 border-2 border-white/30 border-t-white" />
                          ) : (
                            <ClipboardPaste size={18} />
                          )}
                          Parse & Preview
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setCensusPasteText("");
                            setParsedResidentsPreview([]);
                          }}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {parsedResidentsPreview.length > 0 && (
                    <Card
                      title="Preview Upload"
                      subtitle="Review parsed data before final submission."
                      className="border-brand-2 ring-2 ring-brand-2/10"
                    >
                      <div className="max-h-[400px] overflow-y-auto page-scrollbar rounded-xl border border-[#d6deeb] mb-4 shadow-inner">
                        <table className="w-full text-left">
                          <thead className="bg-[#f8fbff] text-[10px] font-black uppercase text-[#0b2a6f] sticky top-0 z-10">
                            <tr>
                              <th className="px-4 py-3 border-b border-[#d6deeb]">
                                Resident Name
                              </th>
                              <th className="px-4 py-3 border-b border-[#d6deeb]">
                                MRN
                              </th>
                              <th className="px-4 py-3 border-b border-[#d6deeb]">
                                Age
                              </th>
                              <th className="px-4 py-3 border-b border-[#d6deeb]">
                                Unit / Room
                              </th>
                              <th className="px-4 py-3 border-b border-[#d6deeb]">
                                Physician
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#d6deeb] text-xs">
                            {parsedResidentsPreview.map((r, i) => (
                              <tr
                                key={i}
                                className="bg-white hover:bg-brand-light/20 transition-colors"
                              >
                                <td className="px-4 py-3">
                                  <p className="font-extrabold text-slate-900">
                                    {r.name}
                                  </p>
                                  <p className="text-[10px] opacity-60 uppercase">
                                    {r.sex}
                                  </p>
                                </td>
                                <td className="px-4 py-3 text-slate-500 font-mono">
                                  {r.mrn}
                                </td>
                                <td className="px-4 py-3 font-bold">{r.age}</td>
                                <td className="px-4 py-3">
                                  <p className="font-medium text-slate-600">
                                    {r.floor !== "—" ? `${r.floor} • ` : ""}{r.unit}
                                  </p>
                                  <p className="text-[10px] font-black bg-slate-100 inline-block px-1 rounded">
                                    {r.roomNumber}
                                  </p>
                                </td>
                                <td className="px-4 py-3 text-slate-500 italic">
                                  {r.doctor}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-brand-light/30 rounded-xl mb-4 text-xs font-bold text-brand">
                        <span>
                          {parsedResidentsPreview.length} records ready for
                          import
                        </span>
                        <CheckSquare size={16} />
                      </div>
                      <Button
                        className="w-full gap-2"
                        onClick={handleSaveCensus}
                      >
                        <Save size={18} /> Confirm & Save to Registry
                      </Button>
                    </Card>
                  )}
                </div>

                <div className="xl:col-span-7">
                  <PatientCensusUnitList
                residents={residents}
                searchQuery={censusSearchQuery}
                onSearchChange={setCensusSearchQuery}
                onViewDetails={(resident) => {
                  setSelectedResident(resident);
                  setIsResidentDetailOpen(true);
                }}
                onDeleteResident={deleteResident}
              />
                </div>
              </div>
            </motion.section>
          )}

{activeTab === "directory" && (
  <motion.section
    key="directory"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -12 }}
    transition={{ duration: 0.18 }}
    className="space-y-6"
  >
    <TransportationDirectory />
  </motion.section>
)}
                    {activeTab === "help" && (
            <motion.div
              key="help"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
              className="space-y-6"
            >
              <VersionHistoryPanel currentUserRole={currentUser?.role} />
              <AdminGuideTools
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
              />
</motion.div>
          )}

</AnimatePresence>
      </main>

      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 18 }}
              className="relative w-full max-w-4xl bg-[#f8fbff] rounded-3xl shadow-2xl overflow-hidden border border-[#d6deeb] max-h-[90vh] flex flex-col"
            >
              <div className="transport-gradient text-white p-5 shrink-0 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black tracking-tight">
                    {editingId ? "Modify Record" : "New Appointment Request"}
                  </h3>
                  <p className="text-xs opacity-85 mt-0.5">
                    Comprehensive entry for clinical and transport tracking.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 hover:bg-white/15 rounded-full"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto page-scrollbar space-y-8 flex-1">
                {/* Origins Section */}
                <section>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label="Origin of Appointment"
                      info="e.g., MD Order / Family / Hospital / Specialist"
                    >
                      <input
                        type="text"
                        value={newAppt.origin}
                        onChange={(e) =>
                          setNewAppt({ ...newAppt, origin: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
                        placeholder="e.g., MD Order"
                      />
                    </FormField>
                    <FormField label="Resident Name *" info="Last, First">
                      <div className="relative">
                        <input
                          type="text"
                          value={newAppt.residentName}
                          onChange={(e) =>
                            handleResidentInputChange(e.target.value)
                          }
                          onFocus={() => setShowResidentSuggestions(true)}
                          onBlur={() =>
                            setTimeout(
                              () => setShowResidentSuggestions(false),
                              200,
                            )
                          }
                          className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
                          placeholder="Search census..."
                        />
                        {showResidentSuggestions &&
                          (residentSearchTerm || newAppt.residentName) &&
                          filteredResidents.length > 0 && (
                            <div className="absolute z-60 w-full mt-2 bg-white border border-[#d6deeb] rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                              {filteredResidents.map((r) => (
                                <button
                                  key={r.id}
                                  type="button"
                                  className="w-full px-4 py-3 text-left hover:bg-brand-light/30 border-b border-[#f0f4f8] last:border-0 transition-colors"
                                  onClick={() => {
                                    handleSelectResident(r);
                                    setResidentSearchTerm("");
                                    setShowResidentSuggestions(false);
                                  }}
                                >
                                  <p className="font-black text-slate-800 text-sm">
                                    {r.name}
                                  </p>
                                  <p className="text-[10px] text-slate-500">
                                    MRN: {r.mrn} • {r.unit} • {r.roomNumber}
                                  </p>
                                </button>
                              ))}
                            </div>
                          )}
                      </div>
                    </FormField>
                    <FormField label="Unit">
                      <input
                        list="unit-options"
                        value={newAppt.unit}
                        onChange={(e) =>
                          setNewAppt({ ...newAppt, unit: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
                        placeholder="e.g., Unit A"
                      />
                      <datalist id="unit-options">
                        <option value="Unit A" />
                        <option value="Unit B" />
                        <option value="Unit 1" />
                        <option value="Unit 2" />
                        <option value="Unit 3" />
                        <option value="Unit 4" />
                        <option value="Rehab" />
                      </datalist>
                    </FormField>
                    <FormField label="Room #">
                      <input
                        type="text"
                        value={newAppt.roomNumber}
                        onChange={(e) =>
                          setNewAppt({ ...newAppt, roomNumber: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
                        placeholder="e.g., 214A"
                      />
                    </FormField>
                  </div>
                </section>

                {/* Location Details Section */}
                <section className="bg-white border border-[#d6deeb] rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 text-[#0b2a6f] font-black text-xs uppercase tracking-wider">
                    <MapPin size={16} /> Location Details
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Staff/Doctor Name">
                      <input
                        type="text"
                        value={newAppt.providerName}
                        onChange={(e) =>
                          setNewAppt({
                            ...newAppt,
                            providerName: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-soft-bg/30"
                        placeholder="e.g., Dr. Smith"
                      />
                    </FormField>
                    <FormField label="Location Name / Address">
                      <input
                        type="text"
                        value={newAppt.location}
                        onChange={(e) =>
                          setNewAppt({ ...newAppt, location: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-soft-bg/30"
                        placeholder="Clinic / Hospital / Address"
                      />
                    </FormField>
                    <FormField label="Contact Number">
                      <input
                        type="text"
                        value={newAppt.contactNumber}
                        onChange={(e) =>
                          setNewAppt({
                            ...newAppt,
                            contactNumber: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-soft-bg/30"
                        placeholder="(###) ###-####"
                      />
                    </FormField>
                  </div>
                </section>

                {/* Dates & Status Section */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField label="Transport Scheduling">
                    <input
                      type="date"
                      value={newAppt.schedulingDate}
                      onChange={(e) =>
                        setNewAppt({
                          ...newAppt,
                          schedulingDate: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
                    />
                  </FormField>
                  <FormField label="Date of Referral">
                    <input
                      type="date"
                      value={newAppt.referralDate}
                      onChange={(e) =>
                        setNewAppt({ ...newAppt, referralDate: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
                    />
                  </FormField>
                  <FormField label="Status">
                    <select
                      value={newAppt.status}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewAppt({
                          ...newAppt,
                          status: val as any,
                        });
                        if (["Cancelled", "Rescheduled", "Deferred", "Discontinued"].includes(val)) {
                           setModalStatusPrompt({ status: val, reason: "" });
                        }
                      }}
                      className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white appearance-none"
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Discontinued">Discontinued</option>
                      <option value="Deferred">Deferred</option>
                    </select>
                  </FormField>
                </section>

                {/* Detailed Timing Section */}
                <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField label="Date of Appt">
                    <input
                      type="date"
                      value={newAppt.date}
                      onChange={(e) =>
                        setNewAppt({ ...newAppt, date: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
                    />
                  </FormField>
                  <FormField label="Time of Appt">
                    <input
                      type="time"
                      value={newAppt.time}
                      onChange={(e) =>
                        setNewAppt({ ...newAppt, time: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
                    />
                  </FormField>
                  <FormField label="Pick Up Time">
                    <input
                      type="time"
                      value={newAppt.pickUpTime}
                      onChange={(e) =>
                        setNewAppt({ ...newAppt, pickUpTime: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
                    />
                  </FormField>
                </section>

                {/* Specialty & Service info */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Appt. Type (Specialty)">
                      <div className="space-y-2">
                        <select
                          value={showOtherSpecialtyInput ? "Other" : newAppt.type}
                          onChange={(e) => {
                            if (e.target.value === "Other") {
                              setShowOtherSpecialtyInput(true);
                              setNewAppt({ ...newAppt, type: "" });
                            } else {
                              setShowOtherSpecialtyInput(false);
                              setNewAppt({ ...newAppt, type: e.target.value });
                            }
                          }}
                          className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white appearance-none"
                        >
                          <option value="">— Select Specialty —</option>
                          {MEDICAL_SPECIALTIES.map((spec) => (
                            <option key={spec} value={spec}>
                              {spec}
                            </option>
                          ))}
                          <option value="Other">Other (Manual Entry)</option>
                        </select>
                        {showOtherSpecialtyInput && (
                          <input
                            type="text"
                            placeholder="Enter specialty manually..."
                            value={newAppt.type}
                            onChange={(e) =>
                              setNewAppt({ ...newAppt, type: e.target.value })
                            }
                            className="w-full px-4 py-2 text-sm rounded-xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
                            autoFocus
                          />
                        )}
                      </div>
                    </FormField>
                    <FormField label="Visit Category">
                      <select
                        value={newAppt.description}
                        onChange={(e) =>
                          setNewAppt({
                            ...newAppt,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white appearance-none"
                      >
                        <option value="">— Select Category —</option>
                        <option value="Follow-up">Follow-up</option>
                        <option value="Initial Eval">Initial Eval</option>
                        <option value="Procedure">Procedure</option>
                      </select>
                    </FormField>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Service In House?">
                      <select
                        value={newAppt.serviceInHouse}
                        onChange={(e) =>
                          setNewAppt({
                            ...newAppt,
                            serviceInHouse: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white appearance-none"
                      >
                        <option value="">—</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </FormField>
                    <FormField label="Description">
                      <input
                        type="text"
                        value={newAppt.reasonSendOut}
                        onChange={(e) =>
                          setNewAppt({
                            ...newAppt,
                            reasonSendOut: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
                        placeholder="Provider unavailable"
                      />
                    </FormField>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Consult Reason (Admin)">
                      <select
                        value={newAppt.consultReason || ""}
                        onChange={(e) =>
                          setNewAppt({
                            ...newAppt,
                            consultReason: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white appearance-none"
                      >
                        <option value="">— Select Statistical Reason —</option>
                        {newAppt.type && CONSULT_REASONS_BY_SPECIALTY[newAppt.type] ? (
                          CONSULT_REASONS_BY_SPECIALTY[newAppt.type].map((reason, idx) => (
                            <option key={idx} value={reason}>
                              {reason}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>Select a valid specialty first</option>
                        )}
                        {(!newAppt.type || !CONSULT_REASONS_BY_SPECIALTY[newAppt.type]) && (
                          <option value="Other">Other</option>
                        )}
                      </select>
                    </FormField>
                    <FormField label="Reason for Consultation (Notes)">
                      <input
                        type="text"
                        value={newAppt.reasonConsultation || ""}
                        onChange={(e) =>
                          setNewAppt({
                            ...newAppt,
                            reasonConsultation: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
                        placeholder="Additional details for the outside consult"
                      />
                    </FormField>
                  </div>
                </section>

                {/* Additional Clinical Details (Checklist) */}
                <section className="bg-white border border-[#d6deeb] rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 text-[#0b2a6f] font-black text-xs uppercase tracking-wider">
                    <Database size={16} /> Patient & Consult Details
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Nursing Staff">
                      <input
                        type="text"
                        value={newAppt.nurseCompleting || ""}
                        onChange={(e) =>
                          setNewAppt({
                            ...newAppt,
                            nurseCompleting: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-soft-bg/30"
                        placeholder="Nurse completing form"
                      />
                    </FormField>
                    <FormField label="Patient Weight">
                      <input
                        type="text"
                        value={newAppt.weight || ""}
                        onChange={(e) =>
                          setNewAppt({ ...newAppt, weight: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-soft-bg/30"
                        placeholder="e.g., 150 lbs"
                      />
                    </FormField>
                    <FormField label="Patient Height">
                      <input
                        type="text"
                        value={newAppt.height || ""}
                        onChange={(e) =>
                          setNewAppt({ ...newAppt, height: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-soft-bg/30"
                        placeholder="e.g., 5' 2&quot;"
                      />
                    </FormField>
                  </div>
                  <div className="mt-5 pt-5 border-t border-[#d6deeb] flex flex-wrap gap-x-6 gap-y-3">
                    <label className="flex items-center gap-2 text-sm text-[#475569] font-medium cursor-pointer">
                      <input type="checkbox" checked={!!newAppt.ambulating} onChange={e => setNewAppt({...newAppt, ambulating: e.target.checked})} className="w-4 h-4 rounded border-[#d6deeb] text-brand focus:ring-brand-2/20" /> Ambulating
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[#475569] font-medium cursor-pointer">
                      <input type="checkbox" checked={!!newAppt.wheelchair} onChange={e => setNewAppt({...newAppt, wheelchair: e.target.checked})} className="w-4 h-4 rounded border-[#d6deeb] text-brand focus:ring-brand-2/20" /> Wheelchair
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[#475569] font-medium cursor-pointer">
                      <input type="checkbox" checked={!!newAppt.withLift} onChange={e => setNewAppt({...newAppt, withLift: e.target.checked})} className="w-4 h-4 rounded border-[#d6deeb] text-brand focus:ring-brand-2/20" /> With lift
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[#475569] font-medium cursor-pointer">
                      <input type="checkbox" checked={!!newAppt.recliner} onChange={e => setNewAppt({...newAppt, recliner: e.target.checked})} className="w-4 h-4 rounded border-[#d6deeb] text-brand focus:ring-brand-2/20" /> Recliner
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[#475569] font-medium cursor-pointer">
                      <input type="checkbox" checked={newAppt.escort === "Yes"} onChange={e => setNewAppt({...newAppt, escort: e.target.checked ? "Yes" : "No"})} className="w-4 h-4 rounded border-[#d6deeb] text-brand focus:ring-brand-2/20" /> Escort
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[#475569] font-medium cursor-pointer">
                      <input type="checkbox" checked={!!newAppt.oxygen} onChange={e => setNewAppt({...newAppt, oxygen: e.target.checked})} className="w-4 h-4 rounded border-[#d6deeb] text-brand focus:ring-brand-2/20" /> Oxygen
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[#475569] font-medium cursor-pointer">
                      <input type="checkbox" checked={!!newAppt.bariatric} onChange={e => setNewAppt({...newAppt, bariatric: e.target.checked})} className="w-4 h-4 rounded border-[#d6deeb] text-brand focus:ring-brand-2/20" /> Bariatric
                    </label>
                  </div>
                </section>

                {/* Transport Section */}
                <section className="bg-brand-light/30 border border-brand/10 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-5 text-brand font-black text-xs uppercase tracking-wider">
                    <Database size={16} /> Transport & Logistics
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div className="flex flex-col gap-3">
                      <FormField label="Type of Transport">
                        <select
                          value={newAppt.transportType}
                          onChange={(e) =>
                            setNewAppt({
                              ...newAppt,
                              transportType: e.target.value,
                              ...(e.target.value !== "Others" ? { transportTypeOther: "" } : {})
                            })
                          }
                          className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white appearance-none"
                        >
                          <option value="">— Select —</option>
                          <option value="Facility Van">Facility Van</option>
                          <option value="Ambulance">Ambulance</option>
                          <option value="Lyft/Uber">Lyft/Uber</option>
                          <option value="Ambulette">Ambulette</option>
                          <option value="Private Care">Private Care</option>
                          <option value="Others">Others</option>
                        </select>
                      </FormField>
                      {newAppt.transportType === "Others" && (
                        <FormField label="Other Transport Type">
                          <input
                            type="text"
                            value={newAppt.transportTypeOther || ""}
                            onChange={(e) =>
                              setNewAppt({
                                ...newAppt,
                                transportTypeOther: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
                            placeholder="Enter transport type"
                          />
                        </FormField>
                      )}
                    </div>
                    
                    <FormField label="Transport Company">
                      <select
                        value={newAppt.transportCompanyId || (newAppt.transportCompany === "Others" ? "others" : "")}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "others") {
                            setNewAppt({
                              ...newAppt,
                              transportCompanyId: "",
                              transportCompany: "Others",
                              transportCompanyOther: "",
                              transportCompanyPhone: "",
                            });
                            return;
                          }

                          const selected = transportCompanies.find((company) => company.id === value);
                          if (selected) {
                            setNewAppt({
                              ...newAppt,
                              transportCompanyId: selected.id,
                              transportCompany: selected.name,
                              transportCompanyOther: "",
                              transportCompanyPhone: selected.phone || "",
                            });
                          }
                        }}
                        className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
                      >
                        <option value="">Select transportation company</option>
                        {transportCompanies.map((company) => (
                          <option key={company.id} value={company.id}>
                            {company.name}{company.phone ? ` — ${company.phone}` : ""}
                          </option>
                        ))}
                        <option value="others">Others / Not in Directory</option>
                      </select>
                    </FormField>

                    {newAppt.transportCompany === "Others" && (
                      <FormField label="Manual Transport Company">
                        <input
                          type="text"
                          value={newAppt.transportCompanyOther || ""}
                          onChange={(e) =>
                            setNewAppt({
                              ...newAppt,
                              transportCompanyOther: e.target.value,
                              transportCompany: e.target.value || "Others",
                            })
                          }
                          className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
                          placeholder="Enter company name"
                        />
                      </FormField>
                    )}

                    <FormField label="Transport Company Contact #">
                      <input
                        type="text"
                        value={newAppt.transportCompanyPhone || ""}
                        onChange={(e) =>
                          setNewAppt({
                            ...newAppt,
                            transportCompanyPhone: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
                        placeholder="Auto-filled from directory or enter manually"
                      />
                    </FormField>

                    <div className="flex flex-col gap-3">
                      <FormField label="Payer for Ride">
                        <select
                          value={newAppt.payerForRide}
                          onChange={(e) =>
                            setNewAppt({
                              ...newAppt,
                              payerForRide: e.target.value,
                              ...(e.target.value !== "Others" ? { payerForRideOther: "" } : {})
                            })
                          }
                          className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white appearance-none"
                        >
                          <option value="">— Select —</option>
                          <option value="Medicaid">Medicaid</option>
                          <option value="Medicare">Medicare</option>
                          <option value="Facility">Facility</option>
                          <option value="Resident">Resident</option>
                          <option value="Others">Others</option>
                        </select>
                      </FormField>
                      {newAppt.payerForRide === "Others" && (
                        <FormField label="Other Payer">
                          <input
                            type="text"
                            value={newAppt.payerForRideOther || ""}
                            onChange={(e) =>
                              setNewAppt({
                                ...newAppt,
                                payerForRideOther: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
                            placeholder="Enter payer details"
                          />
                        </FormField>
                      )}
                    </div>
                    
                    <FormField label="Round Trip?">
                      <select
                        value={newAppt.roundTrip}
                        onChange={(e) =>
                          setNewAppt({ ...newAppt, roundTrip: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white appearance-none"
                      >
                        <option value="">—</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </FormField>

                    <div className="flex flex-col gap-3">
                      <FormField label="Escort?">
                        <select
                          value={newAppt.escort}
                          onChange={(e) =>
                            setNewAppt({ ...newAppt, escort: e.target.value, ...(e.target.value === "No" ? { escortDetails: "" } : {}) })
                          }
                          className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white appearance-none"
                        >
                          <option value="">—</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </FormField>
                      {newAppt.escort === "Yes" && (
                        <>
                          <FormField label="Escort Details">
                            <input
                              type="text"
                              value={newAppt.escortDetails || ""}
                              onChange={(e) =>
                                setNewAppt({ ...newAppt, escortDetails: e.target.value })
                              }
                              className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
                              placeholder="Enter escort name/details..."
                            />
                          </FormField>
                          <FormField label="Escort Phone #">
                            <input
                              type="text"
                              value={newAppt.escortPhone || ""}
                              onChange={(e) =>
                                setNewAppt({ ...newAppt, escortPhone: e.target.value })
                              }
                              className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white"
                              placeholder="Escort contact number"
                            />
                          </FormField>
                        </>
                      )}
                    </div>
                  </div>
                </section>

                <FormField label="Notes / Other">
                  <textarea
                    value={newAppt.notes}
                    onChange={(e) =>
                      setNewAppt({ ...newAppt, notes: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white min-h-[100px]"
                    placeholder="Add any relevant details..."
                  />
                </FormField>
              </div>

              <div className="p-6 border-t border-[#d6deeb] bg-white flex items-center justify-between shrink-0">
                <div>
                  {editingId && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        if (confirm("Delete this record?")) {
                          deleteAppointment(editingId);
                          setIsAddModalOpen(false);
                        }
                      }}
                    >
                      Delete Record
                    </Button>
                  )}
                </div>
                <div>
                  <Button
                    variant="secondary"
                    className="mr-3"
                    onClick={() => setIsAddModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveAppointment}>
                    {editingId
                      ? "Update Appointment Record"
                      : "Save Appointment Record"}
                  </Button>
                </div>
              </div>
            </motion.div>
            
            <AnimatePresence>
              {modalStatusPrompt && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
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
                      <p className="text-sm font-medium text-slate-600 mb-3 block">Reason for changing status to <span className="font-bold text-brand">{modalStatusPrompt.status}</span>:</p>
                      <textarea
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all resize-none mb-4"
                        rows={3}
                        placeholder="Enter reason..."
                        value={modalStatusPrompt.reason}
                        onChange={(e) => setModalStatusPrompt({...modalStatusPrompt, reason: e.target.value})}
                      />
                      <div className="flex items-center gap-3 justify-end">
                        <button 
                          onClick={() => {
                              setModalStatusPrompt(null);
                          }} 
                          className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition-colors"
                        >
                          Dismiss
                        </button>
                        <Button 
                          onClick={() => {
                            setNewAppt(prev => {
                               const existingNotes = prev.notes || "";
                               const val = modalStatusPrompt.status;
                               const reason = modalStatusPrompt.reason;
                               return {
                                 ...prev,
                                 notes: existingNotes ? `${existingNotes}\n[${val} Reason]: ${reason}` : `[${val} Reason]: ${reason}`
                               }
                             });
                             setModalStatusPrompt(null);
                          }}
                        >
                          Append to Notes
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        {isResidentDetailOpen && selectedResident && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsResidentDetailOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 18 }}
              className="relative w-full max-w-4xl bg-[#f8fbff] rounded-3xl shadow-2xl overflow-hidden border border-[#d6deeb] max-h-[90vh] flex flex-col"
            >
              <div className="transport-gradient text-white p-5 shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white border border-white/30 backdrop-blur-md">
                    <User size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">
                      {selectedResident.name}
                    </h3>
                    <p className="text-xs opacity-85 mt-0.5">
                      Resident ID:{" "}
                      <span className="font-mono">{selectedResident.mrn}</span>{" "}
                      • Room {selectedResident.roomNumber}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsResidentDetailOpen(false)}
                  className="p-2 hover:bg-white/15 rounded-full"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto page-scrollbar flex-1 space-y-8">
                {/* Basic Info Grid */}
                <section>
                  <div className="flex items-center gap-2 mb-4 text-[#0b2a6f] font-black text-xs uppercase tracking-wider">
                    <User size={16} /> Demographics & Identity
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <DetailItem label="Sex" value={selectedResident.sex} />
                    <DetailItem label="Age" value={selectedResident.age} />
                    <DetailItem
                      label="Admission Date"
                      value={selectedResident.admissionDate}
                    />
                    <DetailItem
                      label="Primary Doctor"
                      value={selectedResident.doctor}
                    />
                    <DetailItem
                      label="Location"
                      value={`${selectedResident.floor} • ${selectedResident.unit}`}
                    />
                    <DetailItem
                      label="Room Number"
                      value={selectedResident.roomNumber}
                    />
                  </div>
                </section>

                {/* Clinical Summary */}
                <section className="bg-white border border-[#d6deeb] rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 text-[#0b2a6f] font-black text-xs uppercase tracking-wider">
                    <Activity size={16} /> Clinical Profile
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                        Primary Diagnosis
                      </p>
                      <p className="text-sm font-bold text-slate-800 bg-brand-light/20 p-3 rounded-xl border border-brand/5">
                        {selectedResident.diagnosis}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                        Allergies
                      </p>
                      <p
                        className={`text-sm font-bold p-3 rounded-xl border ${selectedResident.allergies.toLowerCase() === "no known allergies" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"}`}
                      >
                        {selectedResident.allergies}
                      </p>
                    </div>
                    {selectedResident.notes && (
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                          Medical Brief / Notes
                        </p>
                        <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap">
                          {selectedResident.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Appointment History */}
                <section>
                  <div className="flex items-center gap-2 mb-4 text-[#0b2a6f] font-black text-xs uppercase tracking-wider">
                    <Calendar size={16} /> Appointment & Visit History
                  </div>
                  <div className="space-y-3">
                    {residentAppointments.length > 0 ? (
                      residentAppointments
                        .sort(
                          (a, b) =>
                            new Date(b.date).getTime() -
                            new Date(a.date).getTime(),
                        )
                        .map((apt) => (
                          <div
                            key={apt.id}
                            className="bg-white border border-[#d6deeb] rounded-2xl p-4 flex items-center justify-between hover:border-brand/30 transition-all group"
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={`p-3 rounded-xl ${apt.status === "Completed" ? "bg-green-100 text-green-600" : "bg-brand-light text-brand"}`}
                              >
                                <Clock size={18} />
                              </div>
                              <div>
                                <p className="font-black text-slate-800">
                                  {apt.type}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {formatFullDate(apt.date)} at {formatTimeAMPM(apt.time)}
                                </p>
                                <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                                  {apt.providerName} • {apt.location}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                           <div className="flex items-center gap-2 justify-end">
<button
  onClick={(e) => {
    e.stopPropagation();
    handleGenerateForm(apt, "Visit Form");
  }}
  className="flex items-center gap-1 px-2 py-1 rounded-md bg-brand-light hover:bg-brand/20 text-brand transition-colors text-[9px] font-bold uppercase tracking-wider"
  title="Visit Form"
>
  <FileText size={10} /> Visit Form
</button>

<button
  onClick={(e) => {
    e.stopPropagation();
    handleGenerateForm(apt, "Checklist");
  }}
  className="flex items-center gap-1 px-2 py-1 rounded-md bg-brand-light hover:bg-brand/20 text-brand transition-colors text-[9px] font-bold uppercase tracking-wider"
  title="Checklist"
>
  <ClipboardCheck size={10} /> Checklist
</button>

<button
  onClick={(e) => {
    e.stopPropagation();
    handleGenerateForm(apt, "Medical Clearance");
  }}
  className="flex items-center gap-1 px-2 py-1 rounded-md bg-brand-light hover:bg-brand/20 text-brand transition-colors text-[9px] font-bold uppercase tracking-wider"
  title="Medical Clearance"
>
  <ShieldCheck size={10} /> Medical Clearance
</button>

<button
  onClick={(e) => {
    e.stopPropagation();
    handleGenerateForm(apt, "Consult");
  }}
  className="flex items-center gap-1 px-2 py-1 rounded-md bg-brand-light hover:bg-brand/20 text-brand transition-colors text-[9px] font-bold uppercase tracking-wider"
  title={getConsultFormLabel(apt)}
>
  <FileText size={10} /> {getConsultFormLabel(apt)}
</button>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                                    apt.status === "Completed"
                                      ? "bg-green-100 text-green-600"
                                      : apt.status === "Cancelled"
                                        ? "bg-red-100 text-red-600"
                                        : "bg-brand-light text-brand"
                                  }`}
                                >
                                  {apt.status}
                                </span>
                              </div>
                              {apt.notes && (
                                <p className="text-[10px] text-slate-400 mt-1 italic truncate max-w-[150px]">
                                  "{apt.notes}"
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <p className="text-slate-400 font-bold text-sm">
                          No appointment records found for this resident.
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <div className="p-5 border-t border-[#d6deeb] bg-[rgba(11,42,111,.03)] shrink-0 flex justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setIsResidentDetailOpen(false)}
                >
                  Close Detailed View
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
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
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
=======
__CONTENT__
>>>>>>> 15bdb945e8358b653242eb03ec3790d61078609e
