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

const CURRENT_VERSION = "2.5.2";

const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "2.5.2",
    releaseDate: "2026-04-30",
    title: "Patient Census Backend Reconciliation",
    summary:
      "This release switches Patient Census replacement to backend-first reconciliation while keeping a frontend fallback for operational safety.",
    capabilities: [
      "replaceResidents() now calls /api/census/reconcile through the typed censusReconcileService.",
      "The local resident list updates from the database response after server-side reconciliation completes.",
      "A frontend fallback remains available if the backend endpoint is temporarily unavailable.",
      "No D1 migration is required for this workflow switch.",
    ],
    processFlow: [
      "Pull the latest main branch.",
      "Run npm run build before deployment.",
      "Deploy the app so the backend census endpoint and frontend switch are live.",
      "Paste a small test census and confirm backend reconciliation completes successfully.",
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
  {
    version: "2.5.0",
    releaseDate: "2026-04-30",
    title: "Backend Census Reconciliation Foundation",
    summary:
      "This release added the backend foundation for one-request census reconciliation while keeping the existing frontend workflow available during validation.",
    capabilities: [
      "Added /api/census/reconcile for backend census reconciliation.",
      "Backend route calculates created, updated, reactivated, discharged, unchanged, active-after-import, and discharged-after-import counts.",
      "Added a v2.5 Worker entrypoint that registers the new route while preserving the existing Worker API.",
    ],
    processFlow: [
      "Deploy the Worker so /api/census/reconcile is available.",
      "Validate the endpoint with a small test census.",
      "Keep the current frontend workflow available during validation.",
    ],
    userImpact: [
      "Created the backend foundation for safer census saves.",
      "Reduced future risk of partial census save workflows.",
      "Kept the current frontend workflow stable while the new endpoint was validated.",
    ],
  },
  {
    version: "2.4.0",
    releaseDate: "2026-04-30",
    title: "Security Hardening: Password Hashing",
    summary:
      "This release hardened password storage while preserving login continuity through automatic legacy password upgrade after successful login.",
    capabilities: [
      "New passwords are stored as PBKDF2-SHA256 hashes in the existing users.password field.",
      "Existing plain-text passwords still work once and are automatically upgraded to hashed storage after successful login.",
      "Password setup, new user creation, and password update flows now store hashes instead of plain text.",
    ],
    processFlow: [
      "Deploy the Worker so password hashing is active.",
      "Have existing users log in once so legacy passwords upgrade automatically.",
      "Continue normal user management without Cloudflare Auth.",
    ],
    userImpact: [
      "Improved password storage security.",
      "Preserved existing user access during the transition.",
      "Created a safer user-management baseline.",
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
