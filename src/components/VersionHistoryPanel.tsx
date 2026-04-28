import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, History, Workflow, FileText, CheckCircle2 } from "lucide-react";

interface VersionEntry {
  version: string;
  releaseDate: string;
  title: string;
  summary: string;
  capabilities: string[];
  processFlow: string[];
  userImpact: string[];
  adminOnly?: boolean;
}

interface VersionHistoryPanelProps {
  currentUserRole?: string | null;
}

const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "2.0.0",
    releaseDate: "2026-04-27",
    title: "V2 Reporting, Calendar Print, and Resident Summary Release",
    summary:
      "This version completes the V2 operational reporting layer with filtered reports, survey-ready PDF and CSV export, printable week/month calendar views, full-width dashboard calendar, and resident-level appointment summary printing.",
    capabilities: [
      "V2 Reporting Engine with filters for date range, unit, resident status, specialty, and transportation company.",
      "Role-aware reporting dashboard with additional administrative metrics for missing transport phone, escort required, and cancelled/deferred visits.",
      "Filtered CSV export for appointment data review and QAPI analysis.",
      "Survey-ready PDF export with summary metrics, specialty utilization, transportation utilization, appointment line listing, and resident appointment history.",
      "Calendar print tools for Week and Month views using a structured print layout instead of a screen capture.",
      "Dashboard calendar expanded to full-width display with Quick Actions and Daily Health Tips removed for a cleaner operational view.",
      "Resident Detail appointment history converted to a table format for easier review.",
      "Resident Appointment Summary print options added for All, Historical, and Future appointments.",
      "Resident summary print excludes transport and escort information by design to keep the report clinically focused.",
    ],
    processFlow: [
      "Open Dashboard to review the larger full-width calendar and print Week or Month calendar views when needed.",
      "Open Reports to apply date, unit, resident status, specialty, or transportation filters.",
      "Export filtered appointment results to CSV for spreadsheet/QAPI review.",
      "Export filtered appointment results to survey-ready PDF for leadership, compliance, and operational review.",
      "Open Patient Census, select a resident, and review the appointment history table.",
      "Use Print All, Print History, or Print Future to generate a resident-specific appointment summary.",
    ],
    userImpact: [
      "Improves daily appointment visibility by giving the calendar more space and removing nonessential dashboard panels.",
      "Makes reports more useful for DON/ADON review, QAPI discussion, and survey preparation.",
      "Allows resident-specific appointment history to be printed quickly without unrelated transport or escort details.",
      "Improves readability of appointment history by replacing card-style history with a table format.",
      "Provides a clean Version 2 baseline for future audit log and activity tracking enhancements.",
    ],
  },
  {
    version: "1.1.1",
    releaseDate: "2026-04-27",
    title: "Shared Transportation Directory and Appointment Output Update",
    summary:
      "This version completes the shared transportation directory workflow, connects transport auto-fill to the New Appointment Request modal, updates consult form wording, improves PDF time/contact output, and documents the user workflow before Version 2 work begins.",
    capabilities: [
      "Shared Transportation Directory stored in D1 so transport records are available to all authorized users.",
      "New Appointment Request loads transportation companies from the shared directory.",
      "Selecting a transportation company auto-populates company name and contact phone number.",
      "Others option supports manual transportation company entry when the company is not yet in the directory.",
      "Escort phone number and transportation phone number are saved with the appointment record.",
      "Checklist PDF and Transport Calendar PDF display AM/PM time formatting and transportation contact details.",
      "Regular Consult form now uses Visit Category and Reason for Consultation (Notes), with fallback to Consult Reason (Admin).",
    ],
    processFlow: [
      "Staff or admin opens Directory and adds or updates transportation company contact details.",
      "Staff creates a New Appointment Request and selects a transportation company from the directory.",
      "The appointment form auto-populates transportation phone details from the shared database.",
      "Staff enters escort name/phone when available and saves the appointment.",
      "Generated Checklist and Transport Calendar PDFs pull the saved transport and escort details into the output.",
      "Consult forms prioritize the entered consultation note and use admin consult reason only as fallback.",
    ],
    userImpact: [
      "Reduces repeated typing and inconsistent transportation contact information.",
      "Makes transportation records shared across users instead of browser-only.",
      "Improves appointment packet clarity for nursing staff, transport coordination, and survey-ready review.",
      "Creates a stable baseline before starting Version 2 reporting and workflow upgrades.",
    ],
  },
  {
    version: "1.0.0",
    releaseDate: "2026-04-26",
    title: "Production Baseline (LOCKED)",
    summary:
      "This version establishes the system as production-ready with full validation, audit tracking, system safety, and operational monitoring. This baseline is locked and approved for real-world use.",
    capabilities: [
      "System-wide crash protection using Error Boundary to prevent blank screens.",
      "Frontend and backend validation for appointments, residents, and facilities.",
      "Server-side validation rejects invalid data before D1 database writes.",
      "Write boundary guard ensures only changed data is saved.",
      "Full audit tracking for appointments, residents, and census workflows.",
      "Audit Viewer with filtering, summary dashboard, and CSV export.",
      "Production Checklist dashboard with readiness indicators.",
      "Improved census import and replacement workflow with duplicate prevention.",
    ],
    processFlow: [
      "User enters or imports data through the interface.",
      "Data is validated on the frontend before submission.",
      "Write guard ensures only valid and changed data is sent to the API.",
      "Server validates incoming data before writing to D1.",
      "Audit logs capture all key actions locally for traceability.",
      "User reviews activity through Audit Viewer and Production Checklist.",
    ],
    userImpact: [
      "System is stable and protected from runtime crashes.",
      "Invalid or incomplete records are prevented from being saved.",
      "Staff actions are traceable for compliance and QAPI review.",
      "Database performance is improved by reducing unnecessary writes.",
      "Provides confidence for production use in clinical workflows.",
    ],
  },
  {
    version: "0.1.4",
    releaseDate: "Latest",
    title: "Census Duplicate Cleanup and Collapsible Unit Census",
    summary:
      "Added safer resident duplicate handling and a cleaner Active Patient Census view grouped by unit with collapsible sections and visible quick actions.",
    capabilities: [
      "Resident duplicate cleanup now uses MRN first, then resident name plus room number when MRN is unavailable.",
      "Duplicate resident entries are reduced during resident fetch, add, update, batch add, and census replacement workflows.",
      "Active Patient Census is grouped by unit to avoid one long continuous resident listing.",
      "Each unit section can be expanded or collapsed, with Expand All and Collapse All controls.",
      "View Details and Delete remain visible for each resident row inside the unit section.",
    ],
    processFlow: [
      "Open Patient Census.",
      "Review residents grouped under their unit or floor.",
      "Expand a unit to see residents assigned to that unit.",
      "Use search to find a resident, MRN, room, unit, or physician.",
      "Use View Details for resident appointment history or Delete when the resident should be removed from the active census.",
    ],
    userImpact: [
      "The census page is shorter and easier to review during daily workflow.",
      "Duplicate resident rows are less likely to appear after repeated census imports.",
      "Staff can find and manage residents faster without scrolling through a long list.",
      "The change was deployed using a clean build path without the old App patch workflow.",
    ],
  }
];

export function VersionHistoryPanel({ currentUserRole }: VersionHistoryPanelProps) {
  const visibleVersionHistory = VERSION_HISTORY;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-black text-slate-800">
        <History size={18} className="text-sky-700" /> Version History
      </div>

      <div className="mt-4 space-y-3">
        {visibleVersionHistory.map((entry) => (
          <details key={entry.version} className="rounded-2xl border border-slate-100 bg-slate-50 p-4" open={entry.version === "2.0.0"}>
            <summary className="cursor-pointer text-sm font-black text-slate-800">
              v{entry.version} — {entry.title}
            </summary>
            <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-600">{entry.summary}</p>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <VersionSection title="Capabilities" items={entry.capabilities} />
              <VersionSection title="Workflow" items={entry.processFlow} />
              <VersionSection title="User Impact" items={entry.userImpact} />
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

const VersionSection = ({ title, items }: { title: string; items: string[] }) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-3">
    <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-500">{title}</p>
    <ul className="space-y-2 text-xs font-semibold leading-relaxed text-slate-600">
      {items.map((item, index) => (
        <li key={`${title}-${index}`} className="flex gap-2">
          <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-600" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);
