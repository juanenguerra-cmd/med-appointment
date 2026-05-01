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

const CURRENT_VERSION = "2.5.4";

const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "2.5.4",
    releaseDate: "2026-04-30",
    title: "Admin Help Actions Fix",
    summary:
      "This release restores the visible admin action buttons on the Help / Info page by using the correct Card actions prop.",
    capabilities: [
      "Restored New Facility action in Facility Management.",
      "Restored New User action in User Access Management.",
      "Kept facility Set, Edit, and Delete controls visible for admin users.",
      "Kept user Edit controls visible for admin users.",
      "No D1 migration is required for this UI fix.",
    ],
    processFlow: [
      "Pull the latest main branch.",
      "Run npm run build before deployment.",
      "Deploy the app and open Help / Info as an admin user.",
      "Confirm New Facility and New User are visible in the management cards.",
    ],
    userImpact: [
      "Admins can add facilities from the Help / Info page again.",
      "Admins can add users from the Help / Info page again.",
      "The admin management area now matches the intended workflow.",
    ],
  },
  {
    version: "2.5.3",
    releaseDate: "2026-04-30",
    title: "Census Reconciliation Observability",
    summary:
      "This release improves census import validation by expanding backend reconciliation summary counts and updating frontend service types.",
    capabilities: [
      "Backend reconciliation summary now includes rawIncoming, skippedInvalid, duplicateIncoming, statementsQueued, and mode.",
      "Frontend census reconciliation service types now match the expanded backend summary fields.",
      "No D1 migration is required for this observability patch.",
    ],
    processFlow: [
      "Pull the latest main branch.",
      "Run npm run build before deployment.",
      "Deploy the Worker so the expanded summary is live.",
      "Paste a small test census and review the console summary after save.",
    ],
    userImpact: [
      "Makes census import validation easier after each save.",
      "Helps identify skipped invalid rows or duplicate incoming residents.",
      "Improves confidence that backend reconciliation is processing the expected data.",
    ],
  },
  {
    version: "2.5.2",
    releaseDate: "2026-04-30",
    title: "Patient Census Backend Reconciliation",
    summary:
      "This release switched Patient Census replacement to backend-first reconciliation while keeping a frontend fallback for operational safety.",
    capabilities: [
      "replaceResidents() calls /api/census/reconcile through the typed censusReconcileService.",
      "The local resident list updates from the database response after server-side reconciliation completes.",
      "A frontend fallback remains available if the backend endpoint is temporarily unavailable.",
    ],
    processFlow: [
      "Deploy the app so backend census reconciliation is live.",
      "Paste a small test census.",
      "Confirm backend reconciliation completes successfully.",
    ],
    userImpact: [
      "Reduces partial-save risk during census replacement.",
      "Keeps operations safer through fallback protection.",
      "Makes census import more reliable and easier to audit from summary counts.",
    ],
  },
  {
    version: "2.5.1",
    releaseDate: "2026-04-30",
    title: "Census Reconciliation Service Integration",
    summary:
      "This release added the typed frontend service wrapper for the backend census reconciliation endpoint while keeping the active Patient Census workflow stable during validation.",
    capabilities: [
      "Added censusReconcileService for /api/census/reconcile.",
      "Standardized frontend types for backend reconciliation summaries.",
      "Preserved the existing Patient Census save workflow until the final UI switch was locally build-tested.",
    ],
    processFlow: [
      "Deploy the service wrapper and backend endpoint.",
      "Validate service availability.",
      "Prepare replaceResidents() for backend reconciliation.",
    ],
    userImpact: [
      "Prepared the Patient Census workflow for safer one-request backend reconciliation.",
      "Kept the current census save behavior stable while integration was staged.",
      "Reduced risk before replacing the large frontend multi-request save loop.",
    ],
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
