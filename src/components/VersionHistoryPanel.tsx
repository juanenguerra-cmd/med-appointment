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
  const normalizedRole = String(currentUserRole || "").trim().toLowerCase();
  const isAdmin = normalizedRole === "admin";
  const visibleVersionHistory = VERSION_HISTORY;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-black text-slate-800">
        <History size={18} className="text-sky-700" /> Version History
      </div>

      <div className="mt-4 space-y-3">
        {visibleVersionHistory.map((entry) => (
          <details key={entry.version} className="rounded-2xl border border-slate-100 bg-slate-50 p-4" open={entry.version === "1.0.0"}>
            <summary className="cursor-pointer text-sm font-black text-slate-800">
              v{entry.version} — {entry.title}
            </summary>
            <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-600">{entry.summary}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
