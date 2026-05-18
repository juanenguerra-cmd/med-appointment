import { History, CheckCircle2 } from "lucide-react";

interface VersionEntry {
  version: string;
  releaseDate: string;
  title: string;
  summary: string;
  capabilities: string[];
  processFlow: string[];
  userImpact: string[];
}

const CURRENT_VERSION = "3.1.24";

const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "3.1.24",
    releaseDate: "2026-05-18",
    title: "PCC Mixed-Case Resident Row Detection Fix",
    summary: "Fixed PCC census parser row detection so mixed-case resident names are counted, resolving the 113 parsed versus 126 expected resident count issue.",
    capabilities: [
      "Updated the PCC resident row start pattern from uppercase-only matching to mixed-case compatible matching.",
      "Recognizes mixed-case resident names such as Anderson, Floyd; Dwyer, Angela; Holmes, Jamila T; and Woo, Kaitsen.",
      "Added extra filtering for page/header lines so report headers are not appended into resident allergy or diagnosis text.",
      "Preserved the existing PCC column parser mapping for MRN, Age, Birth Date, Location, Gender, Admission Date, Allergies, Primary Physician, and Primary Diagnosis.",
      "No D1 migration is required.",
    ],
    processFlow: [
      "Pull the latest main branch before retesting the same raw census text.",
      "Run npm run verify:census-parser to confirm parser exports remain intact.",
      "Run npm run test:census-parser-fixtures to validate parser fixture coverage.",
      "Run npm run build before using the updated census import workflow.",
      "Paste the same raw census again and confirm Parsed Residents shows 126 instead of 113.",
    ],
    userImpact: [
      "Fixes missed resident rows caused by mixed-case names in PCC census exports.",
      "Expected parsed resident count now matches the 126 resident(s) footer from the raw census.",
      "Improves confidence before using the census preview/import workflow.",
    ],
  },
  {
    version: "3.1.23",
    releaseDate: "2026-05-17",
    title: "PCC Resident Listing Column Parser Hardening",
    summary: "Added a dedicated parser for the real PCC-style Resident Listing Report so census rows map MRN, age, DOB, location, physician, and diagnosis correctly.",
    capabilities: [
      "Added src/census/parser/pccResidentListingParser.ts for real Resident Listing Report column parsing.",
      "Supports MRNs with letters inside parentheses, such as LON202419.",
      "Extracts Age directly from the Age column and Birth Date as DOB.",
      "Splits location into floor, unit, room, and bed from values such as 2nd Floor Unit 2 253 A.",
      "Joins wrapped allergy lines until the next resident row starts.",
      "Separates Allergies, Primary Physician, and Primary Diagnosis into the correct parsed fields.",
      "Routes detected PCC Resident Listing reports through the dedicated parser inside parseCensusText.",
      "Updates resident preview mapping so age, sex, floor, physician, and diagnosis display correctly.",
    ],
    processFlow: [
      "Paste the PCC Resident Listing Report raw text into the Census import box.",
      "The parser detects the Resident Listing Report header and uses the PCC column parser.",
      "Rows are normalized, wrapped allergy lines are joined, and resident fields are mapped column-by-column.",
      "Review the import summary and preview table before saving.",
      "Run npm run verify:census-parser, npm run test:census-parser-fixtures, and npm run build before production use.",
    ],
    userImpact: [
      "Fixes the earlier issue where residents were parsed with broad warnings because MRN, DOB, age, and physician were not detected correctly.",
      "Reduces false warnings for complete PCC resident rows.",
      "Prevents Primary Diagnosis from being displayed under the Physician column.",
      "Makes the parsed census preview safer to review before import.",
    ],
  },
  {
    version: "3.1.22",
    releaseDate: "2026-05-12",
    title: "User Management Admin Console Foundation",
    summary: "Added a protected User Management admin console foundation for multi-facility access control, staff-user linking, role-based security, and appointment workflow permission overrides.",
    capabilities: ["Added src/pages/UserManagementPage.tsx.", "Added admin-only role guard support.", "Added Users List and Access Matrix surfaces."],
    processFlow: ["Admin opens the future /user-management route or User Management tab.", "System confirms admin access.", "Admin reviews user roles and access matrix."],
    userImpact: ["Prepares Med-Appointment for safer multi-facility user access control.", "Gives administrators a clear console for user review and permission management."],
  },
  {
    version: "3.1.21",
    releaseDate: "2026-04-30",
    title: "Census Import Summary UI Wiring",
    summary: "Added the Census page summary review surface and a local App.tsx wiring script while keeping the save workflow unchanged.",
    capabilities: ["Added CensusPage import summary UI support.", "Added summary banner states and summary cards.", "Added App.tsx summary wiring script."],
    processFlow: ["Run npm run refactor:app-census-summary-wiring locally.", "Run parser verification, fixture tests, and build."],
    userImpact: ["Adds visible census import summary review before save.", "Improves safety by showing ready, review-required, or blocked import status."],
  },
];

export function VersionHistoryPanel() {
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
        {VERSION_HISTORY.map((entry) => (
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
