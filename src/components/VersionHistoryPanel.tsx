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

const CURRENT_VERSION = "2.8.0";

const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "2.8.0",
    releaseDate: "2026-04-30",
    title: "Appointment Table Helper Foundation",
    summary:
      "This release adds reusable appointment table-row helpers for future appointment table, reports, calendar, and App.tsx cleanup.",
    capabilities: [
      "Added appointment table helpers at src/utils/appointmentTableHelpers.ts.",
      "Added table-row conversion that combines appointment date/time, resident, specialty, provider/location, status badge, and transport labels.",
      "Added buildAppointmentTableRows to filter, sort, and convert appointments into table-ready rows in one reusable helper.",
      "Exported the appointment table helpers through the appointment modal toolkit.",
      "Kept App.tsx behavior unchanged in this patch to avoid a broad rewrite.",
      "No D1 migration is required for this modular cleanup patch.",
    ],
    processFlow: [
      "Pull the latest main branch.",
      "Run npm run build before deployment.",
      "Use appointment table helpers in the next narrow appointment table, reports, calendar, or App.tsx replacement patch.",
      "Continue replacing duplicated appointment table formatting in small build-tested steps.",
    ],
    userImpact: [
      "Keeps appointment workflows stable while cleanup continues.",
      "Creates a shared table-row foundation for appointment lists, reports, and calendar views.",
      "Makes future appointment table cleanup smaller and easier to review.",
    ],
  },
  {
    version: "2.7.9",
    releaseDate: "2026-04-30",
    title: "Appointment Analytics Helper Foundation",
    summary:
      "This release adds reusable appointment analytics/count helpers for future dashboard, reports, QAPI summaries, and App.tsx cleanup.",
    capabilities: [
      "Added appointment analytics helpers at src/utils/appointmentAnalyticsHelpers.ts.",
      "Added count helpers for appointment status group, specialty, unit, provider, and transportation company.",
      "Added sorted count-row conversion and a combined appointment analytics summary helper.",
      "Exported the appointment analytics helpers through the appointment modal toolkit.",
      "Kept App.tsx behavior unchanged in this patch to avoid a broad rewrite.",
    ],
    processFlow: [
      "Use appointment analytics helpers in the next narrow dashboard, reports, QAPI summary, or App.tsx replacement patch.",
      "Continue replacing duplicated appointment analytics logic in small build-tested steps.",
    ],
    userImpact: [
      "Keeps appointment workflows stable while cleanup continues.",
      "Creates a shared analytics foundation for dashboard counts, reports, and QAPI summaries.",
      "Makes future appointment analytics cleanup smaller and easier to review.",
    ],
  },
  {
    version: "2.7.8",
    releaseDate: "2026-04-30",
    title: "Appointment Report Helper Foundation",
    summary:
      "This release adds reusable appointment report-row helpers for future reports, PDFs, tables, and App.tsx cleanup.",
    capabilities: [
      "Added appointment report helpers at src/utils/appointmentReportHelpers.ts.",
      "Added report-row conversion for appointment date, time, resident, unit, room, specialty, provider/location, status, transport, and notes.",
      "Added reusable appointment report column keys and column labels.",
      "Exported the appointment report helpers through the appointment modal toolkit.",
      "Kept App.tsx behavior unchanged in this patch to avoid a broad rewrite.",
    ],
    processFlow: [
      "Use appointment report helpers in the next narrow reports, PDF, table, or App.tsx replacement patch.",
      "Continue replacing duplicated appointment report formatting in small build-tested steps.",
    ],
    userImpact: [
      "Keeps appointment workflows stable while cleanup continues.",
      "Creates a shared report-row foundation for reports, PDFs, and tables.",
      "Makes future appointment report cleanup smaller and easier to review.",
    ],
  },
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
    ],
    processFlow: [
      "Use appointment display helpers in the next narrow App.tsx, reports, calendar, or appointment-table replacement patch.",
      "Continue replacing duplicated App.tsx display formatting in small build-tested steps.",
    ],
    userImpact: [
      "Keeps appointment workflows stable while cleanup continues.",
      "Creates a shared display-format foundation for appointment tables, cards, reports, and calendar views.",
      "Makes future appointment display cleanup smaller and easier to review.",
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
