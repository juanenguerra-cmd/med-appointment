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

const CURRENT_VERSION = "2.6.1";

const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "2.6.1",
    releaseDate: "2026-04-30",
    title: "Admin List Reset Controls",
    summary:
      "This release adds one-click reset controls for admin facility and user list filters.",
    capabilities: [
      "Added Reset controls to Facility Management and User Access Management list filters.",
      "Facility Reset clears facility search and restores the default Current first sort.",
      "User Reset clears user search and restores the default Admins first sort.",
      "Reset buttons automatically disable when list controls are already at their default settings.",
      "No D1 migration is required for this admin reset-control patch.",
    ],
    processFlow: [
      "Pull the latest main branch.",
      "Run npm run build before deployment.",
      "Deploy the app and open Help / Info as an admin user.",
      "Change facility/user search or sort, then use Reset to return to the default list view.",
    ],
    userImpact: [
      "Admins can reset list controls faster.",
      "Facility and user list management is easier during setup and maintenance.",
      "The Help / Info admin list controls feel more complete and forgiving.",
    ],
  },
  {
    version: "2.6.0",
    releaseDate: "2026-04-30",
    title: "Admin Management Sort Controls",
    summary:
      "This release adds sort controls to admin facility and user lists so management records are easier to organize.",
    capabilities: [
      "Added sort controls to Facility Management and User Access Management.",
      "Facilities can be sorted by Current first, Name A-Z, and Name Z-A.",
      "Users can be sorted by Admins first, Name A-Z, Name Z-A, and Role A-Z.",
      "Kept v2.5.9 search, clear-search, showing-count, and empty-result behavior.",
    ],
    processFlow: [
      "Deploy the app and open Help / Info as an admin user.",
      "Sort facilities and users to confirm ordering works as expected.",
    ],
    userImpact: [
      "Admins can organize facility records faster.",
      "Admins can organize users by name, role, or admin priority.",
      "The Help / Info admin lists are easier to maintain as records grow.",
    ],
  },
  {
    version: "2.5.9",
    releaseDate: "2026-04-30",
    title: "Admin Search Clear Controls",
    summary:
      "This release adds clear buttons to admin search boxes so facility and user filters can be reset quickly.",
    capabilities: [
      "Added clear-search controls to Facility Management and User Access Management search boxes.",
      "Search inputs now reserve space for the clear button so text does not overlap the control.",
      "Kept the v2.5.8 search filters, showing-count labels, and empty search-result messages.",
    ],
    processFlow: [
      "Deploy the app and open Help / Info as an admin user.",
      "Type into facility/user search and use the clear button to reset the lists.",
    ],
    userImpact: [
      "Admins can reset search filters faster.",
      "Facility and user lists are easier to navigate during setup and maintenance.",
      "The Help / Info admin search controls feel more complete.",
    ],
  },
  {
    version: "2.5.8",
    releaseDate: "2026-04-30",
    title: "Admin Management Search Filters",
    summary:
      "This release adds admin search filters so facility and user lists are easier to navigate as records grow.",
    capabilities: [
      "Added search to Facility Management by facility name, address, or phone.",
      "Added search to User Access Management by user name, email, or role.",
      "Added showing-count labels for filtered facility and user lists.",
      "Added empty search-result messages when no records match.",
    ],
    processFlow: [
      "Deploy the app and open Help / Info as an admin user.",
      "Search facilities and users to confirm filtering works as expected.",
    ],
    userImpact: [
      "Admins can find facility records faster.",
      "Admins can find user records faster.",
      "The Help / Info admin lists remain usable as records grow.",
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
