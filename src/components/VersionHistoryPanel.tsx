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

const CURRENT_VERSION = "2.5.8";

const VERSION_HISTORY: VersionEntry[] = [
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
      "No D1 migration is required for this admin search patch.",
    ],
    processFlow: [
      "Pull the latest main branch.",
      "Run npm run build before deployment.",
      "Deploy the app and open Help / Info as an admin user.",
      "Search facilities and users to confirm filtering works as expected.",
    ],
    userImpact: [
      "Admins can find facility records faster.",
      "Admins can find user records faster.",
      "The Help / Info admin lists remain usable as records grow.",
    ],
  },
  {
    version: "2.5.7",
    releaseDate: "2026-04-30",
    title: "Admin Management Summary Counts",
    summary:
      "This release adds quick admin summary counts so facility and user setup status is easier to review from Help / Info.",
    capabilities: [
      "Added an Admin Management Snapshot section on the Help / Info page.",
      "Added count tiles for total facilities, current facility status, admin users, and staff users.",
      "Added New Facility and New User actions directly to the snapshot card.",
    ],
    processFlow: [
      "Deploy the app and open Help / Info as an admin user.",
      "Confirm the Admin Management Snapshot shows facility and user setup counts.",
    ],
    userImpact: [
      "Admins can quickly review setup status before managing records.",
      "Facility and user creation actions are available from the snapshot card.",
      "The Help / Info admin area provides better at-a-glance context.",
    ],
  },
  {
    version: "2.5.6",
    releaseDate: "2026-04-30",
    title: "Admin Management Layout Polish",
    summary:
      "This release improves the Help / Info admin management layout so facility and user controls are easier to scan and use.",
    capabilities: [
      "Changed Facility Management and User Access Management into a responsive two-column admin grid on wide screens.",
      "Improved quick-action bars, current facility badge, role badge, and mobile button widths.",
      "Reduced visual crowding while preserving New Facility, New User, Set, Edit, Delete, and Edit User actions.",
    ],
    processFlow: [
      "Deploy the app and open Help / Info as an admin user.",
      "Confirm Facility Management and User Access Management are easier to scan and use.",
    ],
    userImpact: [
      "Admins can manage facilities and users from a cleaner layout.",
      "Action buttons remain visible and easier to use on mobile and desktop.",
      "The Help / Info admin area feels less crowded.",
    ],
  },
  {
    version: "2.5.5",
    releaseDate: "2026-04-30",
    title: "Admin Management Visibility Safeguard",
    summary:
      "This release added visible inline admin quick actions so facility and user creation controls remain easy to find on the Help / Info page.",
    capabilities: [
      "Added inline Admin Quick Action bars inside Facility Management and User Access Management.",
      "Kept the header New Facility and New User buttons while adding body-level fallback buttons.",
      "Improved admin action visibility on wide and narrow screens.",
    ],
    processFlow: [
      "Deploy the app and open Help / Info as an admin user.",
      "Confirm New Facility and New User appear in both the card header and inline quick action bar.",
    ],
    userImpact: [
      "Admins can find facility and user creation controls faster.",
      "Buttons remain visible even if the header action area is missed or compressed.",
      "The admin management workflow is clearer and easier to use.",
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
