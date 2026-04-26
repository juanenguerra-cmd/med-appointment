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
  },
  {
    version: "0.1.3",
    releaseDate: "Recovery Baseline",
    title: "Clean Build Recovery Baseline",
    summary:
      "Recovered the production build to a stable baseline and removed the unsafe automatic App patching workflow from the deployment path.",
    capabilities: [
      "Cloudflare build now runs the normal Vite build path.",
      "The old patch_app_controlled workflow is no longer used for production changes.",
      "Production deployment completed successfully after the App.tsx recovery.",
      "Future features are applied as small controlled file changes with build verification after each step.",
    ],
    processFlow: [
      "Return to the stable baseline.",
      "Verify that npm run build uses vite build only.",
      "Deploy the clean baseline.",
      "Apply future updates one feature at a time.",
    ],
    userImpact: [
      "The app is buildable again.",
      "Future updates are safer because the automated patch script is not part of the production build.",
      "Troubleshooting is easier because each change is isolated and verified.",
    ],
  },
  {
    version: "0.1.2",
    releaseDate: "Previous",
    title: "Admin Readiness, Version History, and User Guide Release",
    summary:
      "Added an in-app version history area, a PDF export for version history, and clearer guidance for using the web app from census import through report generation.",
    capabilities: [
      "Version history is visible inside Help & Info with the latest version shown first.",
      "Version history can be exported to PDF for binder, QAPI, or administrative review.",
      "User guide content is available in the app for appointment tracking and reporting workflow.",
      "Admin area supports audit log review and restore workflow for soft-deleted records when admin tools are enabled.",
    ],
    processFlow: [
      "Open Help & Info.",
      "Review the latest version summary and capability changes.",
      "Use the PDF button to generate a non-technical version history packet.",
      "Use the guide section to review how staff should track appointments and generate reports.",
    ],
    userImpact: [
      "Staff and leaders can understand what changed without reading technical code notes.",
      "The app can produce a printable history of capabilities and workflow changes.",
      "Deployment changes are easier to explain during review, training, or QAPI discussion.",
    ],
  },
  {
    version: "0.1.1",
    releaseDate: "Previous",
    title: "Controlled Navigation and Admin Workflow Update",
    summary:
      "Added controlled app wiring for audit review, restore deleted records, appointment font-control cleanup, and specialty source-of-truth cleanup.",
    capabilities: [
      "Audit log viewer component prepared for administrative review.",
      "Restore deleted resident and appointment component prepared for soft-delete recovery.",
      "Specialty list alignment was reviewed to reduce mismatched dropdown maintenance.",
      "Legacy floating appointment font control was identified as intrusive and removed from the production path.",
    ],
    processFlow: [
      "Use Appointments for daily tracking.",
      "Use Help & Info for guide and version review.",
      "Use the specialty dropdown to support reason-for-consult selection.",
    ],
    userImpact: [
      "Cleaner screen experience without intrusive floating controls.",
      "Better administrative review readiness.",
      "Reduced risk of duplicate specialty maintenance.",
    ],
    adminOnly: true,
  },
  {
    version: "0.1.0",
    releaseDate: "Baseline",
    title: "D1 Data Safety and Appointment Workflow Baseline",
    summary:
      "Established the Cloudflare D1-backed appointment tracker with resident census, appointment log, reports, PDF forms, audit logging, and soft-delete support.",
    capabilities: [
      "Resident census import and resident registry.",
      "Appointment creation, editing, filtering, and status tracking.",
      "PDF generation for visit form, outside appointment checklist, medical clearance, full report, and transport schedule.",
      "D1 database-backed workflow for shared production use.",
    ],
    processFlow: [
      "Import or update census.",
      "Create and track appointments.",
      "Generate needed forms or reports.",
      "Review activity and restore records when supporting admin tools are enabled.",
    ],
    userImpact: [
      "Moved the tracker toward a more reliable database-backed workflow.",
      "Improved ability to track resident appointments and generate operational reports.",
      "Added a clearer path for facility appointment coordination.",
    ],
    adminOnly: true,
  },
];

const USER_GUIDE_SECTIONS = [
  {
    title: "1. Start with Patient Census",
    steps: [
      "Open the Patient Census page.",
      "Paste the resident census text into the import box.",
      "Parse and review the preview list before saving.",
      "Use skip duplicates when adding only new residents.",
      "Save the census so appointment forms can auto-fill resident details.",
      "Review the Active Patient Census by unit; expand or collapse units as needed.",
    ],
  },
  {
    title: "2. Track an Appointment",
    steps: [
      "Open Appointments.",
      "Select or search for the resident.",
      "Enter specialty, consult reason, provider, location, date, time, and pickup time.",
      "Add transportation details, escort needs, oxygen, wheelchair, or special instructions when applicable.",
      "Save the appointment and update the status as it moves from scheduled to completed, cancelled, or rescheduled.",
    ],
  },
  {
    title: "3. Generate Forms and Reports",
    steps: [
      "Use the appointment action buttons to generate the visit form, checklist, or medical clearance document.",
      "Open Reports to select date range, specialty, and desired columns.",
      "Generate the full report or transport schedule for the selected appointment group.",
      "Review PDF output before printing, saving, or sharing with the facility workflow location.",
    ],
  },
  {
    title: "4. Review Version History and Guide",
    steps: [
      "Open Help & Info.",
      "Review the latest version history first.",
      "Use the PDF button to generate a printable version history and user guide packet.",
      "Use the guide for staff orientation, QAPI explanation, and workflow review.",
    ],
  },
  {
    title: "5. Admin Review Workflow",
    adminOnly: true,
    steps: [
      "Admin users may review audit logs and restore tools when those sections are enabled.",
      "Admin-only sections should remain hidden from staff users.",
      "Version history should be updated after every deployment with plain-language workflow changes.",
    ],
  },
];

