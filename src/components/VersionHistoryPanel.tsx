import { History, CheckCircle2 } from "lucide-react";

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

const CURRENT_VERSION = "2.2.2";

const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "2.2.2",
    releaseDate: "2026-04-30",
    title: "D1 Migration Cleanup and Current Baseline",
    summary:
      "This maintenance release cleans up overlapping D1 migration ownership while preserving the deployed schema alignment and Census View modal fix.",
    capabilities: [
      "Cleaned up the schema alignment migration so it no longer re-adds appointment resident identity fields already owned by 0004_appointment_resident_identity.sql.",
      "Cleaned up the schema alignment migration so it no longer re-adds user password and last-login fields already owned by 0006_user_passwords.sql.",
      "Cleaned up the schema alignment migration so it no longer re-adds transport-detail fields already owned by 0007_appointment_transport_details.sql.",
      "Kept schema alignment coverage for facilities, user-facility access, transportation directory, resident facility link, remaining appointment transport/escort/consult fields, and operational indexes.",
      "Preserved the Census View modal fix so PatientCensusUnitList remains the single resident-detail modal owner.",
      "Updated the visible Current Release Note and Version History so v2.2.2 is the current maintenance baseline.",
    ],
    processFlow: [
      "Admin pulls the latest main branch before the next build or deploy.",
      "Admin runs npm run build to verify the UI and TypeScript build remain stable.",
      "For a fresh D1 database, migrations run in order without the schema alignment file repeating columns owned by neighboring migrations.",
      "For an already-deployed D1 database, admins avoid re-running previously applied migration names and continue from the recorded migration state.",
      "Staff opens Patient Census and selects View on a resident row.",
      "The resident detail modal opens once, showing demographics, appointment history, and resident summary print options.",
    ],
    userImpact: [
      "Reduces duplicate-column migration failures on fresh or rebuilt environments.",
      "Keeps D1 schema ownership clearer for future updates.",
      "Maintains the corrected Census View behavior from v2.2.1.",
      "Makes the current deployed baseline easier to identify in Help and Version History.",
      "Creates a cleaner foundation before the next security or database pass.",
    ],
  },
  {
    version: "2.2.1",
    releaseDate: "2026-04-30",
    title: "D1 Schema Alignment and Census View Modal Fix",
    summary:
      "This maintenance release locks the deployed D1 schema to the current Worker/API contract and fixes the Patient Census View workflow so resident details open from one modal owner only.",
    capabilities: [
      "Added D1 schema alignment for facilities, user access, transportation directory, resident facility scoping, and newer appointment fields used by the current app.",
      "Aligned appointment storage with current transport, escort, consult, resident identity, wheelchair/lift/recliner, and bariatric fields.",
      "Added supporting indexes for facility-scoped residents, resident status, appointment date/status, resident identity lookup, transportation directory, and user-facility access.",
      "Corrected the Census View workflow so PatientCensusUnitList owns the resident detail modal and the parent Census page no longer opens a duplicate modal.",
      "Added a visible Current Release Note on the Help page and updated the admin guide with the post-deployment database migration workflow.",
      "Updated .gitignore to exclude local Wrangler/Miniflare D1 runtime state files from normal Git status output.",
    ],
    processFlow: [
      "Admin deploys the updated application build.",
      "Admin applies the D1 migration set locally and remotely so the database includes all fields expected by the Worker API.",
      "Staff opens Patient Census and selects View on a resident row.",
      "The resident detail modal opens once, showing demographics, appointment history, and resident summary print options.",
      "Staff creates or edits appointments using transport, escort, consult, and resident identity fields without D1 column mismatch errors.",
      "Admin reviews Help → Current Release Note for deployment validation steps and the current baseline version.",
    ],
    userImpact: [
      "Reduces database save errors caused by missing D1 columns after code updates.",
      "Improves Census View reliability by preventing duplicate or overlapping resident detail modal behavior.",
      "Makes the deployed baseline clearer for staff and admins through an updated release note and version history.",
      "Keeps local Wrangler development database files out of Git tracking so repository status stays clean.",
      "Creates a safer v2.2.1 baseline before the next feature or security pass.",
    ],
  },
  {
    version: "2.2.0",
    releaseDate: "2026-04-29",
    title: "Smart Census Persistence and Resident Identity Linking",
    summary:
      "This version strengthens the census replacement workflow so discharged residents remain retained after refresh, reduces unnecessary census save requests, and adds stable resident identity fields to appointment records for more reliable resident appointment history.",
    capabilities: [
      "Smart census reconciliation now supports durable soft discharge using resident status, discharged date, last census seen date, and discharge batch tracking.",
      "Census replacement distinguishes created, updated, reactivated, discharged, and unchanged residents instead of treating every import as a full overwrite.",
      "Normal unchanged active residents are no longer patched only because the census was re-imported, reducing unnecessary network activity and avoiding failed save loops.",
      "Patient Census active count now reflects active residents only, while Discharged and All views remain available for review.",
      "Appointment records now support stable resident identity fields: residentId and residentMrn.",
      "New appointments selected from the resident list can carry resident identity information so appointment history does not rely only on name matching.",
      "Resident appointment history now matches by residentId first, residentMrn second, MRN in notes third, then name/room fallback for older records.",
      "D1 appointments table now includes residentId and residentMrn columns for ongoing identity-safe appointment history.",
    ],
    processFlow: [
      "Staff pastes the current Resident Listing Report into Patient Census and reviews the preview before saving.",
      "The system compares the incoming census to the existing resident registry.",
      "Residents still present remain active; new residents are added; residents missing from the new census are marked as Discharged instead of being deleted.",
      "If a previously discharged resident appears again in a later census, the resident can be reactivated through the reconciliation workflow.",
      "Staff creates a new appointment by selecting the resident from the resident search/dropdown when available.",
      "The appointment stores the resident name plus stable resident identity details to support reliable history lookup.",
      "When staff opens Census → View, the appointment history prioritizes resident identity fields before falling back to name-based matching for older records.",
    ],
    userImpact: [
      "Discharged residents remain visible under the Discharged census view after refresh instead of returning to the Active count.",
      "Active census counts are more accurate for daily operations and staffing review.",
      "Census imports are more reliable because the app avoids unnecessary PATCH requests for unchanged residents.",
      "Resident appointment history is more dependable for newly created appointments because it uses resident identity instead of only matching by text name.",
      "Older appointment records still remain searchable through MRN-in-notes and name/room fallback logic.",
      "The workflow is safer for survey review because resident history is retained instead of being hard deleted.",
    ],
  },
  {
    version: "2.1.0",
    releaseDate: "2026-04-29",
    title: "Appointment Modal Refactor and Scheduling Review Workflow",
    summary:
      "This version refactors the New Appointment Request modal into modular sections, adds safer validation, and supports request intake when an exact appointment date is not yet available by routing those requests to Scheduling Coordinator review.",
    capabilities: [
      "Appointment modal split into focused section components for origin, location, date/status, timing, specialty, clinical details, transport, notes, status prompt, and footer.",
      "Appointment modal now uses explicit typed props instead of broad prop spreading for safer maintenance.",
      "Validation layer added so required request details are checked before saving.",
      "Appointment date is no longer required at initial request intake.",
      "Requests without an appointment date can be tracked as Pending Scheduling Review for scheduling coordinator follow-up.",
      "Transport and clinical sections restored with consistent input, select, checkbox, spacing, and focus styling.",
      "Status workflow supports Pending Scheduling Review, Scheduled, Completed, Cancelled, Rescheduled, Discontinued, and Deferred.",
    ],
    processFlow: [
      "Staff opens New Appointment Request and enters the resident and specialty/appointment type.",
      "If the exact appointment date is not available, staff may save the request without entering a date.",
      "The request is placed under Pending Scheduling Review for coordinator review and follow-up.",
      "Scheduling coordinator reviews pending requests and adds the confirmed appointment date, time, pickup time, transport details, and status.",
      "Once a confirmed date is entered, the request can be managed as a scheduled appointment.",
      "If an appointment is cancelled, rescheduled, deferred, or discontinued, staff document the reason through the status reason prompt.",
    ],
    userImpact: [
      "Allows nursing staff to submit appointment requests without using placeholder or inaccurate appointment dates.",
      "Creates a clearer handoff workflow between nursing staff and the scheduling coordinator.",
      "Reduces incomplete scheduling workarounds and improves queue visibility for requests needing follow-up.",
      "Makes the appointment modal easier to maintain and safer to enhance in future updates.",
      "Improves consistency and readability of the appointment request form.",
    ],
  },
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
    releaseDate: "2026-04-26",
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
  const visibleVersionHistory = VERSION_HISTORY.filter((entry) => !entry.adminOnly || String(currentUserRole || "").toLowerCase() === "admin");

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-black text-slate-800">
          <History size={18} className="text-sky-700" /> Version History
        </div>
        <span className="inline-flex w-fit items-center rounded-full bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-sky-800 ring-1 ring-sky-100">
          Current v{CURRENT_VERSION}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {visibleVersionHistory.map((entry) => (
          <details key={entry.version} className="rounded-2xl border border-slate-100 bg-slate-50 p-4" open={entry.version === CURRENT_VERSION}>
            <summary className="cursor-pointer text-sm font-black text-slate-800">
              v{entry.version} — {entry.title}
              {entry.version === CURRENT_VERSION && (
                <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-100">
                  Current
                </span>
              )}
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
