/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { generateAppointmentPDF, generateFullReport } from './services/pdfService';
import {
  Calendar,
  Users,
  ClipboardList,
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
  FileSpreadsheet
} from 'lucide-react';
import { useHealthData } from './hooks/useHealthData';
import { Card } from './components/Card';
import { Button } from './components/Button';
import { Appointment, Resident } from './types';

type Tab = 'dashboard' | 'appointments' | 'trends' | 'reports' | 'census' | 'help';

const TAB_META: Record<Tab, { title: string; subtitle: string; badge: string }> = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'High-level overview of upcoming visits, volume trends, and provider activity.',
    badge: 'Overview'
  },
  appointments: {
    title: 'Appointments',
    subtitle: 'Manage and monitor all scheduled medical visits and logistics in one place.',
    badge: 'Entry Log'
  },
  trends: {
    title: 'Specialty Trends',
    subtitle: 'Visualize visit volume by specialty to identify service demand and distribution.',
    badge: 'Analytics'
  },
  reports: {
    title: 'Report Builder',
    subtitle: 'Generate and export clinical data reports for specific date ranges or providers.',
    badge: 'Operations'
  },
  census: {
    title: 'Patient Census',
    subtitle: 'Manage resident data, unit assignments, and room allocations for auto-fill.',
    badge: 'Registry'
  },
  help: {
    title: 'System Guide',
    subtitle: 'Version history, user instructions, and technical documentation.',
    badge: 'Support'
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newAppt, setNewAppt] = useState<Partial<Appointment>>({
    status: 'Scheduled',
    residentName: '',
    origin: '',
    unit: '',
    roomNumber: '',
    providerName: '',
    location: '',
    contactNumber: '',
    schedulingDate: '',
    referralDate: '',
    dueDate: '',
    date: '',
    time: '',
    pickUpTime: '',
    type: '',
    description: '',
    serviceInHouse: '',
    reasonSendOut: '',
    transportType: '',
    transportCompany: '',
    payerForRide: '',
    roundTrip: '',
    escort: '',
    notes: ''
  });

  const {
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
    isLoaded
  } = useHealthData();

  const [censusPasteText, setCensusPasteText] = useState('');
  const [parsedResidentsPreview, setParsedResidentsPreview] = useState<Omit<Resident, 'id'>[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [censusSkipDuplicates, setCensusSkipDuplicates] = useState(false);
  
  const [reportFilters, setReportFilters] = useState({
    startDate: '',
    endDate: '',
    specialties: [] as string[],
    exportType: 'PDF Document (.pdf)',
    columns: ['Resident Name', 'Date', 'Time', 'Provider', 'Specialty', 'Transport']
  });

  const [residentSearchTerm, setResidentSearchTerm] = useState('');
  const [showResidentSuggestions, setShowResidentSuggestions] = useState(false);
  const [censusSearchQuery, setCensusSearchQuery] = useState('');
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [isResidentDetailOpen, setIsResidentDetailOpen] = useState(false);

  const handleParseCensus = () => {
    if (!censusPasteText.trim()) return;
    setIsParsing(true);
    
    const lines = censusPasteText.split('\n');
    const residentMap = new Map<string, any>();
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.length < 15) return;

      // Skip common header noise
      const lower = trimmed.toLowerCase();
      if (
        lower.includes('resident listing report') || 
        lower.includes('facility #') || 
        lower.includes('page #') ||
        lower.startsWith('date:') || 
        lower.startsWith('time:') || 
        lower.startsWith('user:') ||
        lower.startsWith('resident:') || 
        lower.includes('status: current') ||
        lower === 'name' || 
        lower === 'age' || 
        lower === 'location' || 
        lower.includes('(fl un rm bd)') ||
        lower.includes('gender') ||
        lower.includes('admission date')
      ) {
        return;
      }

      // 1. Extract Name and MRN
      // Pattern: NAME (MRN) or NAME (MRN) 
      const nameMrnMatch = trimmed.match(/^(.+?)\s\((.+?)\)/);
      let name = '—';
      let mrn = '—';
      let remaining = trimmed;

      if (nameMrnMatch) {
         name = nameMrnMatch[1].trim();
         mrn = nameMrnMatch[2].trim();
         remaining = trimmed.substring(nameMrnMatch[0].length).trim();
      } else {
         // Try to find if there is a (MRN) anywhere
         const mrnMatch = trimmed.match(/\((.*?)\)/);
         if (mrnMatch) {
           mrn = mrnMatch[1].trim();
           name = trimmed.substring(0, mrnMatch.index).trim();
           remaining = trimmed.substring(mrnMatch.index + mrnMatch[0].length).trim();
         } else {
           // Fallback: look for multiple spaces after name
           const firstParts = trimmed.split(/\s{2,}/);
           if (firstParts.length > 1) {
              name = firstParts[0].trim();
              remaining = trimmed.substring(firstParts[0].length).trim();
           } else {
              return; // Probably not a data line
           }
         }
      }

      // Cleanup name from potential junk
      name = name.replace(/,/g, ', ').replace(/\s+/g, ' ').trim();
      if (name.toLowerCase() === 'name') return;

      // 2. Extract Age (usually 1-3 digits)
      const ageMatch = remaining.match(/^(\d{1,3})\s/);
      let age = '—';
      if (ageMatch) {
        age = ageMatch[1];
        remaining = remaining.substring(ageMatch[0].length).trim();
      }

      // 3. Extract Birth Date (Optional MM/DD/YYYY)
      const dateRegex = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/;
      let birthDate = '—';
      const birthDateMatch = remaining.match(new RegExp('^' + dateRegex.source));
      if (birthDateMatch) {
        birthDate = birthDateMatch[0];
        remaining = remaining.substring(birthDateMatch[0].length).trim();
      }

      // 4. Extract Gender (M/F) and separate Location
      // Gender usually follows location: "... 479 A M 4/16/2026"
      const genderPattern = /\s(M|F|Male|Female)\s/i;
      const genderMatch = remaining.match(genderPattern);
      let location = '—';
      let sex = '—';
      
      if (genderMatch) {
         location = remaining.substring(0, genderMatch.index).trim();
         sex = genderMatch[1].trim();
         remaining = remaining.substring(genderMatch.index + genderMatch[0].length).trim();
      } else {
         // Fallback if M/F is missing, use next date to find location
         const nextDateMatch = remaining.match(dateRegex);
         if (nextDateMatch) {
            location = remaining.substring(0, nextDateMatch.index).trim();
            remaining = remaining.substring(nextDateMatch.index).trim();
         } else {
            location = remaining;
            remaining = '';
         }
      }

      // Parse Location into Floor/Unit/Room
      let floor = '—';
      let unit = '—';
      let room = '—';
      
      if (location !== '—') {
        const fMatch = location.match(/(\d+\w+\sFloor|Floor\s+\d+)/i);
        const uMatch = location.match(/(Unit\s+\d+|Unit\s+\w+)/i);
        const rMatch = location.match(/(\d{3}\-[A-Z]|\d{3}\s[A-Z]|\d{3,4}[\s\-]\w+)/i);
        
        if (fMatch) floor = fMatch[1].trim();
        if (uMatch) unit = uMatch[1].trim();
        
        if (rMatch) {
          room = rMatch[1].trim();
        } else {
          // If no specific room match, use what's left
          let rPart = location;
          if (fMatch) rPart = rPart.replace(fMatch[1], '');
          if (uMatch) rPart = rPart.replace(uMatch[1], '');
          room = rPart.trim() || location;
        }
      }

      // 5. Extract Admission Date (the first date in remaining)
      const admissionDateMatch = remaining.match(dateRegex);
      let admissionDate = '—';
      if (admissionDateMatch) {
         admissionDate = admissionDateMatch[0];
         remaining = remaining.substring(remaining.indexOf(admissionDate) + admissionDate.length).trim();
      }

      // 6. Allergies, Physician, Diagnosis
      // These are usually at the end, often separated by multiple spaces
      const tailParts = remaining.split(/\s{2,}/).map(p => p.trim()).filter(Boolean);
      let allergies = 'No Known Allergies';
      let doctor = '—';
      let diagnosis = '—';
      
      if (tailParts.length >= 3) {
         allergies = tailParts[0];
         doctor = tailParts[1];
         diagnosis = tailParts[2];
      } else if (tailParts.length === 2) {
         // Check if first part looks like doctor or like allergies
         if (tailParts[0].toLowerCase().includes('dr.') || tailParts[0].split(' ').length > 2) {
            doctor = tailParts[0];
            diagnosis = tailParts[1];
         } else {
            allergies = tailParts[0];
            doctor = tailParts[1];
         }
      } else if (tailParts.length === 1) {
         diagnosis = tailParts[0];
      }

      // Final Assembly
      const nameParts = name.split(',').map(n => n.trim());
      const lastName = nameParts[0] || name;
      const firstName = nameParts.slice(1).join(' ') || '—';

      const resData = {
        name,
        lastName,
        firstName,
        mrn,
        age,
        floor,
        unit,
        roomNumber: room,
        sex: sex.toUpperCase().startsWith('M') ? 'Male' : sex.toUpperCase().startsWith('F') ? 'Female' : '—',
        admissionDate,
        allergies,
        doctor,
        diagnosis,
        notes: birthDate !== '—' ? `DOB: ${birthDate}` : ''
      };

      const uniqueKey = mrn !== '—' ? mrn : `${name}-${room}`.toLowerCase();
      
      // Duplicate detection
      const alreadyInSystem = residents.some(r => 
        (resData.mrn !== '—' && r.mrn === resData.mrn) || 
        (`${r.name}|${r.roomNumber}`.toLowerCase() === `${resData.name}|${resData.roomNumber}`.toLowerCase())
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
        const trulyNew = parsedResidentsPreview.filter(newRes => 
          !residents.some(r => 
            (newRes.mrn !== '—' && r.mrn === newRes.mrn) || 
            (`${r.name}|${r.roomNumber}`.toLowerCase() === `${newRes.name}|${newRes.roomNumber}`.toLowerCase())
          )
        );
        batchAddResidents(trulyNew);
      } else {
        // Systematic override of old census listing
        replaceResidents(parsedResidentsPreview);
      }
      setParsedResidentsPreview([]);
      setCensusPasteText('');
    }
  };

  const toggleReportColumn = (col: string) => {
    setReportFilters(prev => ({
      ...prev,
      columns: prev.columns.includes(col) 
        ? prev.columns.filter(c => c !== col)
        : [...prev.columns, col]
    }));
  };

  const setReportPreset = (type: 'today' | 'week' | 'month') => {
    const start = new Date();
    const end = new Date();
    
    if (type === 'week') {
      start.setDate(start.getDate() - 7);
    } else if (type === 'month') {
      start.setMonth(start.getMonth() - 1);
    }
    
    setReportFilters(prev => ({
      ...prev,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    }));
  };

  if (!isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-soft-bg text-brand font-black">
        Loading HealthSync...
      </div>
    );
  }

  const handleOpenAdd = () => {
    setEditingId(null);
    setNewAppt({
      status: 'Scheduled',
      residentName: '',
      origin: '',
      unit: '',
      roomNumber: '',
      providerName: '',
      location: '',
      contactNumber: '',
      schedulingDate: '',
      referralDate: '',
      dueDate: '',
      date: '',
      time: '',
      pickUpTime: '',
      type: '',
      description: '',
      serviceInHouse: '',
      reasonSendOut: '',
      transportType: '',
      transportCompany: '',
      payerForRide: '',
      roundTrip: '',
      escort: '',
      notes: ''
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (apt: Appointment) => {
    setEditingId(apt.id);
    setNewAppt({ ...apt });
    setIsAddModalOpen(true);
  };

  const handleSelectResident = (resident: Resident) => {
    // Normalize unit to match dropdown values if possible
    let matchedUnit = '';
    const unitStr = (resident.unit || '').trim();
    const units = ['Unit A', 'Unit B', 'Unit 1', 'Unit 2', 'Unit 3', 'Unit 4', 'Rehab'];
    
    // Try exact match first (case-insensitive)
    const exactMatch = units.find(u => u.toLowerCase() === unitStr.toLowerCase());
    if (exactMatch) {
      matchedUnit = exactMatch;
    } else {
      // Try partial match
      const lower = unitStr.toLowerCase();
      if (lower.includes('unit a')) matchedUnit = 'Unit A';
      else if (lower.includes('unit b')) matchedUnit = 'Unit B';
      else if (lower.includes('rehab')) matchedUnit = 'Rehab';
      else if (lower.includes('unit 1')) matchedUnit = 'Unit 1';
      else if (lower.includes('unit 2')) matchedUnit = 'Unit 2';
    }

    setNewAppt(prev => {
      let finalUnit = matchedUnit;
      if (!finalUnit && resident.unit && resident.unit !== '—') finalUnit = resident.unit;
      if (!finalUnit && resident.floor && resident.floor !== '—') finalUnit = resident.floor;
      if (!finalUnit) finalUnit = prev.unit;

      return {
        ...prev,
        residentName: resident.name,
        roomNumber: resident.roomNumber,
        unit: finalUnit,
        notes: `MRN: ${resident.mrn} | Physician: ${resident.doctor} | Age: ${resident.age}`
      };
    });
  };

  const filteredResidents = residents.filter(r => 
    r.name.toLowerCase().includes(residentSearchTerm.toLowerCase()) ||
    r.mrn.toLowerCase().includes(residentSearchTerm.toLowerCase())
  ).slice(0, 5);

  const handleResidentInputChange = (val: string) => {
    setResidentSearchTerm(val);
    setNewAppt({ ...newAppt, residentName: val });
    setShowResidentSuggestions(true);
  };

  const handleSaveAppointment = () => {
    if (!newAppt.residentName) return;
    
    if (editingId && updateAppointment) {
      const original = appointments.find(a => a.id === editingId);
      if (original) {
        const updates: Partial<Appointment> = {};
        (Object.keys(newAppt) as Array<keyof typeof newAppt>).forEach(key => {
          if (newAppt[key] !== (original as any)[key]) {
            (updates as any)[key] = newAppt[key];
          }
        });
        if (Object.keys(updates).length > 0) {
          updateAppointment(editingId, updates);
        }
      }
    } else {
      addAppointment(newAppt as Omit<Appointment, 'id'>);
    }
    
    setIsAddModalOpen(false);
    setEditingId(null);
  };

  const upcomingAppointments = appointments
    .filter(a => a.status === 'Scheduled')
    .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());

  const completedAppointments = appointments.filter(a => a.status === 'Completed');
  const nextAppointment = upcomingAppointments[0];
  const getDoctorNameDisplay = (apt: Appointment) => apt.providerName || 'Unknown Provider';
  const goToTab = (tab: Tab) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  const residentAppointments = selectedResident ? appointments.filter(a => 
    a.residentName === selectedResident.name || 
    (a.residentName.toLowerCase().includes(selectedResident.lastName.toLowerCase()) && a.residentName.toLowerCase().includes(selectedResident.firstName.toLowerCase()))
  ) : [];

  return (
    <div className="app-shell min-h-screen flex flex-col lg:flex-row">
      {isMenuOpen && (
        <button
          className="fixed inset-0 bg-slate-950/35 backdrop-blur-sm z-40 lg:hidden"
          aria-label="Close navigation overlay"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 p-4 transform transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:translate-x-0 lg:h-screen
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full transport-card overflow-hidden flex flex-col">
          <div className="transport-gradient text-white p-5 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-12 right-10 h-28 w-28 rounded-full bg-white/10" />
            <div className="relative flex items-center gap-3">
              <div className="w-11 h-11 bg-white/15 border border-white/25 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <Stethoscope size={24} />
              </div>
              <div>
                <h1 className="font-black leading-tight tracking-tight">HealthSync</h1>
                <p className="text-[10px] uppercase tracking-[0.22em] font-black opacity-80">Medical Tracker</p>
              </div>
            </div>
            <div className="relative mt-4 rounded-2xl bg-white/12 border border-white/20 p-3">
              <p className="text-xs font-black uppercase tracking-wider opacity-90">Appointment workspace</p>
              <p className="text-xs opacity-80 mt-1 leading-relaxed">Navigation, provider directory, and visit history in separated pages.</p>
            </div>
          </div>

          <nav className="flex-1 px-4 py-5 space-y-2" aria-label="Main pages">
            <NavItem active={activeTab === 'dashboard'} onClick={() => goToTab('dashboard')} icon={<Activity size={20} />} label="Dashboard" />
            <NavItem active={activeTab === 'appointments'} onClick={() => goToTab('appointments')} icon={<Calendar size={20} />} label="Appointments" />
            <NavItem active={activeTab === 'trends'} onClick={() => goToTab('trends')} icon={<BarChart3 size={20} />} label="Trends" />
            <NavItem active={activeTab === 'reports'} onClick={() => goToTab('reports')} icon={<FileText size={20} />} label="Reports" />
            <NavItem active={activeTab === 'census'} onClick={() => goToTab('census')} icon={<Users size={20} />} label="Census" />
            <NavItem active={activeTab === 'help'} onClick={() => goToTab('help')} icon={<ShieldCheck size={20} />} label="Help & Info" />
          </nav>

          <div className="p-4 border-t border-[#d6deeb] bg-[rgba(11,42,111,.03)]">
            <div className="rounded-2xl bg-white border border-[#d6deeb] p-4 shadow-[0_4px_12px_rgba(11,42,111,.08)]">
              <div className="flex items-center gap-2 text-brand font-black text-xs uppercase tracking-wider">
                <ShieldCheck size={16} /> Local Data
              </div>
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">Current build keeps your existing localStorage workflow intact while improving the visual layout.</p>
              <Button size="sm" variant="secondary" className="w-full mt-3" onClick={() => goToTab('appointments')}>Open Log</Button>
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
              <h2 className="text-2xl md:text-3xl font-black tracking-tight">{TAB_META[activeTab].title}</h2>
              <p className="text-sm opacity-90 mt-1 max-w-3xl leading-relaxed">{TAB_META[activeTab].subtitle}</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap xl:justify-end">
              <button className="transport-pill h-10 w-10 flex items-center justify-center text-brand hover:scale-[1.02] transition-transform" aria-label="Search">
                <Search size={18} />
              </button>
              <button className="transport-pill h-10 w-10 flex items-center justify-center text-brand relative hover:scale-[1.02] transition-transform" aria-label="Notifications">
                <Bell size={18} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              </button>
              <Button className="gap-2" onClick={handleOpenAdd}>
                <Plus size={17} /> Add Appointment
              </Button>
              <button className="lg:hidden transport-pill h-10 w-10 flex items-center justify-center text-brand" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </header>

        <div className="mb-6 transport-card p-2 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            <TopTab active={activeTab === 'dashboard'} onClick={() => goToTab('dashboard')} label="Dashboard" />
            <TopTab active={activeTab === 'appointments'} onClick={() => goToTab('appointments')} label="Appointments" />
            <TopTab active={activeTab === 'trends'} onClick={() => goToTab('trends')} label="Specialty Trends" />
            <TopTab active={activeTab === 'reports'} onClick={() => goToTab('reports')} label="Report Builder" />
            <TopTab active={activeTab === 'census'} onClick={() => goToTab('census')} label="Patient Census" />
            <TopTab active={activeTab === 'help'} onClick={() => goToTab('help')} label="Guide & Info" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.section key="dashboard" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: .18 }} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard label="Appointments" value={appointments.length.toString()} hint="Total saved visits" icon={<Calendar />} onClick={() => goToTab('appointments')} />
                <StatCard label="Patient Census" value={residents.length.toString()} hint="Active Registry" icon={<Users />} onClick={() => goToTab('census')} />
                <StatCard label="Completed" value={completedAppointments.length.toString()} hint="Closed visit records" icon={<ShieldCheck />} onClick={() => goToTab('appointments')} />
                <StatCard label="Next Visit" value={nextAppointment ? formatShortDate(nextAppointment.date) : '—'} hint={nextAppointment ? nextAppointment.time : 'No upcoming visit'} icon={<Activity />} onClick={() => goToTab('appointments')} />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <Card title="Planned Appointments" subtitle={`${upcomingAppointments.length} item${upcomingAppointments.length === 1 ? '' : 's'} scheduled`} className="xl:col-span-2">
                  <div className="space-y-3">
                    {upcomingAppointments.length > 0 ? (
                      upcomingAppointments.map((apt) => (
                        <AppointmentItem 
                          key={apt.id} 
                          appointment={apt} 
                          residents={residents}
                          doctorName={getDoctorNameDisplay(apt)} 
                          onClick={() => handleOpenEdit(apt)} 
                        />
                      ))
                    ) : (
                      <EmptyState icon={<Calendar size={44} />} title="No upcoming appointments" text="Use Add Appointment to start a new entry." action={<Button size="sm" variant="secondary" onClick={handleOpenAdd}>New Record</Button>} />
                    )}
                  </div>
                </Card>

                <div className="space-y-6">
                  <Card title="Quick Actions" subtitle="Common tracker tasks">
                    <div className="grid gap-3">
                      <Button className="w-full justify-start gap-3" onClick={handleOpenAdd}><Plus size={18} /> Add Appointment</Button>
                      <Button variant="secondary" className="w-full justify-start gap-3" onClick={() => goToTab('census')}><Users size={18} /> Manage Census</Button>
                      <Button variant="secondary" className="w-full justify-start gap-3" onClick={() => goToTab('reports')}><FileText size={18} /> Build Reports</Button>
                    </div>
                  </Card>

                  <div className="transport-gradient rounded-2xl p-6 text-white shadow-[0_10px_30px_rgba(11,42,111,.12)]">
                    <h4 className="font-black text-lg mb-2 flex items-center gap-2"><Bell size={20} /> Daily Health Tip</h4>
                    <p className="text-sm opacity-90 leading-relaxed">Keep appointment details updated with provider, date, time, location, and follow-up notes so records stay survey-ready and easy to review.</p>
                    <button className="mt-4 text-xs font-black bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors">View All Tips</button>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {activeTab === 'appointments' && (
            <motion.section key="appointments" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: .18 }} className="space-y-5">
              <Card 
                title="Consolidated Appointment Log" 
                subtitle="High-definition tabular view of all medical visits and logistics."
                actions={<Button size="sm" onClick={handleOpenAdd}><Plus size={15} /> Add Record</Button>}
                className="overflow-hidden"
              >
                <div className="mt-2">
                  {appointments.length > 0 ? (
                    <WideAppointmentTable 
                      appointments={appointments.sort((a,b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())}
                      residents={residents}
                      onEdit={handleOpenEdit}
                    />
                  ) : (
                    <EmptyState icon={<Database size={44} />} title="No entries found" text="Your system log is currently empty." />
                  )}
                </div>
              </Card>
            </motion.section>
          )}

          {activeTab === 'reports' && (
            <motion.section key="reports" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: .18 }} className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-4 space-y-6">
                  <Card title="Report Configuration" subtitle="Define boundaries for data extraction.">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="block text-xs font-black uppercase text-slate-500">Quick Presets</label>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => setReportPreset('today')} className="px-3 py-1.5 rounded-lg border border-[#d6deeb] text-xs font-bold hover:bg-brand-light transition-colors">Today</button>
                          <button onClick={() => setReportPreset('week')} className="px-3 py-1.5 rounded-lg border border-[#d6deeb] text-xs font-bold hover:bg-brand-light transition-colors">Last 7 Days</button>
                          <button onClick={() => setReportPreset('month')} className="px-3 py-1.5 rounded-lg border border-[#d6deeb] text-xs font-bold hover:bg-brand-light transition-colors">Last Month</button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField label="From Date">
                          <input 
                            type="date" 
                            value={reportFilters.startDate} 
                            onChange={e => setReportFilters({...reportFilters, startDate: e.target.value})}
                            className="w-full px-4 py-2 rounded-xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 outline-none bg-white text-sm" 
                          />
                        </FormField>
                        <FormField label="To Date">
                          <input 
                            type="date" 
                            value={reportFilters.endDate} 
                            onChange={e => setReportFilters({...reportFilters, endDate: e.target.value})}
                            className="w-full px-4 py-2 rounded-xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 outline-none bg-white text-sm" 
                          />
                        </FormField>
                      </div>

                      <FormField label="Export Format">
                        <div className="grid grid-cols-1 gap-2">
                          {['PDF Document (.pdf)', 'Excel Worksheet (.xlsx)', 'CSV Data (.csv)'].map(fmt => (
                            <button 
                              key={fmt}
                              onClick={() => setReportFilters({...reportFilters, exportType: fmt})}
                              className={`flex items-center justify-between p-3 rounded-xl border text-sm font-bold transition-all ${
                                reportFilters.exportType === fmt 
                                  ? 'border-brand bg-brand-light text-brand shadow-sm' 
                                  : 'border-[#d6deeb] bg-white text-slate-600 hover:border-brand/30'
                              }`}
                            >
                               <div className="flex items-center gap-3">
                                 {fmt.includes('.pdf') ? <FileText size={16} /> : fmt.includes('.xlsx') ? <FileSpreadsheet size={16} /> : <Database size={16} />}
                                 {fmt}
                               </div>
                               {reportFilters.exportType === fmt && <CheckSquare size={14} />}
                            </button>
                          ))}
                        </div>
                      </FormField>

                      <div className="pt-4 flex gap-3">
                        <Button 
                          className="flex-1 gap-2 shadow-lg hover:shadow-brand/20"
                          onClick={() => {
                            const filtered = appointments.filter(apt => {
                              const date = new Date(apt.date);
                              const start = reportFilters.startDate ? new Date(reportFilters.startDate) : null;
                              const end = reportFilters.endDate ? new Date(reportFilters.endDate) : null;
                              if (start && date < start) return false;
                              if (end && date > end) return false;
                              return true;
                            });
                            generateFullReport(filtered, reportFilters.columns);
                          }}
                        >
                          <FileDown size={18} /> Generate
                        </Button>
                        <Button variant="secondary" className="px-4"><Printer size={18} /></Button>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="xl:col-span-8 space-y-6">
                  <Card title="Column Selection" subtitle="Choose which data tags to include in your output.">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {['Resident Name', 'Date', 'Time', 'Provider', 'Specialty', 'Transport', 'Status', 'Origin', 'Room #', 'Unit', 'Notes', 'Payer'].map(col => (
                        <button 
                          key={col}
                          onClick={() => toggleReportColumn(col)}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-black transition-all ${
                            reportFilters.columns.includes(col)
                              ? 'bg-brand text-white border-transparent'
                              : 'bg-white text-slate-500 border-[#d6deeb] hover:border-brand/40'
                          }`}
                        >
                          {reportFilters.columns.includes(col) ? <CheckSquare size={16} /> : <Square size={16} />}
                          {col}
                        </button>
                      ))}
                    </div>
                  </Card>

                  <Card title="Live Preview (Draft)" subtitle="Real-time look at filtered records." className="overflow-hidden">
                    <div className="mt-2">
                      {appointments.length > 0 ? (
                        <WideAppointmentTable 
                          appointments={appointments.filter(apt => {
                            const date = new Date(apt.date);
                            const start = reportFilters.startDate ? new Date(reportFilters.startDate) : null;
                            const end = reportFilters.endDate ? new Date(reportFilters.endDate) : null;
                            if (start && date < start) return false;
                            if (end && date > end) return false;
                            return true;
                          }).slice(0, 10)} 
                          residents={residents}
                          selectedColumns={reportFilters.columns}
                          onEdit={handleOpenEdit} 
                        />
                      ) : (
                        <div className="py-20 text-center opacity-40 italic text-sm">No data matching current filters</div>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            </motion.section>
          )}

          {activeTab === 'trends' && (
            <motion.section key="trends" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: .18 }} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Volume by Specialty" subtitle="Monthly appointment distribution.">
                  <div className="h-64 flex items-end justify-between gap-4 pt-10 px-4">
                    {[65, 45, 85, 30, 55, 75, 40].map((h, i) => (
                      <div key={i} className="flex-1 bg-brand-light rounded-t-xl relative group transition-all hover:bg-brand/10">
                        <motion.div 
                          initial={{ height: 0 }} 
                          animate={{ height: `${h}%` }} 
                          className="absolute bottom-0 left-0 right-0 bg-brand rounded-t-xl shadow-[0_-4px_12px_rgba(11,42,111,0.2)]"
                        />
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {Math.round(h / 2)} Visit{h/2 === 1 ? '' : 's'}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                    <span>Cardio</span><span>Derm</span><span>Ortho</span><span>Physio</span><span>Dental</span><span>Onco</span><span>Gastro</span>
                  </div>
                </Card>
                <Card title="Growth Analytics" subtitle="Provider availability vs network demand.">
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 rounded-full bg-brand-light flex items-center justify-center text-brand mb-4">
                      <TrendingUp size={32} />
                    </div>
                    <p className="font-black text-slate-900">12% Monthly Increase</p>
                    <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">Network demand for specialty referrals is currently outpacing in-house provider capacity.</p>
                    <div className="mt-8 grid grid-cols-3 gap-4 w-full px-6">
                       <div className="text-center"><p className="text-xs font-black text-slate-400">MAY</p><p className="font-extrabold text-brand">+4.2%</p></div>
                       <div className="text-center"><p className="text-xs font-black text-slate-400">JUN</p><p className="font-extrabold text-brand">+7.1%</p></div>
                       <div className="text-center"><p className="text-xs font-black text-slate-400">JUL</p><p className="font-extrabold text-brand">+2.8%</p></div>
                    </div>
                  </div>
                </Card>
              </div>
            </motion.section>
          )}

          {activeTab === 'census' && (
            <motion.section key="census" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: .18 }} className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-5 space-y-6">
                  <Card title="Bulk Import / Paste" subtitle="Copy from Excel or text and paste here for easy upload.">
                    <div className="space-y-4">
                      <div className="bg-[#fcfdfe] border border-[#d6deeb] rounded-2xl p-4">
                        <label className="block text-[10px] font-black uppercase text-brand tracking-widest mb-3 italic">Preferred Format: Resident Listing Report</label>
                        <p className="text-xs text-slate-500 leading-relaxed mb-4">
                          Select and copy the resident rows from your report and paste them here. <br />
                          The parser automatically extracts <span className="font-bold text-slate-700">Names, MRNs, Age, Locations, Physicians,</span> and <span className="font-bold text-slate-700">Diagnosis</span>.
                        </p>
                        <textarea 
                          className="w-full h-48 px-4 py-3 bg-white rounded-xl border border-[#d6deeb] shadow-inner focus:ring-2 focus:ring-brand-2/20 outline-none text-sm font-medium resize-none"
                          placeholder="Paste Resident Listing Report data here..."
                          value={censusPasteText}
                          onChange={e => setCensusPasteText(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-3 px-1">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${censusSkipDuplicates ? 'bg-brand border-brand' : 'bg-white border-slate-300 group-hover:border-brand'}`}>
                            {censusSkipDuplicates && <CheckSquare size={14} className="text-white" />}
                            <input 
                              type="checkbox" 
                              className="hidden" 
                              checked={censusSkipDuplicates} 
                              onChange={() => setCensusSkipDuplicates(!censusSkipDuplicates)} 
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-600">Skip Existing Residents</span>
                        </label>
                      </div>
                      <div className="flex gap-3">
                        <Button className="flex-1 gap-2" onClick={handleParseCensus} disabled={isParsing}>
                          {isParsing ? <div className="loading-spinner w-4 h-4 border-2 border-white/30 border-t-white" /> : <ClipboardPaste size={18} />} 
                          Parse & Preview
                        </Button>
                        <Button variant="secondary" onClick={() => { setCensusPasteText(''); setParsedResidentsPreview([]); }}>Clear</Button>
                      </div>
                    </div>
                  </Card>

                  {parsedResidentsPreview.length > 0 && (
                    <Card title="Preview Upload" subtitle="Review parsed data before final submission." className="border-brand-2 ring-2 ring-brand-2/10">
                      <div className="max-h-[400px] overflow-y-auto page-scrollbar rounded-xl border border-[#d6deeb] mb-4 shadow-inner">
                         <table className="w-full text-left">
                            <thead className="bg-[#f8fbff] text-[10px] font-black uppercase text-[#0b2a6f] sticky top-0 z-10">
                               <tr>
                                  <th className="px-4 py-3 border-b border-[#d6deeb]">Resident Name</th>
                                  <th className="px-4 py-3 border-b border-[#d6deeb]">MRN</th>
                                  <th className="px-4 py-3 border-b border-[#d6deeb]">Age</th>
                                  <th className="px-4 py-3 border-b border-[#d6deeb]">Unit / Room</th>
                                  <th className="px-4 py-3 border-b border-[#d6deeb]">Physician</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-[#d6deeb] text-xs">
                               {parsedResidentsPreview.map((r, i) => (
                                 <tr key={i} className="bg-white hover:bg-brand-light/20 transition-colors">
                                    <td className="px-4 py-3">
                                      <p className="font-extrabold text-slate-900">{r.name}</p>
                                      <p className="text-[10px] opacity-60 uppercase">{r.sex}</p>
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 font-mono">{r.mrn}</td>
                                    <td className="px-4 py-3 font-bold">{r.age}</td>
                                    <td className="px-4 py-3">
                                      <p className="font-medium text-slate-600">{r.unit}</p>
                                      <p className="text-[10px] font-black bg-slate-100 inline-block px-1 rounded">{r.roomNumber}</p>
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 italic">{r.doctor}</td>
                                 </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-brand-light/30 rounded-xl mb-4 text-xs font-bold text-brand">
                        <span>{parsedResidentsPreview.length} records ready for import</span>
                        <CheckSquare size={16} />
                      </div>
                      <Button className="w-full gap-2" onClick={handleSaveCensus}><Save size={18} /> Confirm & Save to Registry</Button>
                    </Card>
                  )}
                </div>

                <div className="xl:col-span-7">
                  <Card title="Active Patient Census" subtitle="Current resident directory for auto-complete systems.">
                    <div className="mb-6">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="text"
                          placeholder="Search census by name or MRN..."
                          className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-[#d6deeb] rounded-2xl focus:ring-2 focus:ring-brand-2/20 outline-none transition-all font-medium text-sm"
                          value={censusSearchQuery}
                          onChange={(e) => setCensusSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-[#f8fbff] border-y border-[#d6deeb] text-[10px] font-black uppercase text-slate-500">
                          <tr>
                            <th className="px-6 py-4">Resident Info</th>
                            <th className="px-6 py-4">Unit / Room</th>
                            <th className="px-6 py-4">Clinical Data</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#d6deeb]">
                          {residents
                            .filter(r => 
                              r.name.toLowerCase().includes(censusSearchQuery.toLowerCase()) || 
                              r.mrn.toLowerCase().includes(censusSearchQuery.toLowerCase())
                            )
                            .map(res => (
                            <tr key={res.id} className="hover:bg-brand-light/30 transition-colors group">
                              <td className="px-6 py-4">
                                <p className="font-black text-slate-900 leading-tight">{res.name}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">MRN: <span className="font-mono">{res.mrn}</span> • {res.sex === 'M' ? 'Male' : 'Female'} • Age {res.age}</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm text-slate-600 font-medium italic">{res.unit}</p>
                                <span className="px-3 py-1 bg-white border border-[#d6deeb] rounded-lg text-[11px] font-black shadow-sm mt-1 inline-block">{res.roomNumber}</span>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-xs text-slate-700 font-bold">{res.doctor}</p>
                                <p className="text-[10px] text-slate-500 truncate max-w-[150px]" title={res.diagnosis}>{res.diagnosis}</p>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => {
                                      setSelectedResident(res);
                                      setIsResidentDetailOpen(true);
                                    }}
                                    className="p-2 hover:bg-brand-light rounded-lg text-brand transition-colors" 
                                    title="View Detailed Profile"
                                  >
                                    <User size={16} />
                                  </button>
                                  <button onClick={() => deleteResident(res.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors" title="Delete Resident"><Trash2 size={16} /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {residents.length === 0 && (
                            <tr>
                              <td colSpan={4} className="py-20 text-center">
                                <Users size={40} className="mx-auto mb-3 opacity-20" />
                                <p className="font-extrabold text-slate-400">Registry is currently empty</p>
                                <p className="text-xs text-slate-400 mt-1">Upload data on the left to begin.</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      <span>Database: {residents.length || 0} Total Records</span>
                      <span>v1.2 Secure Ledger</span>
                    </div>
                  </Card>
                </div>
              </div>
            </motion.section>
          )}
          {activeTab === 'help' && (
            <motion.section key="help" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: .18 }} className="space-y-6 pb-20">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                 <Card title="User Guide" subtitle="How to navigate the Appointment Tracker">
                    <div className="space-y-6">
                       <div className="flex gap-4">
                          <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand font-black shrink-0">1</div>
                          <div>
                             <p className="font-black text-slate-900">Manage Appointments</p>
                             <p className="text-sm text-slate-500 mt-1">Use the Dashboard or Appointments tab to view scheduled visits. Click "Add Appointment" to create a new record including resident details, location, and transport needs.</p>
                          </div>
                       </div>
                       <div className="flex gap-4">
                          <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand font-black shrink-0">2</div>
                          <div>
                             <p className="font-black text-slate-900">Generate Visit Forms</p>
                             <p className="text-sm text-slate-500 mt-1">In the consolidated log, click the download icon on any record to instantly produce a visit form PDF. This contains all clinical and contact info for the provider.</p>
                          </div>
                       </div>
                       <div className="flex gap-4">
                          <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand font-black shrink-0">3</div>
                          <div>
                             <p className="font-black text-slate-900">Bulk Census Import</p>
                             <p className="text-sm text-slate-500 mt-1">Visit the Census tab to paste a resident listing report. The system parses names, ages, and unit info automatically to keep your registry in sync.</p>
                          </div>
                       </div>
                    </div>
                 </Card>

                 <Card title="Version History" subtitle="Recent updates and system changes">
                    <div className="space-y-5">
                       <div className="border-l-2 border-brand-2 pl-4 py-1">
                          <div className="flex items-center gap-2 mb-1">
                             <span className="text-xs font-black bg-brand-2/10 text-brand-2 px-2 py-0.5 rounded">v1.5.0</span>
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">LATEST</span>
                          </div>
                          <p className="text-sm font-black text-slate-800">Cloudflare Migration & D1 Integration</p>
                          <ul className="text-xs text-slate-500 mt-2 space-y-1 list-disc ml-4">
                             <li>Switched to high-performance Cloudflare D1 database</li>
                             <li>Migrated backend to Cloudflare Workers API</li>
                             <li>Renamed "Reason" field to "Description of Need"</li>
                             <li>Updated Location fields for better address support</li>
                          </ul>
                       </div>
                       <div className="border-l-2 border-slate-200 pl-4 py-1">
                          <div className="flex items-center gap-2 mb-1">
                             <span className="text-xs font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded">v1.4.0</span>
                          </div>
                          <p className="text-sm font-bold text-slate-700">Report Builder & Analytics</p>
                          <p className="text-xs text-slate-500 mt-1">Added custom date-range report generation and specialty trends visualization.</p>
                       </div>
                    </div>
                 </Card>
              </div>
            </motion.section>
          )}

        </AnimatePresence>
      </main>

      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 18 }} className="relative w-full max-w-4xl bg-[#f8fbff] rounded-3xl shadow-2xl overflow-hidden border border-[#d6deeb] max-h-[90vh] flex flex-col">
              <div className="transport-gradient text-white p-5 shrink-0 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black tracking-tight">{editingId ? 'Modify Record' : 'New Appointment Request'}</h3>
                  <p className="text-xs opacity-85 mt-0.5">Comprehensive entry for clinical and transport tracking.</p>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-white/15 rounded-full" aria-label="Close modal"><X size={20} /></button>
              </div>

              <div className="p-6 overflow-y-auto page-scrollbar space-y-8 flex-1">
                {/* Origins Section */}
                <section>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Origin of Appointment" info="e.g., MD Order / Family / Hospital / Specialist">
                      <input 
                        type="text" 
                        value={newAppt.origin} 
                        onChange={e => setNewAppt({...newAppt, origin: e.target.value})} 
                        className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white" 
                        placeholder="e.g., MD Order" 
                      />
                    </FormField>
                    <FormField label="Resident Name *" info="Last, First">
                      <div className="relative">
                        <input 
                          type="text" 
                          value={newAppt.residentName} 
                          onChange={e => handleResidentInputChange(e.target.value)} 
                          onFocus={() => setShowResidentSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowResidentSuggestions(false), 200)}
                          className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white" 
                          placeholder="Search census..." 
                        />
                        {showResidentSuggestions && (residentSearchTerm || newAppt.residentName) && filteredResidents.length > 0 && (
                          <div className="absolute z-60 w-full mt-2 bg-white border border-[#d6deeb] rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                            {filteredResidents.map(r => (
                              <button
                                key={r.id}
                                type="button"
                                className="w-full px-4 py-3 text-left hover:bg-brand-light/30 border-b border-[#f0f4f8] last:border-0 transition-colors"
                                onClick={() => {
                                  handleSelectResident(r);
                                  setResidentSearchTerm('');
                                  setShowResidentSuggestions(false);
                                }}
                              >
                                <p className="font-black text-slate-800 text-sm">{r.name}</p>
                                <p className="text-[10px] text-slate-500">MRN: {r.mrn} • {r.unit} • {r.roomNumber}</p>
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
                        onChange={e => setNewAppt({...newAppt, unit: e.target.value})} 
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
                        onChange={e => setNewAppt({...newAppt, roomNumber: e.target.value})} 
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
                        onChange={e => setNewAppt({...newAppt, providerName: e.target.value})} 
                        className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-soft-bg/30" 
                        placeholder="e.g., Dr. Smith" 
                      />
                    </FormField>
                    <FormField label="Location Name / Address">
                      <input 
                        type="text" 
                        value={newAppt.location} 
                        onChange={e => setNewAppt({...newAppt, location: e.target.value})} 
                        className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-soft-bg/30" 
                        placeholder="Clinic / Hospital / Address" 
                      />
                    </FormField>
                    <FormField label="Contact Number">
                      <input 
                        type="text" 
                        value={newAppt.contactNumber} 
                        onChange={e => setNewAppt({...newAppt, contactNumber: e.target.value})} 
                        className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-soft-bg/30" 
                        placeholder="(###) ###-####" 
                      />
                    </FormField>
                  </div>
                </section>

                {/* Dates & Status Section */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField label="Transport Scheduling">
                    <input type="date" value={newAppt.schedulingDate} onChange={e => setNewAppt({...newAppt, schedulingDate: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white" />
                  </FormField>
                  <FormField label="Date of Referral">
                    <input type="date" value={newAppt.referralDate} onChange={e => setNewAppt({...newAppt, referralDate: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white" />
                  </FormField>
                  <FormField label="Appointment Due By">
                    <input type="date" value={newAppt.dueDate} onChange={e => setNewAppt({...newAppt, dueDate: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white" />
                  </FormField>
                  <FormField label="Status">
                    <select value={newAppt.status} onChange={e => setNewAppt({...newAppt, status: e.target.value as any})} className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white appearance-none">
                      <option value="Scheduled">Scheduled</option>
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </FormField>
                </section>

                {/* Detailed Timing Section */}
                <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField label="Date of Appt">
                    <input type="date" value={newAppt.date} onChange={e => setNewAppt({...newAppt, date: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white" />
                  </FormField>
                  <FormField label="Time of Appt">
                    <input type="time" value={newAppt.time} onChange={e => setNewAppt({...newAppt, time: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white" />
                  </FormField>
                  <FormField label="Pick Up Time">
                    <input type="time" value={newAppt.pickUpTime} onChange={e => setNewAppt({...newAppt, pickUpTime: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white" />
                  </FormField>
                </section>

                {/* Specialty & Service info */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Appt. Type (Specialty)">
                      <select value={newAppt.type} onChange={e => setNewAppt({...newAppt, type: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white appearance-none">
                        <option value="">— Select Specialty —</option>
                        <option value="Cardiology">Cardiology</option>
                        <option value="Dermatology">Dermatology</option>
                        <option value="Orthopedic">Orthopedic</option>
                        <option value="Specialist">Other Specialist</option>
                      </select>
                    </FormField>
                    <FormField label="Visit Category">
                      <select value={newAppt.description} onChange={e => setNewAppt({...newAppt, description: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white appearance-none">
                        <option value="">— Select Category —</option>
                        <option value="Follow-up">Follow-up</option>
                        <option value="Initial Eval">Initial Eval</option>
                        <option value="Procedure">Procedure</option>
                      </select>
                    </FormField>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Service In House?">
                      <select value={newAppt.serviceInHouse} onChange={e => setNewAppt({...newAppt, serviceInHouse: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white appearance-none">
                          <option value="">—</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                      </select>
                    </FormField>
                    <FormField label="Description">
                      <input type="text" value={newAppt.reasonSendOut} onChange={e => setNewAppt({...newAppt, reasonSendOut: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white" placeholder="Provider unavailable" />
                    </FormField>
                  </div>
                </section>

                {/* Transport Section */}
                <section className="bg-brand-light/30 border border-brand/10 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-5 text-brand font-black text-xs uppercase tracking-wider">
                    <Database size={16} /> Transport & Logistics
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <FormField label="Type of Transport">
                      <select value={newAppt.transportType} onChange={e => setNewAppt({...newAppt, transportType: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white appearance-none">
                        <option value="">— Select —</option>
                        <option value="Facility Van">Facility Van</option>
                        <option value="Ambulance">Ambulance</option>
                        <option value="Lyft/Uber">Lyft/Uber</option>
                      </select>
                    </FormField>
                    <FormField label="Transport Company">
                      <input type="text" value={newAppt.transportCompany} onChange={e => setNewAppt({...newAppt, transportCompany: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white" placeholder="Vendor name" />
                    </FormField>
                    <FormField label="Payer for Ride">
                      <select value={newAppt.payerForRide} onChange={e => setNewAppt({...newAppt, payerForRide: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white appearance-none">
                        <option value="">— Select —</option>
                        <option value="Medicare">Medicare</option>
                        <option value="Facility">Facility</option>
                        <option value="Resident">Resident</option>
                      </select>
                    </FormField>
                    <FormField label="Round Trip?">
                        <select value={newAppt.roundTrip} onChange={e => setNewAppt({...newAppt, roundTrip: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white appearance-none">
                            <option value="">—</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </FormField>
                    <FormField label="Escort?">
                        <select value={newAppt.escort} onChange={e => setNewAppt({...newAppt, escort: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white appearance-none">
                            <option value="">—</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </FormField>
                  </div>
                </section>

                <FormField label="Notes / Other">
                   <textarea value={newAppt.notes} onChange={e => setNewAppt({...newAppt, notes: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-[#d6deeb] focus:ring-2 focus:ring-brand-2/20 focus:border-brand outline-none transition-all bg-white min-h-[100px]" placeholder="Add any relevant details..." />
                </FormField>
              </div>

              <div className="p-6 border-t border-[#d6deeb] bg-white flex items-center justify-between shrink-0">
                <div>
                  {editingId && (
                    <Button variant="danger" size="sm" onClick={() => { if(confirm('Delete this record?')) { deleteAppointment(editingId); setIsAddModalOpen(false); } }}>Delete Record</Button>
                  )}
                </div>
                <div>
                  <Button variant="secondary" className="mr-3" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                  <Button onClick={handleSaveAppointment}>{editingId ? 'Update Appointment Record' : 'Save Appointment Record'}</Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isResidentDetailOpen && selectedResident && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsResidentDetailOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 18 }} className="relative w-full max-w-4xl bg-[#f8fbff] rounded-3xl shadow-2xl overflow-hidden border border-[#d6deeb] max-h-[90vh] flex flex-col">
              <div className="transport-gradient text-white p-5 shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white border border-white/30 backdrop-blur-md">
                    <User size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">{selectedResident.name}</h3>
                    <p className="text-xs opacity-85 mt-0.5">Resident ID: <span className="font-mono">{selectedResident.mrn}</span> • Room {selectedResident.roomNumber}</p>
                  </div>
                </div>
                <button onClick={() => setIsResidentDetailOpen(false)} className="p-2 hover:bg-white/15 rounded-full" aria-label="Close modal"><X size={20} /></button>
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
                    <DetailItem label="Admission Date" value={selectedResident.admissionDate} />
                    <DetailItem label="Primary Doctor" value={selectedResident.doctor} />
                    <DetailItem label="Location" value={`${selectedResident.floor} • ${selectedResident.unit}`} />
                    <DetailItem label="Room Number" value={selectedResident.roomNumber} />
                  </div>
                </section>

                {/* Clinical Summary */}
                <section className="bg-white border border-[#d6deeb] rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 text-[#0b2a6f] font-black text-xs uppercase tracking-wider">
                    <Activity size={16} /> Clinical Profile
                  </div>
                  <div className="space-y-4">
                     <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Primary Diagnosis</p>
                        <p className="text-sm font-bold text-slate-800 bg-brand-light/20 p-3 rounded-xl border border-brand/5">{selectedResident.diagnosis}</p>
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Allergies</p>
                        <p className={`text-sm font-bold p-3 rounded-xl border ${selectedResident.allergies.toLowerCase() === 'no known allergies' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                          {selectedResident.allergies}
                        </p>
                     </div>
                     {selectedResident.notes && (
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Medical Brief / Notes</p>
                          <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap">{selectedResident.notes}</p>
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
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map(apt => (
                          <div key={apt.id} className="bg-white border border-[#d6deeb] rounded-2xl p-4 flex items-center justify-between hover:border-brand/30 transition-all group">
                            <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-xl ${apt.status === 'Completed' ? 'bg-green-100 text-green-600' : 'bg-brand-light text-brand'}`}>
                                <Clock size={18} />
                              </div>
                              <div>
                                <p className="font-black text-slate-800">{apt.type}</p>
                                <p className="text-xs text-slate-500">{formatFullDate(apt.date)} at {apt.time}</p>
                                <p className="text-[10px] font-medium text-slate-400 mt-0.5">{apt.providerName} • {apt.location}</p>
                              </div>
                            </div>
                              <div className="text-right">
                               <div className="flex items-center gap-2 justify-end">
                                 <button 
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     generateAppointmentPDF(apt, selectedResident);
                                   }}
                                   className="p-1.5 hover:bg-brand-light rounded-lg text-brand transition-colors"
                                   title="Download Forms"
                                 >
                                   <FileDown size={14} />
                                 </button>
                                 <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                                   apt.status === 'Completed' ? 'bg-green-100 text-green-600' : 
                                   apt.status === 'Cancelled' ? 'bg-red-100 text-red-600' :
                                   'bg-brand-light text-brand'
                                 }`}>
                                   {apt.status}
                                 </span>
                               </div>
                               {apt.notes && <p className="text-[10px] text-slate-400 mt-1 italic truncate max-w-[150px]">"{apt.notes}"</p>}
                            </div>
                          </div>
                        ))
                     ) : (
                        <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                           <p className="text-slate-400 font-bold text-sm">No appointment records found for this resident.</p>
                        </div>
                     )}
                  </div>
                </section>
              </div>

              <div className="p-5 border-t border-[#d6deeb] bg-[rgba(11,42,111,.03)] shrink-0 flex justify-end">
                <Button variant="secondary" onClick={() => setIsResidentDetailOpen(false)}>Close Detailed View</Button>
              </div>
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
      aria-current={active ? 'page' : undefined}
      className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group text-left
        ${active ? 'bg-gradient-to-br from-brand to-brand-2 text-white shadow-[0_10px_26px_rgba(11,42,111,.18)]' : 'text-slate-500 hover:bg-brand-light/70 hover:text-brand'}
      `}
    >
      <span className={`${active ? 'text-white' : 'text-slate-400 group-hover:text-brand'}`}>{icon}</span>
      <span className="font-black text-sm tracking-tight">{label}</span>
      {active && <motion.div layoutId="nav-active" className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
    </button>
  );
}

function TopTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-black transition-all ${active ? 'bg-gradient-to-br from-brand to-brand-2 text-white shadow-[0_6px_16px_rgba(11,42,111,.16)]' : 'text-slate-600 hover:bg-brand-light hover:text-brand'}`}
    >
      {label}
    </button>
  );
}

function StatCard({ label, value, hint, icon, onClick }: { label: string; value: string; hint: string; icon: ReactNode; onClick?: () => void }) {
  return (
    <div 
      className={`bg-white p-5 rounded-2xl border border-[#d6deeb] shadow-[0_6px_16px_rgba(11,42,111,.10)] transition-all ${onClick ? 'cursor-pointer hover:border-brand/30 hover:shadow-[0_10px_26px_rgba(11,42,111,.15)]' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-slate-500 text-xs font-black uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-black text-brand leading-tight mt-2">{value}</p>
          <p className="text-[11px] text-slate-500 font-bold mt-2">{hint}</p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-brand-light flex items-center justify-center text-brand border border-brand/10">{icon}</div>
      </div>
    </div>
  );
}

function AppointmentItem({ appointment, residents, doctorName, onClick }: { appointment: Appointment; residents: Resident[]; doctorName: string; key?: string; onClick?: () => void }) {
  const date = new Date(appointment.date);
  return (
    <div onClick={onClick} className="flex items-start gap-4 p-4 rounded-2xl border border-[#d6deeb] bg-white hover:border-brand-light/40 hover:bg-white transition-all hover:shadow-[0_10px_26px_rgba(11,42,111,.08)] group cursor-pointer relative overflow-hidden">
      <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            const res = residents.find(r => r.name === appointment.residentName);
            generateAppointmentPDF(appointment, res);
          }}
          className="p-2 bg-brand-light text-brand rounded-xl hover:bg-brand hover:text-white transition-all shadow-sm"
          title="Download Visit Form"
        >
          <FileDown size={14} />
        </button>
      </div>
      <DateBadge date={date} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h4 className="font-black text-slate-900 truncate">{appointment.residentName}</h4>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{appointment.time}</span>
        </div>
        <p className="text-sm text-slate-500 truncate mb-1">{appointment.type} • {doctorName}</p>
        <span className="inline-flex items-center gap-1 text-[10px] font-black text-brand uppercase tracking-wider rounded-full bg-brand-light px-2 py-1">
          <Clock size={10} /> {appointment.transportType}
        </span>
      </div>
      <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight size={20} className="text-brand" /></div>
    </div>
  );
}

function WideAppointmentTable({ appointments, residents, onEdit, selectedColumns }: { appointments: Appointment[]; residents: Resident[]; onEdit: (apt: Appointment) => void; selectedColumns?: string[] }) {
  const showColumn = (col: string) => !selectedColumns || selectedColumns.includes(col);

  return (
    <div className="overflow-x-auto rounded-xl border border-[#d6deeb] bg-white shadow-sm">
      <table className="w-full text-left border-collapse min-w-[1400px]">
        <thead className="bg-[#0b2a6f] text-white text-[10px] font-black uppercase tracking-wider sticky top-0 z-20">
          <tr>
            <th className="px-3 py-4 border-r border-white/10 text-center w-12">Select</th>
            {showColumn('Resident Name') && <th className="px-4 py-4 border-r border-white/10">Resident</th>}
            {(showColumn('Unit') || showColumn('Room #')) && <th className="px-4 py-4 border-r border-white/10">Unit/Room</th>}
            {showColumn('Origin') && <th className="px-4 py-4 border-r border-white/10">Origin</th>}
            {showColumn('Specialty') && <th className="px-4 py-4 border-r border-white/10">Specialty</th>}
            <th className="px-4 py-4 border-r border-white/10">Description</th>
            {showColumn('Provider') && <th className="px-4 py-4 border-r border-white/10 min-w-[200px]">Location Details</th>}
            {showColumn('Date') && <th className="px-4 py-4 border-r border-white/10 whitespace-nowrap">Appt Date</th>}
            {showColumn('Time') && <th className="px-4 py-4 border-r border-white/10 whitespace-nowrap">Appt Time</th>}
            <th className="px-4 py-4 border-r border-white/10 whitespace-nowrap">Pick Up</th>
            <th className="px-4 py-4 border-r border-white/10 whitespace-nowrap">Due By</th>
            {showColumn('Status') && <th className="px-4 py-4 border-r border-white/10">Status</th>}
            {showColumn('Transport') && <th className="px-4 py-4 border-r border-white/10">Transport</th>}
            <th className="px-4 py-4 border-r border-white/10">Form</th>
            {showColumn('Payer') && <th className="px-4 py-4 border-r border-white/10">Payer</th>}
            <th className="px-4 py-4 border-r border-white/10">Round Trip</th>
            <th className="px-4 py-4 border-r border-white/10">Escort</th>
            {showColumn('Notes') && <th className="px-4 py-4">Notes</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#d6deeb]">
          {appointments.map((apt) => (
            <tr 
              key={apt.id} 
              className="group hover:bg-brand-light/30 transition-colors cursor-pointer text-[11px] font-medium text-slate-700"
              onClick={() => onEdit(apt)}
            >
              <td className="px-3 py-4 text-center border-r border-[#d6deeb]">
                <div className="w-4 h-4 rounded-full border-2 border-slate-300 mx-auto group-hover:border-brand" />
              </td>
              {showColumn('Resident Name') && <td className="px-4 py-4 border-r border-[#d6deeb] font-black uppercase text-slate-900">{apt.residentName}</td>}
              {(showColumn('Unit') || showColumn('Room #')) && (
                <td className="px-4 py-4 border-r border-[#d6deeb] font-bold">
                  {showColumn('Unit') && apt.unit} {showColumn('Unit') && showColumn('Room #') && '/'} {showColumn('Room #') && apt.roomNumber}
                </td>
              )}
              {showColumn('Origin') && <td className="px-4 py-4 border-r border-[#d6deeb]">{apt.origin || '—'}</td>}
              {showColumn('Specialty') && <td className="px-4 py-4 border-r border-[#d6deeb]">{apt.type}</td>}
              <td className="px-4 py-4 border-r border-[#d6deeb] max-w-[150px] truncate" title={apt.description}>{apt.description}</td>
              {showColumn('Provider') && (
                <td className="px-4 py-4 border-r border-[#d6deeb]">
                  <div className="font-bold text-slate-800">{apt.providerName || apt.location}</div>
                  <div className="text-[10px] opacity-70">{apt.contactNumber}</div>
                </td>
              )}
              {showColumn('Date') && <td className="px-4 py-4 border-r border-[#d6deeb] whitespace-nowrap">{apt.date}</td>}
              {showColumn('Time') && <td className="px-4 py-4 border-r border-[#d6deeb]">{apt.time}</td>}
              <td className="px-4 py-4 border-r border-[#d6deeb]">{apt.pickUpTime || '—'}</td>
              <td className="px-4 py-4 border-r border-[#d6deeb] whitespace-nowrap">{apt.dueDate || '—'}</td>
              {showColumn('Status') && (
                <td className="px-4 py-4 border-r border-[#d6deeb]">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border ${
                    apt.status === 'Scheduled' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                    apt.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    apt.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-100' :
                    'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    {apt.status}
                  </span>
                </td>
              )}
              {showColumn('Transport') && <td className="px-4 py-4 border-r border-[#d6deeb] font-bold">{apt.transportType}</td>}
              <td className="px-4 py-4 border-r border-[#d6deeb]">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const resident = residents.find(r => r.name === apt.residentName);
                    generateAppointmentPDF(apt, resident);
                  }}
                  className="p-2 hover:bg-brand-light rounded-lg text-brand transition-colors"
                  title="Generate Visit Form"
                >
                  <FileDown size={18} />
                </button>
              </td>
              {showColumn('Payer') && <td className="px-4 py-4 border-r border-[#d6deeb]">{apt.payerForRide}</td>}
              <td className="px-4 py-4 border-r border-[#d6deeb]">{apt.roundTrip}</td>
              <td className="px-4 py-4 border-r border-[#d6deeb]">{apt.escort}</td>
              {showColumn('Notes') && <td className="px-4 py-4 max-w-[200px] truncate italic text-slate-500" title={apt.notes}>{apt.notes}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AppointmenttLogRow({ appointment, doctorName, compact = false, onClick }: { appointment: Appointment; doctorName: string; compact?: boolean; key?: string; onClick?: () => void }) {
  const date = new Date(appointment.date);
  const statusClass = appointment.status === 'Scheduled'
    ? 'bg-blue-50 text-blue-700 border-blue-100'
    : appointment.status === 'Completed'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
      : appointment.status === 'Cancelled'
        ? 'bg-red-50 text-red-700 border-red-100'
        : 'bg-amber-50 text-amber-700 border-amber-100';

  return (
    <div onClick={onClick} className={`flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-2xl border border-[#d6deeb] bg-white hover:border-brand/30 hover:bg-brand-light/10 transition-all gap-4 group cursor-pointer ${compact ? '' : 'hover:shadow-[0_10px_26px_rgba(11,42,111,.10)]'}`}>
      <div className="flex items-center gap-4 min-w-0">
        <DateBadge date={date} small />
        <div className="min-w-0">
          <h4 className="font-black text-slate-900 truncate">{appointment.residentName}</h4>
          <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
            <span className="font-bold text-brand uppercase tracking-tighter text-[10px]">{appointment.type}</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1"><Clock size={12} /> {appointment.time}</span>
            <span>•</span>
            <span>{doctorName}</span>
          </p>
          {(appointment.description || appointment.notes) && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2 italic opacity-80">
              {appointment.description && `${appointment.description}${appointment.notes ? ': ' : ''}`}
              {appointment.notes}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 md:self-center">
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusClass}`}>{appointment.status}</span>
        <button className="p-2 hover:bg-brand-light rounded-full text-slate-400 hover:text-brand" aria-label="Open appointment"><ChevronRight size={18} /></button>
      </div>
    </div>
  );
}

function DateBadge({ date, small = false }: { date: Date; small?: boolean }) {
  const isValid = !isNaN(date.getTime());
  return (
    <div className={`${small ? 'w-12 h-12' : 'w-14 h-14'} bg-white rounded-2xl flex flex-col items-center justify-center border border-[#d6deeb] shadow-[0_4px_12px_rgba(11,42,111,.08)] flex-shrink-0`}>
      <span className="text-[10px] uppercase font-black text-brand leading-none mb-1">{isValid ? date.toLocaleString('default', { month: 'short' }) : '—'}</span>
      <span className={`${small ? 'text-lg' : 'text-xl'} font-black leading-none text-slate-900`}>{isValid ? date.getDate() : '—'}</span>
    </div>
  );
}

function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="py-12 px-4 flex flex-col items-center justify-center text-center text-slate-400 bg-[rgba(11,42,111,.03)] rounded-2xl border-2 border-dashed border-[#d6deeb]">
      <div className="mb-4 opacity-40 text-brand">{icon}</div>
      <p className="font-black text-slate-700">{title}</p>
      <p className="text-sm text-slate-500 mt-1 max-w-md">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function FormField({ label, info, children }: { label: string; info?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 px-1">
        <label className="block text-sm font-extrabold text-[#0b2a6f]">{label}</label>
        {info && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{info}</span>}
      </div>
      {children}
    </div>
  );
}

function formatFullDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-[#d6deeb] p-3 rounded-xl shadow-sm">
      <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">{label}</p>
      <p className="text-sm font-black text-slate-800">{value}</p>
    </div>
  );
}

function formatShortDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