export function VersionHistoryPanel({ currentUserRole }: VersionHistoryPanelProps) {
  const normalizedRole = String(currentUserRole || "").trim().toLowerCase();
  const isAdmin = normalizedRole === "admin";
  const visibleVersionHistory = isAdmin
    ? VERSION_HISTORY
    : VERSION_HISTORY.filter((entry) => !entry.adminOnly);
  const visibleGuideSections = isAdmin
    ? USER_GUIDE_SECTIONS
    : USER_GUIDE_SECTIONS.filter((section) => !(section as any).adminOnly);

  const generateVersionHistoryPdf = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
    const width = doc.internal.pageSize.getWidth();
    const margin = 40;
    let y = 42;

    doc.setFillColor(11, 42, 111);
    doc.rect(0, 0, width, 72, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.text("HealthSync Medical Appointment Tracker", margin, 32);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Version History, Capabilities, and User Workflow Guide", margin, 52);
    doc.text(`Generated: ${new Date().toLocaleString()}`, width - margin, 52, { align: "right" });

    y = 96;
    doc.setTextColor(11, 42, 111);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Latest Version", margin, y);
    y += 14;

    const latest = visibleVersionHistory[0];
    autoTable(doc, {
      startY: y,
      head: [["Version", "Release", "Summary"]],
      body: [[latest.version, latest.releaseDate, latest.summary]],
      styles: { fontSize: 9, cellPadding: 6, valign: "top" },
      headStyles: { fillColor: [44, 62, 80], textColor: 255 },
      columnStyles: { 0: { cellWidth: 70 }, 1: { cellWidth: 90 }, 2: { cellWidth: 340 } },
      margin: { left: margin, right: margin },
    });

    y = (doc as any).lastAutoTable.finalY + 24;
    visibleVersionHistory.forEach((entry) => {
      if (y > 660) {
        doc.addPage();
        y = 48;
      }

      doc.setTextColor(11, 42, 111);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`${entry.version} — ${entry.title}`, margin, y);
      y += 16;
      doc.setTextColor(60, 60, 60);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(doc.splitTextToSize(entry.summary, width - margin * 2), margin, y);
      y += 28;

      autoTable(doc, {
        startY: y,
        head: [["Capabilities", "Workflow / Process", "User Impact"]],
        body: [[
          entry.capabilities.map((item) => `• ${item}`).join("\n"),
          entry.processFlow.map((item) => `• ${item}`).join("\n"),
          entry.userImpact.map((item) => `• ${item}`).join("\n"),
        ]],
        styles: { fontSize: 8, cellPadding: 5, valign: "top" },
        headStyles: { fillColor: [44, 62, 80], textColor: 255 },
        margin: { left: margin, right: margin },
      });
      y = (doc as any).lastAutoTable.finalY + 22;
    });

    doc.addPage();
    y = 48;
    doc.setTextColor(11, 42, 111);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("User Guide: How to Use the Web App", margin, y);
    y += 22;

    visibleGuideSections.forEach((section) => {
      if (y > 675) {
        doc.addPage();
        y = 48;
      }
      doc.setTextColor(11, 42, 111);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(section.title, margin, y);
      y += 14;
      doc.setTextColor(55, 65, 81);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(section.steps.map((step) => `• ${step}`).join("\n"), width - margin * 2);
      doc.text(lines, margin, y);
      y += lines.length * 11 + 18;
    });

    doc.save(`HealthSync_Version_History_User_Guide_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-black text-slate-800">
            <History size={18} className="text-sky-700" />
            Version History
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Latest version is shown first. Use the PDF button for a printable non-technical history, capabilities, and workflow guide.
          </p>
        </div>
        <button
          type="button"
          onClick={generateVersionHistoryPdf}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-700 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-sky-800"
        >
          <Download size={14} />
          PDF Version History
        </button>
      </div>

      {!isAdmin && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800">
          Staff view: Version History and User Guide are available here. Administrative tools remain restricted to admin users.
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-white p-2 text-sky-700 shadow-sm">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900">Latest: {visibleVersionHistory[0].version}</p>
            <p className="mt-1 text-xs font-bold leading-relaxed text-slate-600">
              {visibleVersionHistory[0].title} — {visibleVersionHistory[0].summary}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {visibleVersionHistory.map((entry) => (
          <details key={entry.version} className="rounded-2xl border border-slate-100 bg-slate-50 p-4" open={entry.version === visibleVersionHistory[0].version}>
            <summary className="cursor-pointer text-sm font-black text-slate-800">
              {entry.version} — {entry.title}
            </summary>
            <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-600">{entry.summary}</p>
            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              <InfoList icon={<CheckCircle2 size={15} />} title="Capabilities" items={entry.capabilities} />
              <InfoList icon={<Workflow size={15} />} title="Process Flow" items={entry.processFlow} />
              <InfoList icon={<FileText size={15} />} title="User Impact" items={entry.userImpact} />
            </div>
          </details>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-4">
        <div className="flex items-center gap-2 text-sm font-black text-slate-800">
          <FileText size={17} className="text-slate-700" />
          User Guide: Web App Tracking and Report Generation
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {visibleGuideSections.map((section) => (
            <InfoList key={section.title} title={section.title} items={section.steps} />
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoList({
  icon,
  title,
  items,
}: {
  icon?: React.ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-3">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-700">
        {icon}
        {title}
      </div>
      <ul className="mt-2 space-y-1.5 text-xs font-semibold leading-relaxed text-slate-600">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
