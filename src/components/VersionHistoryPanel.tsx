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

const CURRENT_VERSION = "2.7.7";

const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "2.7.7",
    releaseDate: "2026-04-30",
    title: "Appointment Display Helper Foundation",
    summary:
      "This release adds reusable appointment display-format helpers for future App.tsx, reports, calendar, and appointment list cleanup.",
    capabilities: [
      "Added appointment display helpers at src/utils/appointmentDisplayHelpers.ts.",
      "Added helpers for appointment date, time, date/time, resident label, provider/location label, transport label, and summary line formatting.",
      "Exported the appointment display helpers through the appointment modal toolkit.",
      "Kept App.tsx behavior unchanged in this patch to avoid a broad rewrite.",
      "No D1 migration is required for this modular cleanup patch.",
    ],
    processFlow: [
      "Pull the latest main branch.",
      "Run npm run build before deployment.",
      "Use appointment display helpers in the next narrow App.tsx, reports, calendar, or appointment-table replacement patch.",
      "Continue replacing duplicated App.tsx display formatting in small build-tested steps.",
    ],
    userImpact: [
      "Keeps appointment workflows stable while cleanup continues.",
      "Creates a shared display-format foundation for appointment tables, cards, reports, and calendar views.",
      "Makes future appointment display cleanup smaller and easier to review.",
    ],
  },
  {
    version: "2.7.6",
    releaseDate: "2026-04-30",
    title: "Appointment Sort Helper Foundation",
    summary:
      "This release adds reusable appointment sorting helpers for future App.tsx, reports, calendar, and appointment list cleanup.",
    capabilities: [
      "Added appointment sort helpers at src/utils/appointmentSortHelpers.ts.",
      "Added helpers for date ascending, date descending, status-priority, resident, specialty, and provider sorting.",
      "Exported the appointment sort helpers through the appointment modal toolkit.",
      "Kept App.tsx behavior unchanged in this patch to avoid a broad rewrite.",
    ],
    processFlow: [
      "Use appointment sort helpers in the next narrow App.tsx, reports, calendar, or appointment-table replacement patch.",
      "Continue replacing duplicated App.tsx logic in small build-tested steps.",
    ],
    userImpact: [
      "Keeps appointment workflows stable while cleanup continues.",
      "Creates a shared sorting foundation for appointments, reports, and calendar views.",
      "Makes future appointment list cleanup smaller and easier to review.",
    ],
  },
  {
    version: "2.7.5",
    releaseDate: "2026-04-30",
    title: "Appointment Filtering Helper Foundation",
    summary:
      "This release adds reusable appointment filtering helpers for future App.tsx, reports, and appointment list cleanup.",
    capabilities: [
      "Added appointment filtering helpers at src/utils/appointmentFilterHelpers.ts.",
      "Added helpers for appointment search text, date-range matching, multi-field filter matching, and filtered appointment lists.",
      "Exported the appointment filter helpers through the appointment modal toolkit.",
      "Kept App.tsx behavior unchanged in this patch to avoid a broad rewrite.",
    ],
    processFlow: [
      "Use appointment filter helpers in the next narrow App.tsx, reports, or appointment-table replacement patch.",
      "Continue replacing duplicated App.tsx logic in small build-tested steps.",
    ],
    userImpact: [
      "Keeps appointment workflows stable while cleanup continues.",
      "Creates a shared filtering foundation for appointments and reports.",
      "Makes future appointment list and report cleanup smaller and easier to review.",
    ],
  },
  {
    version: "2.7.4",
    releaseDate: "2026-04-30",
    title: "Appointment Status Helper Foundation",
    summary:
      "This release adds reusable appointment status helpers for future App.tsx and appointment list cleanup.",
    capabilities: [
      "Added appointment status helpers at src/utils/appointmentStatusHelpers.ts.",
      "Added helpers for status grouping, status labels, badge class selection, active status checks, pending scheduling review checks, and status sort weight.",
      "Exported the appointment status helpers through the appointment modal toolkit.",
    ],
    processFlow: [
      "Use appointment status helpers in the next narrow App.tsx or appointment-table replacement patch.",
      "Continue replacing duplicated App.tsx logic in small build-tested steps.",
    ],
    userImpact: [
      "Keeps appointment workflows stable while cleanup continues.",
      "Creates a shared status foundation for consistent appointment badges and filtering.",
      "Makes future appointment list cleanup smaller and easier to review.",
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
